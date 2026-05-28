import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Star, Instagram, Globe, Video, CheckCircle, MessageSquare,
  Clock, ShieldCheck, Zap, Heart, Award, Sparkles, Layout, Users, Wrench, Rocket, User, Lock, Phone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [freelancer, setFreelancer] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptedMatch, setAcceptedMatch] = useState<any>(null);

  const fetchFreelancerAndMatch = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch profile by username
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, freelancer_profiles(*)')
        .eq('username', username)
        .single();
      
      if (error || !profile) {
        setFreelancer(null);
        return;
      }

      setFreelancer(profile);

      // If user is logged in, check if there is an accepted match between them
      if (user && profile.id !== user.id) {
        // Query to check if they have any accepted match
        // Case A: The viewer has posted a job that this freelancer applied to and they matched
        const { data: matches } = await supabase
          .from('matches')
          .select('*, jobs!inner(*)')
          .eq('freelancer_id', profile.id)
          .eq('status', 'Accepted')
          .eq('jobs.author_id', user.id);

        if (matches && matches.length > 0) {
          setAcceptedMatch(matches[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancerAndMatch();
  }, [username]);

  const isOwnProfile = useMemo(() => {
    return currentUser && freelancer && currentUser.id === freelancer.id;
  }, [currentUser, freelancer]);

  const isContactVisible = useMemo(() => {
    return isOwnProfile || !!acceptedMatch;
  }, [isOwnProfile, acceptedMatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-[#8A2BE2] rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#121212] text-white">
        <h2 className="text-2xl font-bold mb-4">Perfil não encontrado</h2>
        <Button onClick={() => navigate('/explore')}>Voltar ao Feed</Button>
      </div>
    );
  }

  const fProfile = freelancer.freelancer_profiles;
  const isAvailable = fProfile?.disponibilidade === 'Disponível';

  const handleStartChat = () => {
    alert('Função de chat será aberta. Telefone/WhatsApp: ' + (isContactVisible ? freelancer.phone : 'Oculto até Match'));
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
            src={freelancer.avatar_url || 'https://picsum.photos/200/200?random=99'} 
            alt={`${freelancer.first_name} ${freelancer.last_name}`} 
            className="w-36 h-36 rounded-full object-cover border-4 border-[#121212] shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10"
          />
          <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-4 border-[#121212] z-20 ${isAvailable ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`} />
        </div>

        <h1 className="mt-6 text-3xl font-black text-white text-center tracking-tight">{freelancer.first_name} {freelancer.last_name}</h1>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
            <span className="text-[#8A2BE2] text-[10px] font-black uppercase tracking-widest bg-[#8A2BE2]/10 px-3 py-1 rounded-full border border-[#8A2BE2]/20">
                {freelancer.role}
            </span>
        </div>
        
        <div className="flex items-center gap-2 mt-4 text-gray-500 text-sm font-bold uppercase tracking-widest">
          <MapPin size={14} className="text-[#8A2BE2]" />
          <span>{freelancer.city}, {freelancer.state} ({freelancer.country})</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-sm">
          <div className="flex flex-col items-center p-5 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl group hover:border-[#8A2BE2]/30 transition-all duration-300">
            <div className="flex items-center gap-1.5 text-[#8A2BE2] mb-1">
              <Star size={24} fill="#8A2BE2" className="drop-shadow-[0_0_8px_rgba(138,43,226,0.5)]" />
              <span className="text-2xl font-black text-white tracking-tighter">{fProfile?.rate || '5.0'}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Avaliação Média</span>
          </div>
          <div className="flex flex-col items-center p-5 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl group hover:border-[#8A2BE2]/30 transition-all duration-300">
             <div className="flex items-center gap-1.5 text-[#8A2BE2] mb-1">
              <Rocket size={24} className="drop-shadow-[0_0_8px_rgba(138,43,226,0.5)]" />
              <span className="text-2xl font-black text-white tracking-tighter">{fProfile?.jobs_count || 0}</span>
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
            {fProfile?.bio || 'Sem apresentação cadastrada.'}
          </p>
        </section>

        {/* Specialties / Tags */}
        {fProfile?.specialties && fProfile.specialties.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-sm font-black text-[#8A2BE2] uppercase tracking-[0.2em] px-2">Especialidades</h3>
            <div className="flex flex-wrap gap-2">
              {fProfile.specialties.map((spec: string) => (
                <span key={spec} className="text-xs px-3 py-1.5 bg-white/5 text-gray-300 rounded-xl border border-white/5">
                  {spec}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Private Contact Block */}
        <section className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-4">
          <h3 className="text-sm font-black text-[#8A2BE2] uppercase tracking-[0.2em]">Informações de Contato</h3>
          {isContactVisible ? (
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-2xl animate-pulse">
              <div>
                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">WhatsApp Liberado (Match!)</p>
                <p className="text-lg font-black text-white mt-1">{freelancer.phone}</p>
              </div>
              <a 
                href={`https://wa.me/${freelancer.phone}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-lg"
              >
                <Phone size={20} />
              </a>
            </div>
          ) : (
            <div className="p-6 bg-black/20 rounded-2xl border border-dashed border-white/5 flex flex-col items-center text-center space-y-3">
              <Lock size={28} className="text-[#8A2BE2]" />
              <div>
                <p className="text-white font-bold text-sm">Telefone Oculto</p>
                <p className="text-gray-500 text-xs mt-1">Manifeste interesse em uma vaga ou interaja para liberar o contato.</p>
              </div>
            </div>
          )}
        </section>

        {/* Portfolio Links */}
        {fProfile?.portfolio_links && (
          <section>
            <h3 className="text-sm font-black text-[#8A2BE2] uppercase tracking-[0.2em] mb-6 px-2">Portfólio & Redes</h3>
            <div className="flex flex-wrap gap-4">
              {fProfile.portfolio_links.instagram && (
                 <a href={fProfile.portfolio_links.instagram} target="_blank" rel="noreferrer" className="flex-1 min-w-[120px] p-6 bg-white/5 rounded-3xl text-gray-400 hover:text-white hover:bg-[#E1306C]/20 hover:border-[#E1306C]/30 transition-all border border-white/5 flex flex-col items-center gap-3 group">
                   <Instagram size={32} className="group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Instagram</span>
                 </a>
              )}
               {fProfile.portfolio_links.website && (
                 <a href={fProfile.portfolio_links.website} target="_blank" rel="noreferrer" className="flex-1 min-w-[120px] p-6 bg-white/5 rounded-3xl text-gray-400 hover:text-white hover:bg-[#8A2BE2]/20 hover:border-[#8A2BE2]/30 transition-all border border-white/5 flex flex-col items-center gap-3 group">
                   <Globe size={32} className="group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Website</span>
                 </a>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      {fProfile && (
        <div className="fixed bottom-[72px] left-0 right-0 p-4 z-40 max-w-lg mx-auto">
          <div className="bg-[#1A1A1A]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 flex items-center justify-between gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col pl-4">
                  <span className="text-[10px] text-[#8A2BE2] uppercase font-black tracking-widest">Diária base</span>
                  <span className="text-white font-black text-lg tracking-tighter">R$ {fProfile.min_price} - R$ {fProfile.max_price}</span>
              </div>
              <Button onClick={handleStartChat} className="rounded-2xl px-8 py-4 flex gap-2 font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(138,43,226,0.4)]">
                  <MessageSquare size={18} />
                  Mensagem
              </Button>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default Profile;
