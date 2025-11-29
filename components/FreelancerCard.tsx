
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Freelancer } from '../types';
import StarRating from './StarRating';

interface FreelancerCardProps {
  freelancer: Freelancer;
}

const FreelancerCard: React.FC<FreelancerCardProps> = ({ freelancer }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/profile/${freelancer.username}`)}
      className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800 hover:border-[#8A2BE2] transition-colors cursor-pointer shadow-lg active:scale-[0.99] flex items-center gap-4"
    >
      <div className="relative shrink-0">
        <img 
          src={freelancer.avatarUrl} 
          alt={freelancer.nomeCompleto} 
          className="w-16 h-16 rounded-full object-cover border-2 border-[#8A2BE2]/30"
        />
        {/* Status Indicator */}
        <span 
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#1A1A1A] ${
            freelancer.disponibilidade === 'Disponível' ? 'bg-green-500' : 'bg-[#E3170D]'
          }`}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="text-white font-semibold text-lg truncate pr-2">
            {freelancer.nomeCompleto}
          </h3>
          <StarRating rating={freelancer.rate} />
        </div>
        
        <p className="text-[#8A2BE2] font-medium text-sm truncate mb-1">
          {freelancer.funcoes[0]}
        </p>

        {/* Specialties Tags */}
        <div className="flex flex-wrap gap-1">
          {freelancer.specialties?.slice(0, 3).map((spec, index) => (
             <span key={index} className="text-[10px] bg-[#2A2A2A] text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">
               {spec}
             </span>
          ))}
          {freelancer.specialties && freelancer.specialties.length > 3 && (
             <span className="text-[10px] bg-[#2A2A2A] text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">
               +{freelancer.specialties.length - 3}
             </span>
          )}
        </div>
        
        <p className="text-gray-500 text-xs truncate mt-1">
          {freelancer.regiao}
        </p>
      </div>
    </div>
  );
};

export default FreelancerCard;
