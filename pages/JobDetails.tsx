import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Briefcase, Calendar, DollarSign, 
  Users, Star, ShieldCheck, Lock, Sparkles, MessageSquare, Phone, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import CreateJobModal from '../components/CreateJobModal';

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchJobAndMatches = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setCurrentUser(user);

      // Fetch Job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*, author:profiles(*)')
        .eq('id', id)
        .single();
      
      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch matches first
      const { data: matchesRaw, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('job_id', id);

      if (!matchesError && matchesRaw && matchesRaw.length > 0) {
        // Enrich each match with profile + freelancer_profile
        const enriched = await Promise.all(
          matchesRaw.map(async (m) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', m.freelancer_id)
              .single();

            const { data: freelaProfile } = await supabase
              .from('freelancer_profiles')
              .select('*')
              .eq('id', m.freelancer_id)
              .single();

            return { ...m, freelancer: profile, freelancer_profile: freelaProfile };
          })
        );
        setMatches(enriched);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobAndMatches();
  }, [id]);

  const handleAcceptMatch = async (matchId: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('matches')
        .update({ status: 'Accepted' })
        .eq('id', matchId);

      if (error) throw error;
      // Navigate directly to chat after accepting
      navigate(`/chat?id=${matchId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao aceitar match.');
    } finally {
      setActionLoading(false);
    }
  };

  const isAuthor = useMemo(() => {
    return currentUser && job && job.author_id === currentUser.id;
  }, [currentUser, job]);

  // Check if current user (freelancer) has an accepted match for this job
  const hasAcceptedMatch = useMemo(() => {
    if (!currentUser) return false;
    return matches.some(m => m.freelancer_id === currentUser.id && m.status === 'Accepted');
  }, [currentUser, matches]);

  // Check if current user has any pending interest for this job
  const hasPendingInterest = useMemo(() => {
    if (!currentUser) return false;
    return matches.some(m => m.freelancer_id === currentUser.id && m.status === 'Pending');
  }, [currentUser, matches]);

  const handleExpressInterest = async () => {
    if (!currentUser || !job) return;
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('matches')
        .insert({
          job_id: job.id,
          freelancer_id: currentUser.id,
          status: 'Pending'
        });

      if (error) throw error;
      alert('Interesse enviado ao produtor! Aguardando aceite.');
      fetchJobAndMatches();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar interesse.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-[#8A2BE2] rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Carregando detalhes do job...</p>
        </div>
      </div>
    );
  }

  if (!job) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Vaga não encontrada</div>;

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-32">
      <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full text-white transition-all">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">Detalhes da <span className="text-[#8A2BE2]">Vaga</span></h1>
        </div>
        {isAuthor && (
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs font-black uppercase tracking-widest bg-[#8A2BE2] hover:bg-[#9D4EDD] text-white px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(138,43,226,0.3)] active:scale-95 animate-in fade-in duration-300"
          >
            Editar Vaga
          </button>
        )}
      </header>

      <main className="px-6 py-8 space-y-10 max-w-2xl mx-auto">
        {/* Job Info Card */}
        <section className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#8A2BE2]/10 blur-3xl rounded-full"></div>
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-[#8A2BE2] text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={12} />
                {job.type}
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">{job.title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/5 rounded-xl text-gray-400">
                    <MapPin size={18} />
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Local</p>
                    <p className="text-sm font-bold text-white">{job.location}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/5 rounded-xl text-gray-400">
                    <DollarSign size={18} />
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Investimento</p>
                    <p className="text-sm font-bold text-white">{job.value}</p>
                </div>
            </div>
            {job.date && (
              <div className="flex items-center gap-3 col-span-2">
                  <div className="p-2.5 bg-[#8A2BE2]/10 rounded-xl text-[#8A2BE2]">
                      <Calendar size={18} />
                  </div>
                  <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Data do Evento</p>
                      <p className="text-sm font-bold text-white">
                        {new Date(job.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                  </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
             <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Descrição do Job</h3>
             <p className="text-gray-400 text-sm leading-relaxed">
                {job.description}
             </p>
          </div>

          {/* Contact Details (Author of Job) */}
          <div className="pt-6 border-t border-white/5 space-y-3">
            <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Criador do Anúncio</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-sm">
                  {(job.author?.first_name || 'U').charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{job.author?.first_name} {job.author?.last_name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Produtor</p>
                </div>
              </div>

              {/* Private contact hidden until match */}
              {isAuthor ? (
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-xl bg-white/5">Seu Anúncio</span>
              ) : hasAcceptedMatch ? (
                <a 
                  href={`https://wa.me/55${(job.author?.phone || '').replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-950/20"
                >
                  <Phone size={14} /> WhatsApp
                </a>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                  <Lock size={12} className="text-[#8A2BE2]" />
                  <span>Telefone Oculto (Aguardando Match)</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Action Panel for Freelancers — hide for job owner */}
        {!isAuthor && !hasAcceptedMatch && !hasPendingInterest && (
          <Button fullWidth onClick={handleExpressInterest} disabled={actionLoading} className="bg-[#8A2BE2] hover:bg-[#9D4EDD] py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl">
            {actionLoading ? 'Processando...' : 'Tenho Interesse nesta Vaga'}
          </Button>
        )}

        {/* Smart Suggestions & Match Management (For Job Creator) */}
        {isAuthor && (
          <section className="space-y-6">
            <div className="px-2">
                <h3 className="text-lg font-black text-white">Interessados e Sugestões</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Profissionais que manifestaram interesse no seu job</p>
            </div>

            <div className="space-y-4">
              {matches.length > 0 ? (
                matches.map(m => {
                  const freelancerName = `${m.freelancer?.first_name} ${m.freelancer?.last_name}`;
                  const isAccepted = m.status === 'Accepted';

                  return (
                    <div key={m.id} className="bg-[#1A1A1A] border border-white/5 rounded-[28px] p-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img 
                            src={m.freelancer?.avatar_url || 'https://picsum.photos/200/200?random=1'} 
                            alt="" 
                            className="w-14 h-14 rounded-full object-cover border-2 border-white/10" 
                          />
                          <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-base">{freelancerName}</h4>
                                <span className="text-xs text-[#8A2BE2] font-black uppercase tracking-widest bg-[#8A2BE2]/10 px-2 py-0.5 rounded-md">
                                  {m.freelancer_profile?.funcoes?.[0] || 'Freelancer'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{m.freelancer_profile?.bio || 'Sem bio cadastrada.'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                              <Star size={14} fill="#8A2BE2" color="#8A2BE2" />
                              <span className="text-sm font-black text-white">{m.freelancer_profile?.rate || '5.0'}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {m.freelancer_profile?.jobs_count || 0} jobs
                          </span>
                        </div>
                      </div>

                      {/* Match Status Actions */}
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                          Valor Cobrado: <span className="text-white font-black">{m.freelancer_profile?.min_price} - {m.freelancer_profile?.max_price} / Dia</span>
                        </div>

                        {isAccepted ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-400 font-black uppercase tracking-widest bg-green-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-green-500/20">
                              <CheckCircle size={14} /> Match Aceito!
                            </span>
                            <a 
                              href={`https://wa.me/55${(m.freelancer?.phone || '').replace(/\D/g, '')}`}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"
                            >
                              <Phone size={18} />
                            </a>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => handleAcceptMatch(m.id)}
                            disabled={actionLoading}
                            className="bg-white text-black hover:bg-[#8A2BE2] hover:text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md"
                          >
                            Aceitar Freela
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Nenhum interessado ainda</p>
                  <p className="text-gray-600 text-xs mt-1">Divulgue sua vaga e aguarde os freelancers se candidatarem.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <CreateJobModal 
        isOpen={isEditModalOpen} 
        onClose={() => { 
          setIsEditModalOpen(false); 
          fetchJobAndMatches(); 
        }} 
        jobToEdit={job} 
      />

      <BottomNav />
    </div>
  );
};

export default JobDetails;
