
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Briefcase, Calendar, DollarSign, 
  Users, Star, ShieldCheck, Lock, Sparkles, MessageSquare
} from 'lucide-react';
import { MOCK_VACANCIES, MOCK_FREELANCERS, CURRENT_USER } from '../constants';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const job = MOCK_VACANCIES.find(v => v.id === id);

  const recommendedFreelas = useMemo(() => {
    if (!job) return [];
    return MOCK_FREELANCERS
      .filter(f => f.funcoes.includes(job.role))
      .sort((a, b) => b.rate - a.rate);
  }, [job]);

  if (!job) return <div>Vaga não encontrada</div>;

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-32">
      <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full text-white transition-all">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Detalhes da <span className="text-[#8A2BE2]">Vaga</span></h1>
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
          </div>

          <div className="space-y-3">
             <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Descrição do Job</h3>
             <p className="text-gray-400 text-sm leading-relaxed">
                {job.description}
             </p>
          </div>
        </section>

        {/* Smart Suggestions Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
                <h3 className="text-lg font-black text-white">Sugestões de Elite</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Os melhores profissionais para este cargo</p>
            </div>
          </div>

          <div className="relative">
            {/* The List */}
            <div className="space-y-4">
              {recommendedFreelas.map(freela => (
                <div key={freela.id} className="bg-white/5 border border-white/5 rounded-[28px] p-4 flex items-center gap-4">
                  <img src={freela.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/10" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-white">{freela.nomeCompleto}</h4>
                        <div className="flex items-center gap-1">
                            <Star size={12} fill="#8A2BE2" color="#8A2BE2" />
                            <span className="text-xs font-black text-white">{freela.rate}</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{freela.funcoes[0]}</p>
                  </div>
                  <button className="p-3 bg-white/5 rounded-2xl text-white hover:bg-[#8A2BE2] transition-all">
                    <MessageSquare size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default JobDetails;
