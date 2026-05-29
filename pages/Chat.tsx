
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, MoreVertical, Phone, Search, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

interface ChatRoom {
  matchId: string;
  jobId: string;
  jobTitle: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerPhone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeChatId = searchParams.get('id'); // This is the matchId

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load all accepted matches as chat rooms
  const loadChatRooms = useCallback(async (user: any) => {
    try {
      // Get accepted matches where user is the freelancer
      const { data: asFreelancer } = await supabase
        .from('matches')
        .select('id, job_id, status, jobs!inner(id, title, author_id, author:profiles(id, first_name, last_name, avatar_url, phone))')
        .eq('freelancer_id', user.id)
        .eq('status', 'Accepted');

      // Get accepted matches where user is the job author (producer)
      const { data: myJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('author_id', user.id);

      let asProducer: any[] = [];
      if (myJobs && myJobs.length > 0) {
        const jobIds = myJobs.map((j: any) => j.id);
        const { data } = await supabase
          .from('matches')
          .select('id, job_id, freelancer_id, status, jobs!inner(id, title), freelancer:profiles!freelancer_id(id, first_name, last_name, avatar_url, phone), freelancer_profile:freelancer_profiles!freelancer_id(bio, funcoes)')
          .in('job_id', jobIds)
          .eq('status', 'Accepted');
        asProducer = data || [];
      }

      // Also get last message for each match
      const rooms: ChatRoom[] = [];

      // Process freelancer-side chats
      for (const m of (asFreelancer || [])) {
        const job = (m as any).jobs;
        const author = job?.author;
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('text, created_at')
          .eq('match_id', m.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        rooms.push({
          matchId: m.id,
          jobId: m.job_id,
          jobTitle: job?.title || 'Vaga',
          partnerId: author?.id || '',
          partnerName: `${author?.first_name || ''} ${author?.last_name || ''}`.trim() || 'Produtor',
          partnerAvatar: author?.avatar_url || `https://ui-avatars.com/api/?name=${author?.first_name}&background=8A2BE2&color=fff`,
          partnerPhone: author?.phone || '',
          lastMessage: lastMsg?.text || 'Chat iniciado',
          lastMessageTime: lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
          unreadCount: 0,
        });
      }

      // Process producer-side chats
      for (const m of asProducer) {
        const job = (m as any).jobs;
        const freelancer = (m as any).freelancer;
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('text, created_at')
          .eq('match_id', m.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Avoid duplicates
        if (!rooms.find(r => r.matchId === m.id)) {
          rooms.push({
            matchId: m.id,
            jobId: m.job_id,
            jobTitle: job?.title || 'Vaga',
            partnerId: freelancer?.id || '',
            partnerName: `${freelancer?.first_name || ''} ${freelancer?.last_name || ''}`.trim() || 'Freela',
            partnerAvatar: freelancer?.avatar_url || `https://ui-avatars.com/api/?name=${freelancer?.first_name}&background=8A2BE2&color=fff`,
            partnerPhone: freelancer?.phone || '',
            lastMessage: lastMsg?.text || 'Chat iniciado',
            lastMessageTime: lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: 0,
          });
        }
      }

      setChatRooms(rooms);
    } catch (err) {
      console.error('Error loading chat rooms:', err);
    }
  }, []);

  // Load messages for active chat
  const loadMessages = useCallback(async (matchId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Messages table error:', error);
        setMessages([]);
        return;
      }

      setMessages((data || []).map((m: any) => ({
        id: m.id,
        matchId: m.match_id,
        senderId: m.sender_id,
        text: m.text,
        createdAt: m.created_at,
      })));
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/'); return; }
        setCurrentUser(user);
        await loadChatRooms(user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChatId && currentUser) {
      loadMessages(activeChatId);
    }
  }, [activeChatId, currentUser, loadMessages]);

  // Real-time messages subscription
  useEffect(() => {
    if (!activeChatId) return;

    const channel = supabase
      .channel(`messages:${activeChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${activeChatId}`,
      }, (payload) => {
        const msg = payload.new as any;
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, {
            id: msg.id,
            matchId: msg.match_id,
            senderId: msg.sender_id,
            text: msg.text,
            createdAt: msg.created_at,
          }];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !currentUser) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const { error } = await supabase.from('messages').insert({
        match_id: activeChatId,
        sender_id: currentUser.id,
        text: text,
      });

      if (error) {
        console.error('Send message error:', error);
        // Fallback: show message locally
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          matchId: activeChatId,
          senderId: currentUser.id,
          text,
          createdAt: new Date().toISOString(),
        }]);
      }

