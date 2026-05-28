import React, { useState } from 'react';
import { X, MapPin, DollarSign, FileText, Camera, Check } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { supabase } from '../lib/supabase';
import { MAIN_ROLES } from '../constants';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    role: '',
    location: '',
    value: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Você precisa estar logado para publicar uma vaga.');
      }

      // Geocode the job location via Nominatim
      let lat = -23.5505; // default SP center
      let lng = -46.6333;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.location + ', Brasil')}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        const results = await res.json();
        if (results.length > 0) {
          lat = parseFloat(results[0].lat);
          lng = parseFloat(results[0].lon);
        }
      } catch (geocodeErr) {
        console.error('Erro de geocodificação ao criar vaga:', geocodeErr);
      }

      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          title: formData.title,
          type: formData.type || 'Casamento',
          role: formData.role || 'Videomaker',
          location: formData.location || 'São Paulo, SP',
          latitude: lat,
          longitude: lng,
          value: formData.value || 'R$ 1.000',
          description: formData.description,
          author_id: user.id,
          status: 'Open'
        });

      if (insertError) throw insertError;

      setStep(3);
      setTimeout(() => {
        onClose();
        setStep(1);
        setFormData({
          title: '',
          type: '',
          role: '',
          location: '',
          value: '',
          description: ''
        });
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao publicar a vaga.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1A1A1A] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-800">
            <div 
                className="h-full bg-[#8A2BE2] transition-all duration-500" 
                style={{ width: `${(step / 3) * 100}%` }}
            />
        </div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-white">Postar <span className="text-[#8A2BE2]">Vaga</span></h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Passo {step} de 3</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold text-center mb-4">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <Input 
                  label="Título do Projeto"
                  placeholder="Ex: Casamento na Praia, Vídeo Institucional..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo</label>
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#8A2BE2]/50 outline-none transition-all appearance-none"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="">Selecione...</option>
                            <option value="Casamento">Casamento</option>
                            <option value="Publicidade">Publicidade</option>
                            <option value="Corporativo">Corporativo</option>
                            <option value="Social">Social</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Profissional</label>
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#8A2BE2]/50 outline-none transition-all appearance-none"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                        >
                            <option value="">Selecione...</option>
                            {MAIN_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                </div>
              </div>
              <Button fullWidth onClick={() => setStep(2)} disabled={!formData.title || !formData.type || !formData.role}>Próximo Passo</Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <Input 
                  label="Localização"
                  placeholder="Cidade, Estado"
                  icon={<MapPin size={18} />}
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
                <Input 
                  label="Orçamento Estimado"
                  placeholder="R$ 1.500,00"
                  icon={<DollarSign size={18} />}
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  required
                />
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Descrição do Trabalho</label>
                    <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#8A2BE2]/50 outline-none transition-all min-h-[120px] resize-none"
                        placeholder="Descreva os detalhes do projeto, equipamentos necessários e prazos..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                    />
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" type="button" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                <Button type="submit" disabled={loading} className="flex-2">{loading ? 'Publicando...' : 'Publicar Vaga'}</Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="py-12 text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <Check size={40} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Vaga Publicada!</h3>
                <p className="text-gray-500 text-sm mt-2">Em breve profissionais qualificados entrarão em contato.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
