
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Camera } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { CustomService } from '../types';
import { MAIN_ROLES, SPECIALTIES } from '../constants';

const MyProfile: React.FC = () => {
  const navigate = useNavigate();

  // Mock initial state
  const [formData, setFormData] = useState({
    nomeCompleto: 'João Silva',
    username: 'joao_editor',
    email: 'joao@email.com',
    whatsapp: '11999999999',
    funcaoPrincipal: 'Editor de Vídeo',
    specialties: ['Casamento', 'Corporativo'],
    regiao: 'São Paulo, SP',
    bio: 'Editor com 5 anos de experiência em Premiere e DaVinci Resolve.',
    instagram: 'https://instagram.com/joao_editor',
    website: 'https://joaoeditor.com',
  });

  const [services, setServices] = useState<CustomService[]>([
    { name: 'Diária de Edição', price: 'R$ 800' },
    { name: 'Color Grading (Curta)', price: 'R$ 1200' }
  ]);

  const [newService, setNewService] = useState({ name: '', price: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSpecialty = (spec: string) => {
    setFormData(prev => {
      const current = prev.specialties || [];
      if (current.includes(spec)) {
        return { ...prev, specialties: current.filter(s => s !== spec) };
      } else {
        return { ...prev, specialties: [...current, spec] };
      }
    });
  };

  const handleAddService = () => {
    if (newService.name && newService.price) {
      setServices([...services, newService]);
      setNewService({ name: '', price: '' });
    }
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // In a real app, this would send data to backend
    alert('Perfil atualizado com sucesso!');
    navigate('/feed');
  };

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/feed')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Meu Perfil</h1>
        </div>
        <button 
          onClick={handleSave}
          className="text-[#8A2BE2] font-semibold text-sm hover:text-white transition-colors flex items-center gap-1"
        >
          <Save size={18} />
          Salvar
        </button>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer">
            <img 
              src="https://picsum.photos/200/200?random=1" 
              alt="Avatar" 
              className="w-24 h-24 rounded-full object-cover border-2 border-[#8A2BE2]"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
          </div>
          <div className="text-center w-full">
             <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Seu Link Personalizado</label>
             <div className="bg-[#1A1A1A] py-2 px-3 rounded-lg border border-gray-800 text-gray-400 text-sm truncate">
               freelinha.com/profile/<span className="text-white font-medium">{formData.username}</span>
             </div>
          </div>
        </div>

        {/* Personal Data */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Dados Pessoais</h2>
          <Input 
            label="Nome Completo" 
            name="nomeCompleto"
            value={formData.nomeCompleto}
            onChange={handleInputChange}
          />
          <Input 
            label="Email" 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          <Input 
            label="Whatsapp / Celular" 
            placeholder="(11) 99999-9999"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleInputChange}
          />
        </section>

        {/* Professional Data */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Profissional</h2>
          
          <Select 
            label="Função Principal"
            name="funcaoPrincipal"
            value={formData.funcaoPrincipal}
            onChange={handleInputChange}
          >
            <option value="">Selecione sua função...</option>
            {MAIN_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </Select>
          
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
                    ${formData.specialties.includes(spec)
                      ? 'bg-[#8A2BE2] border-[#8A2BE2] text-white shadow-lg' 
                      : 'bg-[#1A1A1A] border-gray-800 text-gray-400 hover:border-gray-600'}
                  `}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          <Input 
            label="Região (Cidade/Estado)" 
            placeholder="Ex: São Paulo, SP"
            name="regiao"
            value={formData.regiao}
            onChange={handleInputChange}
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Biografia</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg p-3 placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2] transition-all"
              placeholder="Conte um pouco sobre sua experiência..."
            />
          </div>
        </section>

        {/* Services & Custom Rates */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
             <h2 className="text-lg font-bold text-white">Serviços e Valores</h2>
             <span className="text-xs text-[#8A2BE2] bg-[#8A2BE2]/10 px-2 py-0.5 rounded-full">Personalizado</span>
          </div>
          <p className="text-sm text-gray-400">
            Defina os serviços que você oferece e o valor (ou faixa de valor) que deseja cobrar.
          </p>

          <div className="space-y-3">
            {services.map((service, index) => (
              <div key={index} className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-lg border border-gray-800">
                <div className="flex-1">
                  <p className="font-medium text-white">{service.name}</p>
                  <p className="text-[#8A2BE2] text-sm">{service.price}</p>
                </div>
                <button 
                  onClick={() => handleRemoveService(index)}
                  className="text-gray-500 hover:text-[#E3170D] transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#1A1A1A]/50 border border-dashed border-gray-700 rounded-lg space-y-3">
            <h3 className="text-sm font-medium text-white">Adicionar Novo Serviço</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="Ex: Diária Drone" 
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                className="text-sm"
              />
              <Input 
                placeholder="Ex: R$ 1500" 
                value={newService.price}
                onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                className="text-sm"
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              fullWidth 
              onClick={handleAddService}
              disabled={!newService.name || !newService.price}
            >
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        </section>

        {/* Socials */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Redes Sociais</h2>
          <Input 
            label="Instagram" 
            placeholder="https://instagram.com/..."
            name="instagram"
            value={formData.instagram}
            onChange={handleInputChange}
          />
          <Input 
            label="Website / Portfólio" 
            placeholder="https://seu-site.com"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
          />
        </section>

        <div className="pt-4">
          <Button onClick={handleSave} fullWidth>
            Salvar Alterações
          </Button>
        </div>

      </div>
    </div>
  );
};

export default MyProfile;
