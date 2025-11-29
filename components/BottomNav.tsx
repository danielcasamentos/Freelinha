
import React from 'react';
import { Home, MessageSquare, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-gray-800 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto h-14">
        <button 
          onClick={() => navigate('/feed')}
          className={`flex flex-col items-center gap-1 w-16 transition-colors ${isActive('/feed') ? 'text-[#8A2BE2]' : 'text-gray-500'}`}
        >
          <Home size={24} strokeWidth={isActive('/feed') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Feed</span>
        </button>

        <button 
          onClick={() => navigate('/chat')}
          className={`flex flex-col items-center gap-1 w-16 transition-colors ${isActive('/chat') ? 'text-[#8A2BE2]' : 'text-gray-500'}`}
        >
          <div className="relative">
            <MessageSquare size={24} strokeWidth={isActive('/chat') ? 2.5 : 2} />
            {/* Mock notification badge */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E3170D] rounded-full border-2 border-[#121212]"></span>
          </div>
          <span className="text-[10px] font-medium">Chat</span>
        </button>

        <button 
          onClick={() => navigate('/my-profile')}
          className={`flex flex-col items-center gap-1 w-16 transition-colors ${isActive('/my-profile') ? 'text-[#8A2BE2]' : 'text-gray-500'}`}
        >
          <User size={24} strokeWidth={isActive('/my-profile') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
