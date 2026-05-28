
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, MapPin, Briefcase, Filter, Plus, Info, CheckCircle2, 
    Sparkles, LayoutGrid, Users, ShieldCheck, Star, Lock 
} from 'lucide-react';
import { MOCK_VACANCIES, MOCK_FREELANCERS, CURRENT_USER } from '../constants';
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
  const [interestedJobs, setInterestedJobs] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vagas' | 'profissionais' | 'minhas'>('vagas');
  
  // GPS State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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
    return MOCK_VACANCIES.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // GPS Distance Filter
      if (userLocation && job.coordinates) {
        const distance = getDistance(userLocation.lat, userLocation.lng, job.coordinates.lat, job.coordinates.lng);
        if (distance > radius) return false;
      }

      return true;
    });
  }, [searchTerm, userLocation, radius]);

  // Filtering Logic for Freelancers
  const filteredFreelancers = useMemo(() => {
    return MOCK_FREELANCERS.filter(f => {
      const matchesSearch = 
        f.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.funcoes.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()));
        
      if (!matchesSearch) return false;

      // GPS Distance Filter
      if (userLocation && f.coordinates) {
        const distance = getDistance(userLocation.lat, userLocation.lng, f.coordinates.lat, f.coordinates.lng);
        if (distance > radius) return false;
      }

      return true;
    });
  }, [searchTerm, userLocation, radius]);

  const eliteFreelancers = useMemo(() => {
    return MOCK_FREELANCERS.filter(f => f.rate >= 4.8).slice(0, 5);
  }, []);

  const handleInterest = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!interestedJobs.includes(jobId)) {
      setInterestedJobs([...interestedJobs, jobId]);
    }
  };

  const myJobs = MOCK_VACANCIES.filter(v => v.authorId === 'user_123' || v.authorId === 'me');

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
        onClose={() => setIsModalOpen(false)} 
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
                        {filteredJobs.map(job => (
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
                                        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center font-black text-[10px]">{job.authorName.charAt(0)}</div>
                                        {job.authorName}
                                    </div>
                                    <button onClick={(e) => handleInterest(e, job.id)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${interestedJobs.includes(job.id) ? 'bg-green-500/10 text-green-400' : 'bg-white text-black hover:bg-[#8A2BE2] hover:text-white shadow-lg'}`}>
                                        {interestedJobs.includes(job.id) ? 'MATCH!' : 'TENHO INTERESSE'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        )}

        {/* --- PROFISSIONAIS TAB --- */}
        {activeTab === 'profissionais' && (
            <div className="space-y-10">
                {/* Elite Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-[#8A2BE2]" />
                            <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Sugestões de Elite</h2>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {eliteFreelancers.map(f => (
                                <div key={f.id} onClick={() => navigate(`/profile/${f.username}`)} className="min-w-[160px] bg-white/5 border border-white/5 rounded-[32px] p-5 flex flex-col items-center gap-3 cursor-pointer hover:bg-white/10 transition-all">
                                    <div className="relative">
                                        <img src={f.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#8A2BE2]" />
                                        <div className="absolute -top-1 -right-1 bg-[#8A2BE2] p-1 rounded-full border-2 border-[#121212]"><Star size={10} fill="white" color="white" /></div>
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xs font-black text-white truncate w-[120px]">{f.nomeCompleto}</h4>
                                        <p className="text-[9px] text-[#8A2BE2] font-bold uppercase mt-0.5">{f.funcoes[0]}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Todos os Profissionais</h2>
                        <span className="text-xs font-medium text-[#8A2BE2]">{filteredFreelancers.length} encontrados</span>
                    </div>
                    <div className="space-y-2">
                        {filteredFreelancers.map(f => <FreelancerCard key={f.id} freelancer={f} />)}
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
                                <div className="flex items-center gap-1"><Users size={14} /><span>Sugestões Prontas</span></div>
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
