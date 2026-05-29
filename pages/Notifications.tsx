import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Briefcase, CheckCircle, Clock,
  MessageSquare, MapPin, Sparkles, ChevronRight, XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

function distanceBadgeColor(km: number): string {
  if (km <= 20) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (km <= 100) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-gray-700/50 text-gray-400 border-gray-600/30';
}

const statusLabel: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Pending:  { label: 'Em análise',    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: <Clock size={12} /> },
  Accepted: { label: 'Match Aceito!', color: 'text-green-400 bg-green-500/10 border-green-500/20',  icon: <CheckCircle size={12} /> },
  Rejected: { label: 'Não selecionado', color: 'text-red-400 bg-red-500/10 border-red-500/20',     icon: <XCircle size={12} /> },
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tracking' | 'recommended'>('tracking');

  const [currentUser, setCurrentUser]             = useState<any>(null);
  const [myProfile, setMyProfile]                 = useState<any>(null);
  const [myFreelancerProfile, setMyFreelancerProfile] = useState<any>(null);

  // Freelancer side: my applications
  const [myApplications, setMyApplications]       = useState<any[]>([]);
  // Producer side: candidates on my jobs
  const [myCandidates, setMyCandidates]           = useState<any[]>([]);
  // Recommended jobs
  const [recommendedJobs, setRecommendedJobs]     = useState<any[]>([]);
  const [myMatches, setMyMatches]                 = useState<any[]>([]);

  const [loading, setLoading]                     = useState(true);
  const [actionLoading, setActionLoading]         = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }
      setCurrentUser(user);

      // Fetch own profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setMyProfile(profile);

      const { data: freelaProfile } = await supabase.from('freelancer_profiles').select('*').eq('id', user.id).single();
      setMyFreelancerProfile(freelaProfile);

      // ── Freelancer side: my applications ──
      const { data: appRaw } = await supabase
        .from('matches')
        .select('*')
        .eq('freelancer_id', user.id);

      if (appRaw && appRaw.length > 0) {
        const enriched = await Promise.all(
          appRaw.map(async (m: any) => {
            const { data: job } = await supabase.from('jobs').select('*, author:profiles(*)').eq('id', m.job_id).single();
            return { ...m, job };
          })
        );
        setMyApplications(enriched);
      } else {
        setMyApplications([]);
      }

      // ── Producer side: candidates on my jobs ──
      const { data: myJobs } = await supabase.from('jobs').select('id, title').eq('author_id', user.id);
      if (myJobs && myJobs.length > 0) {
        const jobIds = myJobs.map((j: any) => j.id);
        const { data: candidatesRaw } = await supabase
          .from('matches')
          .select('*')
          .in('job_id', jobIds);

        if (candidatesRaw && candidatesRaw.length > 0) {
          const enriched = await Promise.all(
            candidatesRaw.map(async (m: any) => {
              const { data: fp } = await supabase.from('freelancer_profiles').select('*').eq('id', m.freelancer_id).single();
              const { data: p }  = await supabase.from('profiles').select('*').eq('id', m.freelancer_id).single();
              const job = myJobs.find((j: any) => j.id === m.job_id);
              return { ...m, freelancer: p, freelancer_profile: fp, job };
            })
          );
          setMyCandidates(enriched);
        } else {
          setMyCandidates([]);
        }
      }

      // ── Recommended jobs: matching any of the freelancer's funcoes ──
      const funcoes: string[] = freelaProfile?.funcoes || (profile?.role ? [profile.role] : []);
      if (funcoes.length > 0) {
        const { data: allJobs } = await supabase
          .from('jobs')
          .select('*, author:profiles(*)')
          .eq('status', 'Open')
          .neq('author_id', user.id);

        const { data: existingMatches } = await supabase.from('matches').select('job_id').eq('freelancer_id', user.id);
        const appliedIds = new Set((existingMatches || []).map((m: any) => m.job_id));
        setMyMatches(existingMatches || []);

        const matched = (allJobs || []).filter((j: any) => funcoes.includes(j.role));
        const withDist = matched.map((j: any) => ({
          ...j,
          alreadyApplied: appliedIds.has(j.id),
          distance: (freelaProfile?.latitude && freelaProfile?.longitude && j.latitude && j.longitude)
            ? getDistance(freelaProfile.latitude, freelaProfile.longitude, j.latitude, j.longitude)
            : null,
        })).sort((a: any, b: any) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
        setRecommendedJobs(withDist);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAccept = async (matchId: string) => {
    setActionLoading(matchId);
    try {
      await supabase.from('matches').update({ status: 'Accepted' }).eq('id', matchId);
      await fetchAll();
      navigate(`/chat?id=${matchId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao aceitar freela.');
      setActionLoading(null);
    }
  };

  const handleReject = async (matchId: string) => {
    setActionLoading(matchId);
    try {
      await supabase.from('matches').update({ status: 'Rejected' }).eq('id', matchId);
      await fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInterest = async (jobId: string) => {
    if (!currentUser) return;
    setActionLoading(jobId);
    try {
      await supabase.from('matches').insert({ job_id: jobId, freelancer_id: currentUser.id, status: 'Pending' });
      await fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCandidates = myCandidates.filter(m => m.status === 'Pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-[#8A2BE2] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 space-y-5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full text-white transition-all">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              <Bell size={18} className="inline mr-2 text-[#8A2BE2]" />
              Notificações
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 p-1.5 rounded-[22px] border border-white/5">
          {(['tracking', 'recommended'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                ${activeTab === tab ? 'bg-[#8A2BE2] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              {tab === 'tracking'
                ? (<><Clock size={12} /> Acompanhamento {pendingCandidates.length > 0 && <span className="bg-white text-[#8A2BE2] text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingCandidates.length}</span>}</>)
                : (<><Sparkles size={12} /> Vagas para mim {recommendedJobs.length > 0 && <span className="bg-white text-[#8A2BE2] text-[9px] font-black px-1.5 py-0.5 rounded-full">{recommendedJobs.length}</span>}</>)
              }
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 py-8 space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">

        {/* ── TRACKING TAB ── */}
        {activeTab === 'tracking' && (
          <div className="space-y-8">

            {/* Producer section: incoming candidates */}
            {myCandidates.length > 0 && (
              <section className="space-y-4">
                <div className="px-2">
                  <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Candidatos nas suas Vagas</h2>
                </div>
                {myCandidates.map(m => {
                  const status = statusLabel[m.status] || statusLabel.Pending;
                  const isAccepted = m.status === 'Accepted';
                  return (
                    <div key={m.id} className="bg-[#1A1A1A] border border-white/5 rounded-[28px] p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={m.freelancer?.avatar_url || `https://picsum.photos/200/200?random=${m.freelancer_id}`}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-black text-white text-sm truncate">
                              {m.freelancer?.first_name} {m.freelancer?.last_name}
                            </h3>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border flex items-center gap-1 shrink-0 ${status.color}`}>
                              {status.icon}{status.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(m.freelancer_profile?.funcoes || []).map((fn: string, i: number) => (
                              <span key={i} className="text-[9px] font-black text-[#8A2BE2] bg-[#8A2BE2]/10 px-1.5 py-0.5 rounded-md border border-[#8A2BE2]/20 uppercase">
                                {fn}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                            {m.freelancer_profile?.bio || 'Sem bio cadastrada.'}
                          </p>
                          <p className="text-[10px] text-gray-600 mt-1 font-bold uppercase tracking-wider">
                            Vaga: <span className="text-gray-400">{m.job?.title}</span>
                          </p>
                        </div>
                      </div>

                      {!isAccepted && m.status !== 'Rejected' && (
                        <div className="flex gap-3 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleReject(m.id)}
                            disabled={actionLoading === m.id}
                            className="flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-gray-400 hover:border-red-500/50 hover:text-red-400 transition-all"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => handleAccept(m.id)}
                            disabled={actionLoading === m.id}
                            className="flex-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#8A2BE2] text-white hover:bg-[#9D4EDD] transition-all shadow-lg shadow-purple-950/30 flex items-center gap-2"
                          >
                            <MessageSquare size={13} />
                            {actionLoading === m.id ? 'Processando...' : 'Aceitar Freela'}
                          </button>
                        </div>
                      )}

                      {isAccepted && (
                        <div className="flex gap-3 pt-2 border-t border-white/5">
                          <button
                            onClick={() => navigate(`/chat?id=${m.id}`)}
                            className="flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={13} /> Abrir Conversa
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* Freelancer section: my applications */}
            {myApplications.length > 0 && (
              <section className="space-y-4">
                <div className="px-2">
                  <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Minhas Candidaturas</h2>
                </div>
                {myApplications.map(m => {
                  const status = statusLabel[m.status] || statusLabel.Pending;
                  const isAccepted = m.status === 'Accepted';
                  return (
                    <div
                      key={m.id}
                      className="bg-[#1A1A1A] border border-white/5 rounded-[28px] p-5 flex items-center gap-4 cursor-pointer hover:border-[#8A2BE2]/30 transition-all"
                      onClick={() => navigate(`/jobs/${m.job_id}`)}
                    >
                      <div className="p-3 bg-white/5 rounded-2xl text-gray-400 shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-white text-sm truncate">{m.job?.title}</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {m.job?.author?.first_name} {m.job?.author?.last_name} · {m.job?.location}
                        </p>
                        <span className={`mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${status.color}`}>
                          {status.icon}{status.label}
                        </span>
                      </div>
                      {isAccepted ? (
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/chat?id=${m.id}`); }}
                          className="shrink-0 p-2.5 bg-green-500/20 text-green-400 rounded-2xl hover:bg-green-500/30 transition-all border border-green-500/20"
                        >
                          <MessageSquare size={18} />
                        </button>
                      ) : (
                        <ChevronRight size={18} className="text-gray-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {myCandidates.length === 0 && myApplications.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-[40px] border border-white/5 border-dashed space-y-4">
                <Bell size={40} className="mx-auto text-gray-600" />
                <div>
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma atividade ainda</p>
                  <p className="text-gray-600 text-[10px] mt-1">Candidate-se a vagas ou publique oportunidades para ver notificações aqui.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RECOMMENDED JOBS TAB ── */}
        {activeTab === 'recommended' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                Vagas que combinam com seu perfil
              </h2>
              <span className="text-xs font-medium text-[#8A2BE2]">{recommendedJobs.length} encontradas</span>
            </div>

            {recommendedJobs.length > 0 ? (
              <div className="space-y-4">
                {recommendedJobs.map(job => (
                  <div
                    key={job.id}
                    className="group bg-[#1A1A1A] border border-white/5 rounded-[32px] p-6 space-y-4 hover:border-[#8A2BE2]/30 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-[#8A2BE2] uppercase tracking-[0.2em]">{job.type}</span>
                          {job.distance !== null && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${distanceBadgeColor(job.distance)}`}>
                              📍 {formatDistance(job.distance)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-[#8A2BE2] transition-colors tracking-tight truncate">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 font-bold">
                          <Briefcase size={12} /> {job.role}
                          <span className="text-gray-600">·</span>
                          <MapPin size={12} /> {job.location}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-white">{job.value}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                        <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center font-black text-[10px]">
                          {(job.author?.first_name || 'U').charAt(0)}
                        </div>
                        {job.author?.first_name} {job.author?.last_name}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); if (!job.alreadyApplied) handleInterest(job.id); }}
                        disabled={job.alreadyApplied || actionLoading === job.id}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                          ${job.alreadyApplied
                            ? 'bg-[#8A2BE2]/10 text-[#8A2BE2] border border-[#8A2BE2]/20'
                            : 'bg-white text-black hover:bg-[#8A2BE2] hover:text-white shadow-lg'}`}
                      >
                        {job.alreadyApplied ? 'Interesse Enviado' : actionLoading === job.id ? '...' : 'Tenho Interesse'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-[40px] border border-white/5 border-dashed space-y-4">
                <Sparkles size={40} className="mx-auto text-gray-600" />
                <div>
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma vaga recomendada</p>
                  <p className="text-gray-600 text-[10px] mt-1">Configure seu perfil com suas funções para receber sugestões personalizadas.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;
