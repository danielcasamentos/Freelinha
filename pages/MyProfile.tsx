import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Camera, Lock, DollarSign } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { CustomService } from '../types';
import { MAIN_ROLES, SPECIALTIES } from '../constants';
import { supabase } from '../lib/supabase';

const MyProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    specialties: [] as string[],
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
      if (!user) {
        navigate('/');
        return;
      }
      setCurrentUser(user);

      // Fetch from profiles
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

      // Fetch from freelancer_profiles
      const { data: freelaProfile } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (freelaProfile) {
        setProfessionalData({
          bio: freelaProfile.bio || '',
          specialties: freelaProfile.specialties || [],
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

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfessionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfessionalData(prev => ({ ...prev, [name]: name.includes('Price') ? Number(value) : value }));
  };

  const toggleSpecialty = (spec: string) => {
    setProfessionalData(prev => {
      const current = prev.specialties || [];
      if (current.includes(spec)) {
        return { ...prev, specialties: current.filter(s => s !== spec) };
      } else {
        return { ...prev, specialties: [...current, spec] };
      }
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      setSaveLoading(true);

      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: personalData.firstName,
          last_name: personalData.lastName,
          phone: personalData.phone,
          city: personalData.city,
          state: personalData.state,
          country: personalData.country,
          role: personalData.role
        })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      // Geocode city/state/country to get coordinates for distance filtering
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

      // 2. Update freelancer_profiles table
      const { error: freelaError } = await supabase
        .from('freelancer_profiles')
        .upsert({
          id: currentUser.id,
          bio: professionalData.bio,
          funcoes: [personalData.role],
          specialties: professionalData.specialties,
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

      alert('Perfil atualizado com sucesso!');
      navigate('/explore');
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

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/explore')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Meu Perfil</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveLoading}
          className="text-[#8A2BE2] font-semibold text-sm hover:text-white transition-colors flex items-center gap-1"
        >
          <Save size={18} />
          {saveLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <img 
              src={currentUser?.user_metadata?.avatar_url || "https://picsum.photos/200/200?random=1"} 
              alt="Avatar" 
              className="w-24 h-24 rounded-full object-cover border-2 border-[#8A2BE2]"
            />
          </div>
          <div className="text-center w-full">
             <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Seu Nome de Usuário</label>
             <div className="bg-[#1A1A1A] py-2.5 px-3 rounded-lg border border-gray-800 text-gray-400 text-sm truncate">
               @{currentUser?.user_metadata?.username || 'freelancer'}
             </div>
          </div>
        </div>

        {/* Personal Data */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Nome" 
              name="firstName"
              value={personalData.firstName}
              onChange={handlePersonalChange}
            />
            <Input 
              label="Sobrenome" 
              name="lastName"
              value={personalData.lastName}
              onChange={handlePersonalChange}
            />
          </div>
          <div className="relative">
            <Input 
              label="Email (Não alterável)" 
              type="email"
              name="email"
              value={personalData.email}
              disabled
              className="text-gray-500 cursor-not-allowed"
            />
            <Lock size={16} className="absolute right-3 top-[38px] text-gray-600" />
          </div>
          <Input 
            label="Whatsapp / Celular" 
            placeholder="(11) 99999-9999"
            name="phone"
            value={personalData.phone}
            onChange={handlePersonalChange}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Cidade" 
              name="city"
              value={personalData.city}
              onChange={handlePersonalChange}
            />
            <Input 
              label="Estado" 
              name="state"
              value={personalData.state}
              onChange={handlePersonalChange}
            />
          </div>
          <Input 
            label="País" 
            name="country"
            value={personalData.country}
            onChange={handlePersonalChange}
          />
        </section>

        {/* Professional Data */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Profissional</h2>
          
          <Select 
            label="Função Principal"
            name="role"
            value={personalData.role}
            onChange={handlePersonalChange}
          >
            <option value="">Selecione sua função...</option>
            {MAIN_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </Select>
          
          <Select 
            label="Disponibilidade"
            name="disponibilidade"
            value={professionalData.disponibilidade}
            onChange={handleProfessionalChange}
          >
            <option value="Disponível">Disponível</option>
            <option value="Ocupado">Ocupado</option>
            <option value="Indisponível">Indisponível</option>
          </Select>

          {/* Price Range Settings */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-400">Faixa de Preço Cobrado (Por Dia / Evento)</label>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                type="number"
                label="Valor Mínimo (R$)"
                name="minPrice"
                value={professionalData.minPrice}
                onChange={handleProfessionalChange}
              />
              <Input 
                type="number"
                label="Valor Máximo (R$)"
                name="maxPrice"
                value={professionalData.maxPrice}
                onChange={handleProfessionalChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Especialidades / Nichos</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(spec => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialty(spec)}
                  className={`
                    text-xs px-3 py-2 rounded-lg border transition-all
                    ${professionalData.specialties.includes(spec)
                      ? 'bg-[#8A2BE2] border-[#8A2BE2] text-white shadow-lg' 
                      : 'bg-[#1A1A1A] border-gray-800 text-gray-400 hover:border-gray-600'}
                  `}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Biografia</label>
            <textarea 
              name="bio"
              value={professionalData.bio}
              onChange={handleProfessionalChange}
              rows={4}
              className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg p-3 placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2] transition-all"
              placeholder="Conte um pouco sobre sua experiência..."
            />
          </div>
        </section>

        {/* Socials */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Redes Sociais</h2>
          <Input 
            label="Instagram URL" 
            placeholder="https://instagram.com/..."
            name="instagram"
            value={professionalData.instagram}
            onChange={handleProfessionalChange}
          />
          <Input 
            label="Website / Portfólio" 
            placeholder="https://seu-site.com"
            name="website"
            value={professionalData.website}
            onChange={handleProfessionalChange}
          />
        </section>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saveLoading} fullWidth className="bg-[#8A2BE2] hover:bg-[#9D4EDD]">
            {saveLoading ? 'Salvando Alterações...' : 'Salvar Alterações'}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default MyProfile;
