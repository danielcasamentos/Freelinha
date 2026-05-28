
import React, { useState, useMemo } from 'react';
import { Search, MapPin, SlidersHorizontal, Sparkles, Lock, ShieldCheck, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_FREELANCERS, MAIN_ROLES, SPECIALTIES, CURRENT_USER } from '../constants';
import FreelancerCard from '../components/FreelancerCard';
import Input from '../components/Input';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import Select from '../components/Select';

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter States
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const filteredFreelancers = useMemo(() => {
    return MOCK_FREELANCERS.filter(f => {
      const matchesSearch = 
        searchTerm === '' ||
        f.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.funcoes.some(func => func.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;
      if (selectedRole && !f.funcoes.includes(selectedRole)) return false;
      if (selectedSpecialty && !f.specialties?.includes(selectedSpecialty)) return false;
      if (location && !f.regiao.toLowerCase().includes(location.toLowerCase())) return false;

      return true;
    });
  }, [searchTerm, selectedRole, selectedSpecialty, location]);

  const eliteFreelancers = useMemo(() => {
    return MOCK_FREELANCERS.filter(f => f.rate >= 4.8).slice(0, 5);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                Explore <span className="text-[#8A2BE2]">Freelas</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-black tracking-[0.2em] uppercase mt-1">Os Melhores do Audiovisual</p>
            </div>
            <div className="flex gap-2">
                <button className="bg-white/5 border border-white/10 p-3 rounded-2xl text-gray-400 hover:text-white transition-all">
                    <SlidersHorizontal size={20} />
                </button>
            </div>
        </div>

        <div className="flex gap-3">
            <div className="flex-1">
                <Input 
                    placeholder="Busque por nome, cargo..." 
                    icon={<Search size={20} className="text-gray-500" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-[#8A2BE2]/50"
                />
            </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-10 max-w-2xl mx-auto">
        
        {/* Elite Section */}
        <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#8A2BE2]" />
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Sugestões de Elite</h2>
                </div>
                {!CURRENT_USER.isPro && (
                    <span className="text-[9px] font-black text-[#8A2BE2] uppercase tracking-widest">Apenas PRO</span>
                )}
            </div>

            <div className="relative">
                <div className={`flex gap-4 overflow-x-auto pb-4 scrollbar-hide ${!CURRENT_USER.isPro ? 'blur-md pointer-events-none select-none opacity-50' : ''}`}>
                    {eliteFreelancers.map(f => (
                        <div 
                            key={f.id} 
                            onClick={() => navigate(`/profile/${f.username}`)}
                            className="min-w-[160px] bg-white/5 border border-white/5 rounded-[32px] p-5 flex flex-col items-center gap-3 cursor-pointer hover:bg-white/10 transition-all shadow-xl"
                        >
                            <div className="relative">
                                <img src={f.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#8A2BE2]" />
                                <div className="absolute -top-1 -right-1 bg-[#8A2BE2] p-1 rounded-full border-2 border-[#121212]">
                                    <Star size={10} fill="white" color="white" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="text-xs font-black text-white truncate w-full max-w-[120px]">{f.nomeCompleto}</h4>
                                <p className="text-[9px] text-[#8A2BE2] font-bold uppercase mt-0.5">{f.funcoes[0]}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {!CURRENT_USER.isPro && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div 
                            onClick={() => navigate('/my-profile')}
                            className="bg-[#8A2BE2] hover:bg-[#9D4EDD] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Lock size={14} />
                            Desbloquear Elite
                        </div>
                    </div>
                )}
            </div>
        </section>

        {/* Regular Feed */}
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Todos os Profissionais</h2>
                <span className="text-xs font-medium text-[#8A2BE2]">{filteredFreelancers.length} encontrados</span>
            </div>

            <div className="space-y-2">
                {filteredFreelancers.map(freelancer => (
                    <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                ))}
            </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Feed;
