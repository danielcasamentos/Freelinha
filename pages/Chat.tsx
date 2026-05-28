
import React, { useState } from 'react';
import { ArrowLeft, Send, MoreVertical, Phone, Video, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MOCK_CHATS } from '../constants';
import BottomNav from '../components/BottomNav';
import Input from '../components/Input';
import { Chat as ChatType, Message } from '../types';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeChatId = searchParams.get('id');

  // Local state to manage chats (simulating persistence)
  const [chats, setChats] = useState<ChatType[]>(MOCK_CHATS);
  const [newMessage, setNewMessage] = useState('');

  const activeChat = chats.find(c => c.id === activeChatId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChats = chats.map(c => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          messages: [...c.messages, message],
          lastMessage: message.text,
          lastMessageTime: message.timestamp
        };
      }
      return c;
    });

    setChats(updatedChats);
    setNewMessage('');
  };

  // --- View: Chat List ---
  if (!activeChatId) {
    return (
      <div className="min-h-[100dvh] bg-[#121212] pb-24">
        <header className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md border-b border-gray-800 px-4 py-4">
          <h1 className="text-xl font-bold mb-4">
            Mensagens
          </h1>
          <Input 
            placeholder="Buscar nas conversas..." 
            icon={<Search size={18} />}
            className="text-sm py-2"
          />
        </header>

        <div className="px-4 py-2">
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => navigate(`/chat?id=${chat.id}`)}
              className="flex items-center gap-4 p-4 border-b border-gray-800 hover:bg-[#1A1A1A] transition-colors cursor-pointer -mx-4 px-8"
            >
              <div className="relative">
                <img 
                  src={chat.freelancerAvatar} 
                  alt={chat.freelancerName} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                {chat.unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-[#E3170D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#121212]">
                     {chat.unreadCount}
                   </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-white truncate">{chat.freelancerName}</h3>
                  <span className="text-xs text-gray-500">{chat.lastMessageTime}</span>
                </div>
                <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                  {chat.unreadCount > 0 ? chat.lastMessage : chat.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  // --- View: Active Chat ---
  return (
    <div className="flex flex-col h-[100dvh] bg-[#121212] overflow-hidden">
      {/* Chat Header - Fixed Height */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border-b border-gray-800 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/chat')} className="text-gray-400 hover:text-white p-1">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <img 
              src={activeChat.freelancerAvatar} 
              alt={activeChat.freelancerName} 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-bold text-white text-sm">{activeChat.freelancerName}</h3>
              <span className="text-xs text-green-500 block">Online agora</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#8A2BE2]">
          <Phone size={20} className="cursor-pointer hover:text-white" />
          <Video size={20} className="cursor-pointer hover:text-white" />
          <MoreVertical size={20} className="text-gray-400 cursor-pointer hover:text-white" />
        </div>
      </header>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20 custom-scrollbar">
        {activeChat.messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`
                  max-w-[75%] rounded-2xl px-4 py-2.5 text-sm
                  ${isMe 
                    ? 'bg-[#8A2BE2] text-white rounded-br-none' 
                    : 'bg-[#2A2A2A] text-gray-200 rounded-bl-none'}
                `}
              >
                <p>{msg.text}</p>
                <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-purple-200' : 'text-gray-500'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="shrink-0 p-3 bg-[#1A1A1A] border-t border-gray-800 w-full safe-area-bottom">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input 
            className="flex-1 bg-[#121212] text-white rounded-full px-4 py-3 border border-gray-800 focus:outline-none focus:border-[#8A2BE2] placeholder-gray-500"
            placeholder="Digite uma mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-[#8A2BE2] text-white p-3 rounded-full hover:bg-[#7b26cb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
