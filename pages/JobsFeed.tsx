import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, MapPin, Briefcase, Filter, Plus, Info, CheckCircle2, 
    Sparkles, LayoutGrid, Users, ShieldCheck, Star, Lock, PhoneOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import Input from '../components/Input';
import Button from '../components/Button';
import CreateJobModal from '../components/CreateJobModal';
import FreelancerCard from '../components/FreelancerCard';

// Haversine formula to calculate distance between two coordinates in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [radius, setRadius] = useState(50); // km
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vagas' | 'profissionais' | 'minhas'>('vagas');
  
  // Real Database States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // GPS State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchCurrentUserAndData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      // Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentUser(profile);

      // Fetch Jobs (Vagas)
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, author:profiles(*)');
      setVacancies(jobs || []);

      // Fetch Freelancers
      const { data: freelas } = await supabase
        .from('freelancer_profiles')
        .select('*, profile:profiles(*)');
      setFreelancers(freelas || []);

      // Fetch Matches where this user is the freelancer
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('freelancer_id', user.id);
      setMyMatches(matches || []);

    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUserAndData();
  }, []);

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Não foi possível acessar a localização.");
          setIsLocating(false);
        }
      );
    } else {
      setLocationError("Navegador não suporta geolocalização.");
      setIsLocating(false);
    }
  };

  // Filtering Logic for Jobs
  const filteredJobs = useMemo(() => {
    return vacancies.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // GPS Distance Filter
      if (userLocation && job.latitude && job.longitude) {
        const distance = getDistance(userLocation.lat, userLocation.lng, job.latitude, job.longitude);
        if (distance > radius) return false;
      }

      return true;
    });
  }, [searchTerm, userLocation, radius, vacancies]);

  // Filtering Logic for Freelancers
  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(f => {
      const nomeCompleto = `${f.profile?.first_name || ''} ${f.profile?.last_name || ''}`;
      const matchesSearch = 
        nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.funcoes && f.funcoes.some((role: string) => role.toLowerCase().includes(searchTerm.toLowerCase())));
        
      if (!matchesSearch) return false;

      // GPS Distance Filter
      if (userLocation && f.latitude && f.longitude) {
        const distance = getDistance(userLocation.lat, userLocation.lng, f.latitude, f.longitude);
        if (distance > radius) return false;
      }

      // Hide current user from freelancer search list
      if (currentUser && f.id === currentUser.id) return false;

      return true;
    });
  }, [searchTerm, userLocation, radius, freelancers, currentUser]);

  const eliteFreelancers = useMemo(() => {
    return freelancers
      .filter(f => f.rate >= 4.8 && (currentUser ? f.id !== currentUser.id : true))
      .slice(0, 5);
  }, [freelancers, currentUser]);

  const handleInterest = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!currentUser) return;

    const alreadyInterested = myMatches.some(m => m.job_id === jobId);
    if (alreadyInterested) return;

    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          job_id: jobId,
          freelancer_id: currentUser.id,
          status: 'Pending'
        })
        .select()
        .single();

      if (error) throw error;
      setMyMatches([...myMatches, data]);
      alert('Seu interesse foi enviado ao produtor! Aguardando Match.');
    } catch (err) {
      console.error('Error expressing interest:', err);
      alert('Não foi possível registrar o interesse.');
    }
  };

  const myJobs = useMemo(() => {
    if (!currentUser) return [];
    return vacancies.filter(v => v.author_id === currentUser.id);
  }, [vacancies, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-[#8A2BE2] rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Buscando informações do Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-32">
      {/* Unified Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                Central de <span className="text-[#8A2BE2]">Oportunidades</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-black tracking-[0.2em] uppercase mt-1">Marketplace Audiovisual</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#8A2BE2] hover:bg-[#9D4EDD] text-white p-3.5 rounded-2xl transition-all duration-300 shadow-[0_10px_25px_rgba(138,43,226,0.4)] hover:scale-110 active:scale-95 border border-white/10"
            >
                <Plus size={24} />
            </button>
        </div>

        {/* Tab Selector - Unified Menu */}
        <div className="flex bg-white/5 p-1.5 rounded-[22px] border border-white/5">
            <button 
                onClick={() => setActiveTab('vagas')}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vagas' ? 'bg-[#8A2BE2] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                Vagas
            </button>
            <button 
                onClick={() => setActiveTab('profissionais')}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profissionais' ? 'bg-[#8A2BE2] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                Freelas
            </button>
            <button 
                onClick={() => setActiveTab('minhas')}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'minhas' ? 'bg-[#8A2BE2] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                Postadas
            </button>
        </div>
      </header>

      <CreateJobModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchCurrentUserAndData();
        }} 
      />

      <main className="px-6 py-8 space-y-10 max-w-2xl mx-auto animate-in fade-in duration-500">
        
        {/* Search Bar - Common for Vagas and Profissionais */}
        {activeTab !== 'minhas' && (
            <div className="flex gap-3">
                <div className="flex-1">
                <Input 
                    placeholder={activeTab === 'vagas' ? "Busque por cargo, projeto..." : "Busque por nome, especialidade..."} 
                    icon={<Search size={20} className="text-gray-500" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-[#8A2BE2]/50"
                />
                </div>
                <button className="bg-white/5 border border-white/10 text-gray-400 p-3 rounded-xl hover:text-white transition-all">
                    <Filter size={20} />
                </button>
            </div>
        )}

        {/* --- VAGAS TAB --- */}
        {activeTab === 'vagas' && (
            <>
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between px-1 mb-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <MapPin size={16} className="text-[#8A2BE2]" />
                            Raio de busca: <span className="text-white">{radius}km</span>
                        </div>
                        <button 
                            onClick={requestLocation}
                            disabled={isLocating}
                            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border transition-all
                                ${userLocation ? 'bg-[#8A2BE2]/20 border-[#8A2BE2]/50 text-[#8A2BE2]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}
                            `}
                        >
                            {isLocating ? 'Buscando...' : userLocation ? 'GPS Ativo' : 'Usar GPS'}
                        </button>
                    </div>
                    {locationError && <p className="text-[#E3170D] text-[10px] font-bold px-1">{locationError}</p>}
                    <input 
                        type="range" min="5" max="500" value={radius}
                        onChange={(e) => setRadius(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#8A2BE2]"
                    />
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Oportunidades em Aberto</h2>
                        <span className="text-xs font-medium text-[#8A2BE2]">{filteredJobs.length} encontradas</span>
                    </div>

                    <div className="space-y-4">
                        {filteredJobs.map(job => {
                          const interestMatch = myMatches.find(m => m.job_id === job.id);
                          const isMatched = interestMatch?.status === 'Accepted';
                          const isPending = interestMatch?.status === 'Pending';
                          
                          return (
                            <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="group bg-[#1A1A1A] border border-white/5 rounded-[32px] p-6 transition-all duration-500 hover:border-[#8A2BE2]/30 hover:bg-[#222] shadow-2xl cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-[#8A2BE2] uppercase tracking-[0.2em]">{job.type}</span>
                                        <h3 className="text-xl font-black text-white group-hover:text-[#8A2BE2] transition-colors tracking-tight">{job.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-400 font-bold">
                                            <Briefcase size={14} />
                                            {job.role}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-white">{job.value}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{job.location}</div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center font-black text-[10px]">
                                          {(job.author?.first_name || 'U').charAt(0)}
                                        </div>
                                        {job.author ? `${job.author.first_name} ${job.author.last_name}` : 'Usuário'}
                                    </div>
                                    <button 
                                      onClick={(e) => handleInterest(e, job.id)} 
                                      disabled={!!interestMatch}
                                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all 
                                        ${isMatched 
                                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                          : isPending 
                                            ? 'bg-[#8A2BE2]/10 text-[#8A2BE2] border border-[#8A2BE2]/20' 
                                            : 'bg-white text-black hover:bg-[#8A2BE2] hover:text-white shadow-lg'}`}
                                    >
                                        {isMatched ? 'MATCH CONCLUÍDO!' : isPending ? 'INTERESSE ENVIADO' : 'TENHO INTERESSE'}
                                    </button>
                                </div>
                            </div>
                          );
                        })}
                    </div>
                </div>
            </>
        )}

        {/* --- PROFISSIONAIS TAB --- */}
        {activeTab === 'profissionais' && (
            <div className="space-y-10">
                {/* Elite Section */}
                {eliteFreelancers.length > 0 && (
                  <section className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                              <ShieldCheck size={18} className="text-[#8A2BE2]" />
                              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Sugestões de Elite</h2>
                          </div>
                      </div>
                      <div className="relative">
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                              {eliteFreelancers.map(f => {
                                  const name = `${f.profile?.first_name || ''} ${f.profile?.last_name || ''}`;
                                  return (
                                    <div key={f.id} onClick={() => navigate(`/profile/${f.profile?.username}`)} className="min-w-[160px] bg-white/5 border border-white/5 rounded-[32px] p-5 flex flex-col items-center gap-3 cursor-pointer hover:bg-white/10 transition-all">
                                        <div className="relative">
                                            <img src={f.profile?.avatar_url || 'https://picsum.photos/200/200?random=1'} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#8A2BE2]" />
                                            <div className="absolute -top-1 -right-1 bg-[#8A2BE2] p-1 rounded-full border-2 border-[#121212]"><Star size={10} fill="white" color="white" /></div>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-xs font-black text-white truncate w-[120px]">{name}</h4>
                                            <p className="text-[9px] text-[#8A2BE2] font-bold uppercase mt-0.5">{f.funcoes?.[0] || 'Profissional'}</p>
                                        </div>
                                    </div>
                                  );
                              })}
                          </div>
                      </div>
                  </section>
                )}

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Todos os Profissionais</h2>
                        <span className="text-xs font-medium text-[#8A2BE2]">{filteredFreelancers.length} encontrados</span>
                    </div>
                    <div className="space-y-2">
                        {filteredFreelancers.map(f => (
                          <FreelancerCard 
                            key={f.id} 
                            freelancer={{
                              id: f.id,
                              username: f.profile?.username,
                              nomeCompleto: `${f.profile?.first_name} ${f.profile?.last_name}`,
                              funcoes: f.funcoes,
                              specialties: f.specialties,
                              regiao: `${f.profile?.city}, ${f.profile?.state}`,
                              bio: f.bio,
                              portfolioLinks: f.portfolio_links || {},
                              whatsapp: 'Oculto até Match', // Hidden by default on list
                              faixaValor: `${f.min_price} - ${f.max_price} / Dia`,
                              currency: f.currency,
                              minPrice: f.min_price,
                              maxPrice: f.max_price,
                              services: [],
                              disponibilidade: f.disponibilidade,
                              rate: f.rate,
                              jobsCount: f.jobs_count,
                              avatarUrl: f.profile?.avatar_url
                            }} 
                          />
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- POSTADAS TAB --- */}
        {activeTab === 'minhas' && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Suas Vagas Publicadas</h2>
                </div>
                {myJobs.length > 0 ? myJobs.map(job => (
                    <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="bg-white/5 border border-white/5 rounded-[32px] p-6 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white group-hover:text-[#8A2BE2] transition-colors">{job.title}</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                <div className="flex items-center gap-1"><Users size={14} /><span>Clique para ver Interessados</span></div>
                                <div className="flex items-center gap-1"><LayoutGrid size={14} /><span>{job.status}</span></div>
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl text-gray-400 group-hover:bg-[#8A2BE2] group-hover:text-white transition-all shadow-lg">
                            <Sparkles size={20} />
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-white/5 rounded-[40px] border border-white/5 border-dashed space-y-6">
                        <Briefcase size={40} className="mx-auto text-gray-600" />
                        <div>
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma vaga postada</p>
                            <p className="text-gray-600 text-[10px] mt-1">Publique um job e ache o freela perfeito.</p>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)}>Criar minha primeira vaga</Button>
                    </div>
                )}
            </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;
