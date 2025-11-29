
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Star, Instagram, Globe, Video, Linkedin, CheckCircle, MessageSquare
} from 'lucide-react';
import { MOCK_FREELANCERS } from '../constants';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';

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

  const handleStartChat = () => {
    // In a real app, this would create a chat session if one doesn't exist.
    // For MVP, we route to a mock chat. 
    // We'll route to chat ID 'c1' if it's the first freelancer, else 'c2' or generic.
    const chatId = freelancer.id === '1' ? 'c1' : 'c2'; 
    navigate(`/chat?id=${chatId}`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-48 relative animate-in fade-in duration-300">
      {/* Header Image/Gradient */}
      <div className="h-40 bg-gradient-to-b from-[#8A2BE2]/20 to-[#121212] relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors z-10"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Profile Header Content */}
      <div className="px-6 -mt-16 flex flex-col items-center relative z-0">
        <div className="relative">
          <img 
            src={freelancer.avatarUrl} 
            alt={freelancer.nomeCompleto} 
            className="w-32 h-32 rounded-full object-cover border-4 border-[#121212] shadow-2xl"
          />
          <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-[#121212] ${isAvailable ? 'bg-green-500' : 'bg-[#E3170D]'}`} />
        </div>

        <h1 className="mt-4 text-2xl font-bold text-white text-center">{freelancer.nomeCompleto}</h1>
        <p className="text-[#8A2BE2] font-medium text-center">{freelancer.funcoes.join(' • ')}</p>
        
        <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
          <MapPin size={14} />
          <span>{freelancer.regiao}</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-sm">
          <div className="flex flex-col items-center p-4 bg-[#1A1A1A] rounded-2xl border border-gray-800">
            <div className="flex items-center gap-1 text-[#E3170D] mb-1">
              <Star size={20} fill="#E3170D" />
              <span className="text-xl font-bold text-white">{freelancer.rate}</span>
            </div>
            <span className="text-xs text-gray-500">Avaliação Média</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-[#1A1A1A] rounded-2xl border border-gray-800">
             <div className="flex items-center gap-1 text-[#8A2BE2] mb-1">
              <CheckCircle size={20} />
              <span className="text-xl font-bold text-white">{freelancer.jobsCount}</span>
            </div>
            <span className="text-xs text-gray-500">Jobs Concluídos</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 mt-8 space-y-8 max-w-lg mx-auto">
        
        {/* Bio */}
        <section>
          <h3 className="text-lg font-bold text-white mb-3">Sobre</h3>
          <p className="text-gray-300 leading-relaxed text-sm">
            {freelancer.bio}
          </p>
        </section>

        {/* Portfolio Links */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4">Portfólio & Redes</h3>
          <div className="flex gap-4">
            {freelancer.portfolioLinks.instagram && (
               <a href={freelancer.portfolioLinks.instagram} target="_blank" rel="noreferrer" className="p-4 bg-[#1A1A1A] rounded-xl text-gray-300 hover:text-[#E1306C] hover:bg-[#E1306C]/10 transition-colors border border-gray-800">
                 <Instagram size={28} />
               </a>
            )}
            {freelancer.portfolioLinks.vimeo && (
               <a href={freelancer.portfolioLinks.vimeo} target="_blank" rel="noreferrer" className="p-4 bg-[#1A1A1A] rounded-xl text-gray-300 hover:text-[#1AB7EA] hover:bg-[#1AB7EA]/10 transition-colors border border-gray-800">
                 <Video size={28} />
               </a>
            )}
             {freelancer.portfolioLinks.website && (
               <a href={freelancer.portfolioLinks.website} target="_blank" rel="noreferrer" className="p-4 bg-[#1A1A1A] rounded-xl text-gray-300 hover:text-[#8A2BE2] hover:bg-[#8A2BE2]/10 transition-colors border border-gray-800">
                 <Globe size={28} />
               </a>
            )}
             {freelancer.portfolioLinks.linkedin && (
               <a href={freelancer.portfolioLinks.linkedin} target="_blank" rel="noreferrer" className="p-4 bg-[#1A1A1A] rounded-xl text-gray-300 hover:text-[#0077b5] hover:bg-[#0077b5]/10 transition-colors border border-gray-800">
                 <Linkedin size={28} />
               </a>
            )}
          </div>
        </section>

        {/* Services */}
        {freelancer.services.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-white mb-4">Serviços</h3>
            <div className="space-y-3">
              {freelancer.services.map((service, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-[#1A1A1A] rounded-lg border border-gray-800">
                  <span className="text-white font-medium">{service.name}</span>
                  <span className="text-[#8A2BE2] text-sm">{service.price}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section>
           <h3 className="text-lg font-bold text-white mb-4">Últimas Avaliações</h3>
           <div className="space-y-4">
             {freelancer.reviews.length > 0 ? freelancer.reviews.map((review, idx) => (
               <div key={idx} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800">
                 <div className="flex justify-between items-start mb-2">
                   <span className="font-semibold text-white">{review.reviewerName}</span>
                   <div className="flex items-center gap-1">
                     <Star size={12} fill="#E3170D" color="#E3170D" />
                     <span className="text-sm font-bold">{review.rating}</span>
                   </div>
                 </div>
                 <p className="text-gray-400 text-sm italic">"{review.comment}"</p>
                 <p className="text-gray-600 text-xs mt-2 text-right">{review.date}</p>
               </div>
             )) : (
               <p className="text-gray-500 text-sm">Nenhuma avaliação recente.</p>
             )}
           </div>
        </section>
      </div>

      {/* Sticky Bottom Action Bar - Positioned above BottomNav */}
      <div className="fixed bottom-[56px] left-0 right-0 p-4 bg-[#121212]/95 backdrop-blur-lg border-t border-gray-800 flex items-center justify-between gap-4 z-40 max-w-lg mx-auto">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase font-semibold">Investimento Estimado</span>
          <span className="text-white font-bold">{freelancer.faixaValor}</span>
        </div>
        <Button onClick={handleStartChat} className="flex gap-2">
          <MessageSquare size={18} />
          Iniciar Chat
        </Button>
      </div>
      
      {/* Bottom Nav for global context even in profile */}
      <BottomNav />
    </div>
  );
};

export default Profile;
