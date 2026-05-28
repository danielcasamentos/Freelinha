
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Star, Instagram, Globe, Video, Linkedin, CheckCircle, MessageSquare,
  Clock, ShieldCheck, Zap, Heart, Award, Sparkles, Layout, Users, Wrench, Rocket, User
} from 'lucide-react';
import { MOCK_FREELANCERS } from '../constants';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';

const METRIC_LABELS: Record<string, string> = {
  qualidadeTecnica: 'Qualidade Técnica',
  pontualidade: 'Pontualidade',
  comunicacao: 'Comunicação',
  posturaSet: 'Postura no Set',
  equipamento: 'Equipamento',
  prazos: 'Prazos',
  confiabilidade: 'Confiabilidade',
  trabalhoEquipe: 'Trabalho em Equipe',
  resolucaoProblemas: 'Resolução de Probl.',
  comprometimento: 'Comprometimento'
};

const METRIC_ICONS: Record<string, any> = {
  qualidadeTecnica: Award,
  pontualidade: Clock,
  comunicacao: MessageSquare,
  posturaSet: User,
  equipamento: Wrench,
  prazos: Zap,
  confiabilidade: ShieldCheck,
  trabalhoEquipe: Users,
  resolucaoProblemas: Sparkles,
  comprometimento: Heart
};

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const freelancer = MOCK_FREELANCERS.find(f => f.username === username);

  if (!freelancer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Perfil não encontrado</h2>
        <Button onClick={() => navigate('/feed')}>Voltar ao Feed</Button>
      </div>
    );
  }

  const isAvailable = freelancer.disponibilidade === 'Disponível';

  // Calculate metrics display
  const mainReview = freelancer.reviews.find(r => r.metrics);
  const metrics = mainReview?.metrics;

  const handleStartChat = () => {
    const chatId = freelancer.id === '1' ? 'c1' : 'c2'; 
    navigate(`/chat?id=${chatId}`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-48 relative animate-in fade-in duration-300">
      {/* Header Image/Gradient */}
      <div className="h-48 bg-gradient-to-b from-[#8A2BE2]/30 via-[#8A2BE2]/5 to-[#121212] relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-black/60 transition-all z-10 shadow-lg"
        >
          <ArrowLeft size={22} />
        </button>
      </div>

      {/* Profile Header Content */}
      <div className="px-6 -mt-20 flex flex-col items-center relative z-0">
        <div className="relative group">
          <div className="absolute inset-0 bg-[#8A2BE2] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
          <img 
            src={freelancer.avatarUrl} 
            alt={freelancer.nomeCompleto} 
            className="w-36 h-36 rounded-full object-cover border-4 border-[#121212] shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10"
          />
          <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-4 border-[#121212] z-20 ${isAvailable ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`} />
        </div>

        <h1 className="mt-6 text-3xl font-black text-white text-center tracking-tight">{freelancer.nomeCompleto}</h1>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
            {freelancer.funcoes.map(f => (
                <span key={f} className="text-[#8A2BE2] text-[10px] font-black uppercase tracking-widest bg-[#8A2BE2]/10 px-3 py-1 rounded-full border border-[#8A2BE2]/20">
                    {f}
                </span>
            ))}
        </div>
        
        <div className="flex items-center gap-2 mt-4 text-gray-500 text-sm font-bold uppercase tracking-widest">
          <MapPin size={14} className="text-[#8A2BE2]" />
          <span>{freelancer.regiao}</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-sm">
          <div className="flex flex-col items-center p-5 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl group hover:border-[#8A2BE2]/30 transition-all duration-300">
            <div className="flex items-center gap-1.5 text-[#8A2BE2] mb-1">
              <Star size={24} fill="#8A2BE2" className="drop-shadow-[0_0_8px_rgba(138,43,226,0.5)]" />
              <span className="text-2xl font-black text-white tracking-tighter">{freelancer.rate}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Avaliação Média</span>
          </div>
          <div className="flex flex-col items-center p-5 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl group hover:border-[#8A2BE2]/30 transition-all duration-300">
             <div className="flex items-center gap-1.5 text-[#8A2BE2] mb-1">
              <Rocket size={24} className="drop-shadow-[0_0_8px_rgba(138,43,226,0.5)]" />
              <span className="text-2xl font-black text-white tracking-tighter">{freelancer.jobsCount}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Jobs Entregues</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 mt-12 space-y-12 max-w-2xl mx-auto">
        
        {/* Bio */}
        <section className="bg-white/5 rounded-3xl p-8 border border-white/5">
          <h3 className="text-sm font-black text-[#8A2BE2] uppercase tracking-[0.2em] mb-4">Apresentação</h3>
          <p className="text-gray-400 leading-relaxed font-medium">
            {freelancer.bio}
          </p>
        </section>

        {/* Detailed Metrics Radar-style list */}
        {metrics && (
          <section>
            <h3 className="text-sm font-black text-[#8A2BE2] uppercase tracking-[0.2em] mb-6 px-2">Análise de Competência</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(metrics).map(([key, value]) => {
                const Icon = METRIC_ICONS[key] || Sparkles;
                return (
                  <div key={key} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#8A2BE2]/10 rounded-lg text-[#8A2BE2] group-hover:bg-[#8A2BE2] group-hover:text-white transition-all">
                        <Icon size={18} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{METRIC_LABELS[key]}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <div 
                            key={star} 
                            className={`w-1.5 h-1.5 rounded-full ${star <= (value as number) ? 'bg-[#8A2BE2]' : 'bg-gray-800'}`} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Portfolio Links */}
        <section>
          <h3 className="text-sm font-black text-[#8A2BE2] uppercase tracking-[0.2em] mb-6 px-2">Portfólio & Redes</h3>
          <div className="flex flex-wrap gap-4">
            {freelancer.portfolioLinks.instagram && (
               <a href={freelancer.portfolioLinks.instagram} target="_blank" rel="noreferrer" className="flex-1 min-w-[120px] p-6 bg-white/5 rounded-3xl text-gray-400 hover:text-white hover:bg-[#E1306C]/20 hover:border-[#E1306C]/30 transition-all border border-white/5 flex flex-col items-center gap-3 group">
                 <Instagram size={32} className="group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Instagram</span>
               </a>
            )}
            {freelancer.portfolioLinks.vimeo && (
               <a href={freelancer.portfolioLinks.vimeo} target="_blank" rel="noreferrer" className="flex-1 min-w-[120px] p-6 bg-white/5 rounded-3xl text-gray-400 hover:text-white hover:bg-[#1AB7EA]/20 hover:border-[#1AB7EA]/30 transition-all border border-white/5 flex flex-col items-center gap-3 group">
                 <Video size={32} className="group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Vimeo</span>
               </a>
            )}
             {freelancer.portfolioLinks.website && (
               <a href={freelancer.portfolioLinks.website} target="_blank" rel="noreferrer" className="flex-1 min-w-[120px] p-6 bg-white/5 rounded-3xl text-gray-400 hover:text-white hover:bg-[#8A2BE2]/20 hover:border-[#8A2BE2]/30 transition-all border border-white/5 flex flex-col items-center gap-3 group">
                 <Globe size={32} className="group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Website</span>
               </a>
            )}
          </div>
        </section>

        {/* Reviews */}
        <section>
           <h3 className="text-sm font-black text-[#8A2BE2] uppercase tracking-[0.2em] mb-6 px-2">Avaliações Verificadas</h3>
           <div className="space-y-6">
             {freelancer.reviews.length > 0 ? freelancer.reviews.map((review, idx) => (
               <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                 {/* Immutable Rating indicator */}
                 <div className="absolute top-0 right-0 p-4">
                    <div className="flex items-center gap-1 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
                        <Star size={12} fill="#8A2BE2" color="#8A2BE2" />
                        <span className="text-xs font-black text-white">{review.rating}</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#8A2BE2]/20 rounded-full flex items-center justify-center font-black text-[#8A2BE2]">
                        {review.reviewerName.charAt(0)}
                    </div>
                    <div>
                        <span className="block font-black text-white text-sm">{review.reviewerName}</span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{review.date}</span>
                    </div>
                 </div>

                 {review.showComment ? (
                   <p className="text-gray-400 text-sm font-medium italic leading-relaxed">
                     "{review.comment}"
                   </p>
                 ) : (
                    <div className="flex items-center gap-2 text-gray-600 text-[10px] font-black uppercase tracking-widest italic bg-black/20 p-3 rounded-xl border border-dashed border-white/5">
                        <ShieldCheck size={14} />
                        Comentário oculto pelo usuário • Nota mantida
                    </div>
                 )}
               </div>
             )) : (
               <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/5">
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Sem avaliações ainda</p>
               </div>
             )}
           </div>
        </section>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 z-40 max-w-lg mx-auto">
        <div className="bg-[#1A1A1A]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 flex items-center justify-between gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col pl-4">
                <span className="text-[10px] text-[#8A2BE2] uppercase font-black tracking-widest">Diária base</span>
                <span className="text-white font-black text-lg tracking-tighter">{freelancer.faixaValor.split(' - ')[0]}</span>
            </div>
            <Button onClick={handleStartChat} className="rounded-2xl px-8 py-4 flex gap-2 font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(138,43,226,0.4)]">
                <MessageSquare size={18} />
                Contratar
            </Button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Profile;
