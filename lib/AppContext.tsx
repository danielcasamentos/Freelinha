import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { playNotificationSound, decryptAndUnpack } from './crypto';

interface AppContextType {
  currentUser: any;
  myProfile: any;
  myFreelancerProfile: any;
  vacancies: any[];
  freelancers: any[];
  myMatches: any[];
  loading: boolean;
  refetchAll: () => Promise<void>;
  pendingCount: number;
  toast: { message: string; type: 'success' | 'info' | 'match' } | null;
  showToast: (message: string, type: 'success' | 'info' | 'match') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [myFreelancerProfile, setMyFreelancerProfile] = useState<any>(null);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'match' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'match') => {
    setToast({ message, type });
    playNotificationSound();
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUser(null);
        setMyProfile(null);
        setMyFreelancerProfile(null);
        setLoading(false);
        return;
      }
      setCurrentUser(user);

      // Fetch own profile and freelancer profile in parallel
      const [profileRes, freelaRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('freelancer_profiles').select('*').eq('id', user.id).maybeSingle()
      ]);

      if (profileRes.data) setMyProfile(profileRes.data);
      if (freelaRes.data) setMyFreelancerProfile(freelaRes.data);

      // Fetch all jobs (non-deleted), freelancers, and matches in parallel
      const today = new Date().toISOString().split('T')[0];
      const [jobsRes, freelancersRes, matchesRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('*, author:profiles(*)')
          .is('deleted_at', null),
        supabase.from('freelancer_profiles').select('*, profile:profiles(*)'),
        supabase.from('matches').select('*')
      ]);

      if (jobsRes.data) {
        // Filter out past-date jobs from the feed (they are expired)
        const activeJobs = jobsRes.data.filter((job: any) => {
          if (!job.date) return true; // no date = always shown
          return job.date >= today;
        });
        setVacancies(activeJobs);

        // Silently soft-delete any expired jobs authored by this user
        const myExpiredJobs = jobsRes.data.filter((job: any) =>
          job.author_id === user.id &&
          job.date &&
          job.date < today &&
          !job.deleted_at
        );
        if (myExpiredJobs.length > 0) {
          // Fire-and-forget soft delete — don't block the UI
          Promise.all(
            myExpiredJobs.map((job: any) =>
              supabase
                .from('jobs')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', job.id)
            )
          ).catch(console.error);
        }
      }
      if (freelancersRes.data) {
        setFreelancers(freelancersRes.data);
      }

      // Filter matches related to this user
      if (matchesRes.data && jobsRes.data) {
        const myJobIds = jobsRes.data
          .filter((job: any) => job.author_id === user.id)
          .map((job: any) => job.id);

        const filteredMatches = matchesRes.data.filter((match: any) => 
          match.freelancer_id === user.id || myJobIds.includes(match.job_id)
        );
        setMyMatches(filteredMatches);

        // Count pending candidates on my jobs
        const pending = matchesRes.data.filter((match: any) => 
          myJobIds.includes(match.job_id) && match.status === 'Pending'
        );
        setPendingCount(pending.length);
      }
    } catch (err) {
      console.error('Error fetching global AppContext data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();

    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setMyProfile(null);
        setMyFreelancerProfile(null);
        setMyMatches([]);
        setPendingCount(0);
        setVacancies([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('freelinha-realtime-global')
      // Sub to jobs
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the author profile to enrich the job
            const { data: author } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.author_id)
              .single();
            const enrichedJob = { ...payload.new, author };

            setVacancies((prev) => {
              if (prev.some((j) => j.id === enrichedJob.id)) return prev;
              return [enrichedJob, ...prev];
            });

            // Trigger silent notification if it's not my own job
            if (payload.new.author_id !== currentUser.id) {
              showToast(`Nova vaga publicada: "${payload.new.title}"`, 'info');
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data: author } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.author_id)
              .single();
            const enrichedJob = { ...payload.new, author };

            setVacancies((prev) =>
              prev.map((j) => (j.id === payload.new.id ? enrichedJob : j))
            );
          } else if (payload.eventType === 'UPDATE' && payload.new.deleted_at) {
            // Treat soft-delete (deleted_at set) as removal from the feed
            setVacancies((prev) => prev.filter((j) => j.id !== payload.new.id));
          } else if (payload.eventType === 'DELETE') {
            setVacancies((prev) => prev.filter((j) => j.id !== payload.old.id));
          }
        }
      )
      // Sub to matches
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Check relevance
            const match = payload.new;
            const { data: job } = await supabase
              .from('jobs')
              .select('title, author_id')
              .eq('id', match.job_id)
              .single();

            const isMyJob = job && job.author_id === currentUser.id;
            const isMyCandidature = match.freelancer_id === currentUser.id;

            if (isMyJob || isMyCandidature) {
              setMyMatches((prev) => {
                if (prev.some((m) => m.id === match.id)) return prev;
                return [...prev, match];
              });

              if (isMyJob) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('id', match.freelancer_id)
                  .single();
                const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Um profissional';
                showToast(`${name} se interessou pela sua vaga "${job.title}"!`, 'match');
                setPendingCount((prev) => prev + 1);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const match = payload.new;
            const oldMatch = payload.old;
            
            const { data: job } = await supabase
              .from('jobs')
              .select('title, author_id')
              .eq('id', match.job_id)
              .single();

            const isMyJob = job && job.author_id === currentUser.id;
            const isMyCandidature = match.freelancer_id === currentUser.id;

            if (isMyJob || isMyCandidature) {
              setMyMatches((prev) =>
                prev.map((m) => (m.id === match.id ? match : m))
              );

              // Match accepted real-time notification
              if (match.status === 'Accepted' && payload.old.status !== 'Accepted') {
                if (isMyCandidature) {
                  showToast(`Parabéns! Seu match para a vaga "${job.title}" foi aceito!`, 'match');
                } else if (isMyJob) {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', match.freelancer_id)
                    .single();
                  const name = profile ? `${profile.first_name} ${profile.last_name}` : 'O profissional';
                  showToast(`Match fechado com ${name} para a vaga "${job.title}"!`, 'match');
                }
              }

              // Adjust pending counts
              if (isMyJob) {
                // If resolved, decrement
                if (match.status !== 'Pending') {
                  setPendingCount((prev) => Math.max(0, prev - 1));
                }
              }
            }
          }
        }
      )
      // Sub to messages
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload: any) => {
          const msg = payload.new;
          if (msg.sender_id === currentUser.id) return; // ignore my own

          // Check if this message is in a match room I am part of
          const { data: match } = await supabase
            .from('matches')
            .select('id, freelancer_id, job_id')
            .eq('id', msg.match_id)
            .single();

          if (match) {
            const { data: job } = await supabase
              .from('jobs')
              .select('author_id')
              .eq('id', match.job_id)
              .single();

            const isParticipant = match.freelancer_id === currentUser.id || (job && job.author_id === currentUser.id);
            if (isParticipant) {
              // Play chime
              playNotificationSound();

              // Get sender name
              const { data: sender } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', msg.sender_id)
                .single();

              const name = sender ? `${sender.first_name} ${sender.last_name}` : 'Alguém';
              
              // Only toast if we're not currently looking at the chat page for this match
              const onChatPage = window.location.hash.includes(`/chat?id=${match.id}`) || window.location.hash.includes(`/chat`);
              if (!onChatPage) {
                // Read decryption
                let plainText = msg.text || '';
                try {
                  plainText = decryptAndUnpack(plainText);
                } catch {}
                showToast(`Mensagem de ${name}: "${plainText.substring(0, 30)}${plainText.length > 30 ? '...' : ''}"`, 'info');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, showToast]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        myProfile,
        myFreelancerProfile,
        vacancies,
        freelancers,
        myMatches,
        loading,
        refetchAll: fetchData,
        pendingCount,
        toast,
        showToast
      }}
    >
      {children}

      {/* Floating Global Toast */}
      {toast && (
        <div className="fixed top-6 left-6 right-6 z-[9999] max-w-sm mx-auto pointer-events-none animate-in slide-in-from-top duration-300">
          <div className="bg-[#1A1A1A]/95 border border-[#8A2BE2]/30 backdrop-blur-xl rounded-[24px] p-4 flex items-center gap-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto">
            <div className={`p-2 rounded-xl shrink-0 ${
              toast.type === 'match' 
                ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                : 'bg-[#8A2BE2]/20 border border-[#8A2BE2]/30 text-[#8A2BE2]'
            }`}>
              {toast.type === 'match' ? '⚡️' : '🔔'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                {toast.type === 'match' ? 'Novo Match' : 'Aviso'}
              </p>
              <p className="text-sm font-bold text-white leading-tight mt-0.5">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};