      // Reload chat rooms to update last message
      loadChatRooms(currentUser);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
      inputRef.current?.focus();
    }
  };

  const activeRoom = chatRooms.find(r => r.matchId === activeChatId);
  const filteredRooms = chatRooms.filter(r =>
    !searchTerm || r.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) || r.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-[#8A2BE2] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  // --- View: Active Chat ---
  if (activeChatId) {
    if (!activeRoom && !loading) {
      // Room not yet loaded — it might be a new match redirect
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white flex-col gap-4">
          <MessageSquare size={48} className="text-gray-600" />
          <p className="text-gray-400 font-bold">Conversa não encontrada.</p>
          <button onClick={() => navigate('/chat')} className="text-[#8A2BE2] font-black uppercase tracking-widest text-xs">
            Ver todas as conversas
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[100dvh] bg-[#121212] overflow-hidden">
        {/* Chat Header */}
        <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#1A1A1A]/90 backdrop-blur-xl border-b border-white/5 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/chat')} className="text-gray-400 hover:text-white p-1 transition-all">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={activeRoom?.partnerAvatar || `https://ui-avatars.com/api/?name=U&background=8A2BE2&color=fff`}
                  alt={activeRoom?.partnerName} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#8A2BE2]/30"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1A1A1A]" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm">{activeRoom?.partnerName || 'Conversa'}</h3>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{activeRoom?.jobTitle || ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeRoom?.partnerPhone && (
              <a
                href={`https://wa.me/55${(activeRoom.partnerPhone).replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all"
                title="Abrir WhatsApp"
              >
                <Phone size={18} />
              </a>
            )}
            <button className="p-2 text-gray-500 hover:text-white rounded-xl transition-all">
              <MoreVertical size={20} />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
              <div className="w-16 h-16 bg-[#8A2BE2]/10 border border-[#8A2BE2]/20 rounded-full flex items-center justify-center">
                <MessageSquare size={28} className="text-[#8A2BE2]" />
              </div>
              <div>
                <p className="text-white font-black text-sm">Match Realizado! 🎉</p>
                <p className="text-gray-500 text-xs mt-1">Inicie a conversa e negocie os detalhes do projeto.</p>
              </div>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`
                    max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-lg
                    ${isMe 
                      ? 'bg-[#8A2BE2] text-white rounded-br-sm' 
                      : 'bg-[#2A2A2A] text-gray-200 rounded-bl-sm border border-white/5'}
                  `}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-purple-200/80' : 'text-gray-600'}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 bg-[#1A1A1A]/90 backdrop-blur-xl border-t border-white/5 w-full">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input 
              ref={inputRef}
              id="chat-message-input"
              className="flex-1 bg-[#121212] text-white rounded-full px-5 py-3.5 border border-white/10 focus:outline-none focus:border-[#8A2BE2]/50 placeholder-gray-600 text-sm transition-all"
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sendingMessage}
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="bg-[#8A2BE2] text-white p-3.5 rounded-full hover:bg-[#9D4EDD] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(138,43,226,0.3)] active:scale-95"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- View: Chat List ---
  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-24">
      <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 space-y-5">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
          <MessageSquare size={18} className="inline mr-2 text-[#8A2BE2]" />
          Mensagens
        </h1>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-10 pr-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2]/50 transition-all"
          />
        </div>
      </header>

      <div className="px-6 py-4 space-y-2 max-w-2xl mx-auto animate-in fade-in duration-500">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare size={32} className="text-gray-600" />
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma conversa ainda</p>
              <p className="text-gray-600 text-[10px] mt-1.5">Seus chats aparecerão aqui após um Match ser aceito.</p>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="mt-4 px-6 py-2.5 bg-[#8A2BE2] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#9D4EDD] transition-all shadow-lg"
            >
              Explorar Vagas
            </button>
          </div>
        ) : (
          filteredRooms.map(room => (
            <div
              key={room.matchId}
              id={`chat-room-${room.matchId}`}
              onClick={() => navigate(`/chat?id=${room.matchId}`)}
              className="flex items-center gap-4 p-4 bg-[#1A1A1A] border border-white/5 rounded-[24px] hover:border-[#8A2BE2]/30 hover:bg-[#222] transition-all cursor-pointer group"
            >
              <div className="relative shrink-0">
                <img 
                  src={room.partnerAvatar} 
                  alt={room.partnerName} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/10 group-hover:border-[#8A2BE2]/40 transition-all"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1A1A1A]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-black text-white text-sm group-hover:text-[#8A2BE2] transition-colors">{room.partnerName}</h3>
                  <span className="text-[10px] text-gray-600 font-medium shrink-0 ml-2">{room.lastMessageTime}</span>
                </div>
                <p className="text-[10px] text-[#8A2BE2] font-black uppercase tracking-wider mb-1">{room.jobTitle}</p>
                <p className="text-xs text-gray-500 truncate">{room.lastMessage}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
