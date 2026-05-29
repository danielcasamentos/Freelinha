import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Lock, Camera, 
  Check, Instagram, Globe, MapPin, Phone, DollarSign, User, X, LogOut 
} from 'lucide-react';
import { CustomService } from '../types';
import { MAIN_ROLES, SPECIALTIES } from '../constants';

// Unified skill tags: professions + niches in one list
const ALL_SKILLS = [...MAIN_ROLES, ...SPECIALTIES];
import { supabase } from '../lib/supabase';

const MyProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [customRoleInput, setCustomRoleInput] = useState('');

  // Form states
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    role: 'Produtor'
  });

  const [professionalData, setProfessionalData] = useState({
    bio: '',
    funcoes: [] as string[],
    minPrice: 0,
    maxPrice: 0,
    currency: 'BRL',
    disponibilidade: 'Disponível',
    instagram: '',
    website: ''
  });

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }
      setCurrentUser(user);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;

      setPersonalData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        role: profile.role || 'Produtor'
      });

      const { data: freelaProfile } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (freelaProfile) {
        // Merge funcoes + specialties into unified list
        const saved = freelaProfile.funcoes || [];
        const legacySpecs = freelaProfile.specialties || [];
        const merged = Array.from(new Set([...saved, ...legacySpecs]));
        setProfessionalData({
          bio: freelaProfile.bio || '',
          funcoes: merged.length > 0 ? merged : (profile.role ? [profile.role] : []),
          minPrice: Number(freelaProfile.min_price || 0),
          maxPrice: Number(freelaProfile.max_price || 0),
          currency: freelaProfile.currency || 'BRL',
          disponibilidade: freelaProfile.disponibilidade || 'Disponível',
          instagram: freelaProfile.portfolio_links?.instagram || '',
          website: freelaProfile.portfolio_links?.website || ''
        });
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfileData(); }, []);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfessionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfessionalData(prev => ({ ...prev, [name]: name.includes('Price') ? Number(value) : value }));
  };

  // Unified toggle for all skills (professions + specialties merged)
  const toggleSkill = (skill: string) => {
    setProfessionalData(prev => {
      const current = prev.funcoes || [];
      if (current.includes(skill)) {
        if (current.length === 1) return prev; // always keep at least one
        return { ...prev, funcoes: current.filter(s => s !== skill) };
      }
      return { ...prev, funcoes: [...current, skill] };
    });
  };

  const handleAddCustomRole = () => {
    const roleName = customRoleInput.trim();
    if (!roleName) return;
    setProfessionalData(prev => {
      const current = prev.funcoes || [];
      if (current.includes(roleName)) return prev;
      return { ...prev, funcoes: [...current, roleName] };
    });
    setCustomRoleInput('');
  };

  const handleLogoff = async () => {
    const confirm = window.confirm('Deseja realmente sair da sua conta?');
    if (!confirm) return;
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Erro ao fazer logoff:', err);
      alert('Erro ao fazer logoff: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      setSaveLoading(true);

      const primaryRole = professionalData.funcoes[0] || personalData.role || 'Produtor';
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: personalData.firstName,
          last_name: personalData.lastName,
          phone: personalData.phone,
          city: personalData.city,
          state: personalData.state,
          country: personalData.country,
          role: primaryRole
        })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      // Geocode city/state/country
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const address = `${personalData.city}, ${personalData.state}, ${personalData.country}`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        const results = await res.json();
        if (results.length > 0) {
          lat = parseFloat(results[0].lat);
          lng = parseFloat(results[0].lon);
        }
      } catch (geocodeErr) {
        console.error('Erro de geocodificação ao salvar perfil:', geocodeErr);
      }

      const { error: freelaError } = await supabase
        .from('freelancer_profiles')
        .upsert({
          id: currentUser.id,
          bio: professionalData.bio,
          funcoes: professionalData.funcoes,
          specialties: [], // cleared — all skills unified in funcoes
          min_price: professionalData.minPrice,
          max_price: professionalData.maxPrice,
          currency: professionalData.currency,
          disponibilidade: professionalData.disponibilidade,
          portfolio_links: {
            instagram: professionalData.instagram,
            website: professionalData.website
          },
          ...(lat !== null && lng !== null ? { latitude: lat, longitude: lng } : {})
        });

      if (freelaError) throw freelaError;

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar perfil: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-[#8A2BE2] rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Buscando seu perfil...</p>
        </div>
      </div>
    );
  }

  const availabilityColors: Record<string, string> = {
    'Disponível': 'text-green-400 bg-green-500/10 border-green-500/20',
    'Ocupado': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    'Indisponível': 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2]/50 transition-all";
  const labelClass = "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block ml-1";

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/explore')}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all border border-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Meu <span className="text-[#8A2BE2]">Perfil</span></h1>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Editar informações</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveLoading}
          id="save-profile-btn"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg
            ${saved 
              ? 'bg-green-500 text-white shadow-green-950/30' 
              : 'bg-[#8A2BE2] text-white hover:bg-[#9D4EDD] shadow-[0_5px_20px_rgba(138,43,226,0.3)]'}`}
        >
          {saved ? <><Check size={16} /> Salvo!</> : saveLoading ? 'Salvando...' : <><Save size={16} /> Salvar</>}
        </button>
      </div>

      <div className="px-6 py-8 space-y-10 max-w-2xl mx-auto">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#8A2BE2] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity rounded-full"></div>
            <img 
              src={currentUser?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${personalData.firstName}+${personalData.lastName}&background=8A2BE2&color=fff&size=200`}
              alt="Avatar" 
              className="w-28 h-28 rounded-full object-cover border-4 border-[#121212] shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10"
            />
            <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-[#121212] z-20 ${professionalData.disponibilidade === 'Disponível' ? 'bg-green-500' : professionalData.disponibilidade === 'Ocupado' ? 'bg-yellow-500' : 'bg-red-500'}`} />
          </div>
          <div className="text-center">
            <p className="font-black text-white text-xl">{personalData.firstName} {personalData.lastName}</p>
            <p className="text-[#8A2BE2] text-[10px] font-black uppercase tracking-widest mt-1">
              @{currentUser?.user_metadata?.username || 'usuario'}
            </p>
            <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${availabilityColors[professionalData.disponibilidade] || availabilityColors['Disponível']}`}>
              {professionalData.disponibilidade}
            </span>
          </div>
        </div>

        {/* Personal Data */}
        <section className="bg-white/5 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#8A2BE2]/10 rounded-xl border border-[#8A2BE2]/20">
              <User size={18} className="text-[#8A2BE2]" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.15em]">Dados Pessoais</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome</label>
              <input className={inputClass} name="firstName" value={personalData.firstName} onChange={handlePersonalChange} placeholder="Seu nome" />
            </div>
            <div>
              <label className={labelClass}>Sobrenome</label>
              <input className={inputClass} name="lastName" value={personalData.lastName} onChange={handlePersonalChange} placeholder="Sobrenome" />
            </div>
          </div>

          <div className="relative">
            <label className={labelClass}>Email (não alterável)</label>
            <input className={`${inputClass} text-gray-500 cursor-not-allowed`} type="email" value={personalData.email} disabled />
            <Lock size={14} className="absolute right-4 bottom-4 text-gray-600" />
          </div>

          <div>
            <label className={labelClass}>WhatsApp / Celular</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                className={`${inputClass} pl-10`}
                name="phone" 
                value={personalData.phone} 
                onChange={handlePersonalChange} 
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cidade</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input className={`${inputClass} pl-10`} name="city" value={personalData.city} onChange={handlePersonalChange} placeholder="São Paulo" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <input className={inputClass} name="state" value={personalData.state} onChange={handlePersonalChange} placeholder="SP" />
            </div>
          </div>

          <div>
            <label className={labelClass}>País</label>
            <input className={inputClass} name="country" value={personalData.country} onChange={handlePersonalChange} placeholder="Brasil" />
          </div>
        </section>

        {/* Professional Data */}
        <section className="bg-white/5 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#8A2BE2]/10 rounded-xl border border-[#8A2BE2]/20">
              <DollarSign size={18} className="text-[#8A2BE2]" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.15em]">Perfil Profissional</h2>
          </div>

          {/* Unified Skills & Specialties */}
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Habilidades &amp; Especialidades</label>
              <p className="text-[9px] text-gray-600 font-bold ml-1 mb-3">Selecione suas funções e nichos — tudo no mesmo lugar</p>
            </div>

            {/* All predefined skills (roles + niches unified) */}
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map(skill => {
                const isSelected = (professionalData.funcoes || []).includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`text-xs px-3 py-2 rounded-xl border transition-all font-bold
                      ${isSelected
                        ? 'bg-[#8A2BE2] border-[#8A2BE2] text-white shadow-[0_0_15px_rgba(138,43,226,0.3)]'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#8A2BE2]/40 hover:text-white'}`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>

            {/* Custom tags added by user */}
            {professionalData.funcoes.filter(skill => !ALL_SKILLS.includes(skill)).length > 0 && (
              <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Tags Personalizadas:</span>
                <div className="flex flex-wrap gap-2">
                  {professionalData.funcoes.filter(skill => !ALL_SKILLS.includes(skill)).map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="text-xs px-3 py-2 rounded-xl border transition-all font-bold bg-[#8A2BE2] border-[#8A2BE2] text-white shadow-[0_0_15px_rgba(138,43,226,0.3)] flex items-center gap-1.5 animate-in zoom-in duration-200"
                    >
                      {skill}
                      <X size={12} className="opacity-60 hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add any custom skill/niche */}
            <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
              <input
                type="text"
                placeholder="Ex: Dublador, Roteirista de Podcast, VJ..."
                value={customRoleInput}
                onChange={e => setCustomRoleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomRole();
                  }
                }}
                className={`${inputClass} !py-2.5 flex-1`}
              />
              <button
                type="button"
                onClick={handleAddCustomRole}
                className="bg-[#8A2BE2] hover:bg-[#9D4EDD] text-white px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md"
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className={labelClass}>Disponibilidade</label>
            <div className="flex gap-3">
              {['Disponível', 'Ocupado', 'Indisponível'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setProfessionalData(prev => ({ ...prev, disponibilidade: status }))}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                    ${professionalData.disponibilidade === status
                      ? availabilityColors[status]
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className={labelClass}>Faixa de Preço por Dia / Evento (R$)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-1 mb-1.5 block">Mínimo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-black">R$</span>
                  <input 
                    type="number" 
                    className={`${inputClass} pl-10`}
                    name="minPrice"
                    value={professionalData.minPrice} 
                    onChange={handleProfessionalChange} 
                    placeholder="500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-1 mb-1.5 block">Máximo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-black">R$</span>
                  <input 
                    type="number" 
                    className={`${inputClass} pl-10`}
                    name="maxPrice"
                    value={professionalData.maxPrice} 
                    onChange={handleProfessionalChange} 
                    placeholder="2000"
                  />
                </div>
              </div>
            </div>
          </div>



          {/* Bio */}
          <div>
            <label className={labelClass}>Apresentação / Biografia</label>
            <textarea 
              name="bio"
              value={professionalData.bio}
              onChange={handleProfessionalChange}
              rows={4}
              className={inputClass + " resize-none"}
              placeholder="Conte um pouco sobre sua experiência e diferenciais..."
            />
          </div>
        </section>

        {/* Social Links */}
        <section className="bg-white/5 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#8A2BE2]/10 rounded-xl border border-[#8A2BE2]/20">
              <Instagram size={18} className="text-[#8A2BE2]" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.15em]">Portfólio & Redes</h2>
          </div>

          <div>
            <label className={labelClass}>Instagram URL</label>
            <div className="relative">
              <Instagram size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                className={`${inputClass} pl-10`}
                name="instagram"
                value={professionalData.instagram}
                onChange={handleProfessionalChange}
                placeholder="https://instagram.com/seuperfil"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Website / Portfólio</label>
            <div className="relative">
              <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                className={`${inputClass} pl-10`}
                name="website"
                value={professionalData.website}
                onChange={handleProfessionalChange}
                placeholder="https://seu-site.com"
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          id="save-profile-bottom-btn"
          onClick={handleSave}
          disabled={saveLoading}
          className={`w-full py-4 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2
            ${saved 
              ? 'bg-green-500 text-white shadow-green-950/30' 
              : 'bg-[#8A2BE2] text-white hover:bg-[#9D4EDD] shadow-[0_10px_30px_rgba(138,43,226,0.3)]'}`}
        >
          {saved ? <><Check size={18} /> Perfil Salvo com Sucesso!</> : saveLoading ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
        </button>

        {/* Logoff Button */}
        <button
          onClick={handleLogoff}
          className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] mt-6 duration-300"
        >
          <LogOut size={18} /> Sair da Conta (Logoff)
        </button>
      </div>
    </div>
  );
};

export default MyProfile;
