
import React from 'react';
import { Compass, MessageSquare, User, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/AppContext';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = useApp();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/80 backdrop-blur-2xl border-t border-white/5 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-sm mx-auto h-14">
        <button 
          id="nav-explore"
          onClick={() => navigate('/explore')}
          className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${isActive('/explore') ? 'text-[#8A2BE2] scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Compass size={24} strokeWidth={isActive('/explore') ? 2.5 : 2} />
          <span className="text-[10px] font-black uppercase tracking-widest">Explorar</span>
        </button>

        <button 
          id="nav-notifications"
          onClick={() => navigate('/notifications')}
          className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${isActive('/notifications') ? 'text-[#8A2BE2] scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className="relative">
            <Bell size={24} strokeWidth={isActive('/notifications') ? 2.5 : 2} />
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#8A2BE2] text-white text-[9px] font-black rounded-full border-2 border-[#121212] flex items-center justify-center px-0.5">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Avisos</span>
        </button>

        <button 
          id="nav-chat"
          onClick={() => navigate('/chat')}
          className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${isActive('/chat') ? 'text-[#8A2BE2] scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className="relative">
            <MessageSquare size={24} strokeWidth={isActive('/chat') ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
        </button>

        <button 
          id="nav-profile"
          onClick={() => navigate('/my-profile')}
          className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${isActive('/my-profile') ? 'text-[#8A2BE2] scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <User size={24} strokeWidth={isActive('/my-profile') ? 2.5 : 2} />
          <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
