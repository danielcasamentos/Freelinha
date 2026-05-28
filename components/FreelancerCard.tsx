
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, ShieldCheck } from 'lucide-react';
import { Freelancer } from '../types';

interface FreelancerCardProps {
  freelancer: Freelancer;
}

const FreelancerCard: React.FC<FreelancerCardProps> = ({ freelancer }) => {
  const navigate = useNavigate();
  const isAvailable = freelancer.disponibilidade === 'Disponível';

  return (
    <div 
      onClick={() => navigate(`/profile/${freelancer.username}`)}
      className="group relative bg-[#1A1A1A] rounded-[32px] p-5 mb-4 border border-white/5 hover:border-[#8A2BE2]/40 transition-all duration-500 cursor-pointer shadow-2xl active:scale-[0.98] flex items-center gap-5 overflow-hidden"
    >
      {/* Glass gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative shrink-0 z-10">
        <div className="absolute inset-0 bg-[#8A2BE2] blur-xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full"></div>
        <img 
          src={freelancer.avatarUrl} 
          alt={freelancer.nomeCompleto} 
          className="w-20 h-20 rounded-full object-cover border-2 border-white/10 group-hover:border-[#8A2BE2]/50 transition-all duration-500"
        />
        {/* Status Indicator */}
        <span 
          className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-4 border-[#1A1A1A] ${
            isAvailable ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-[#E3170D]'
          }`}
        />
      </div>
      
      <div className="flex-1 min-w-0 z-10">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-white font-black text-lg truncate tracking-tight group-hover:text-[#8A2BE2] transition-colors">
            {freelancer.nomeCompleto}
          </h3>
          <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full border border-white/5">
            <Star size={12} fill="#8A2BE2" color="#8A2BE2" />
            <span className="text-[10px] font-black text-white">{freelancer.rate}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
            <span className="text-[#8A2BE2] font-black text-[10px] uppercase tracking-widest bg-[#8A2BE2]/10 px-2 py-0.5 rounded-md">
                {freelancer.funcoes[0]}
            </span>
            {freelancer.jobsCount > 20 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <ShieldCheck size={12} />
                    Elite
                </div>
            )}
        </div>

        {/* Specialties Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {freelancer.specialties?.slice(0, 2).map((spec, index) => (
             <span key={index} className="text-[9px] font-bold bg-white/5 text-gray-400 px-2 py-1 rounded-full border border-white/5">
               {spec}
             </span>
          ))}
          {freelancer.specialties && freelancer.specialties.length > 2 && (
             <span className="text-[9px] font-bold bg-white/5 text-gray-400 px-2 py-1 rounded-full border border-white/5">
               +{freelancer.specialties.length - 2}
             </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          <MapPin size={10} />
          {freelancer.regiao}
        </div>
      </div>
    </div>
  );
};

export default FreelancerCard;
