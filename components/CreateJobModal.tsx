import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, Check, Sparkles, Calendar } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { supabase } from '../lib/supabase';
import { MAIN_ROLES, SPECIALTIES } from '../constants';

const ALL_SKILLS = [...MAIN_ROLES, ...SPECIALTIES];
const DEFAULT_JOB_TYPES = ["Casamento", "Publicidade", "Corporativo", "Social"];

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobToEdit?: any; // Optional job structure to edit
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, jobToEdit }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    value: '',
    description: '',
    date: ''
  });

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [customRoleInput, setCustomRoleInput] = useState('');

  useEffect(() => {
    if (jobToEdit && isOpen) {
      setFormData({
        title: jobToEdit.title || '',
        location: jobToEdit.location || '',
        value: jobToEdit.value || '',
        description: jobToEdit.description || '',
        date: jobToEdit.date || ''
      });
      setSelectedTypes(jobToEdit.type ? jobToEdit.type.split(',').map((t: string) => t.trim()) : []);
      setSelectedRoles(jobToEdit.role ? jobToEdit.role.split(',').map((r: string) => r.trim()) : []);
      setStep(1);
    } else if (isOpen) {
      setFormData({
        title: '',
        location: '',
        value: '',
        description: '',
        date: ''
      });
      setSelectedTypes([]);
      setSelectedRoles([]);
      setStep(1);
    }
  }, [jobToEdit, isOpen]);

  if (!isOpen) return null;

  // Format currency on the fly: R$ X.XXX
  const formatBRL = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    const number = parseInt(clean, 10);
    return 'R$ ' + number.toLocaleString('pt-BR');
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatBRL(raw);
    setFormData(prev => ({ ...prev, value: formatted }));
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleAddCustomType = () => {
    const trimmed = customTypeInput.trim();
    if (!trimmed) return;
    setSelectedTypes(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setCustomTypeInput('');
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      }
      return [...prev, role];
    });
  };

  const handleAddCustomRole = () => {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    setSelectedRoles(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setCustomRoleInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const typeStr = selectedTypes.join(', ') || 'Casamento';
    const roleStr = selectedRoles.join(', ') || 'Videomaker';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Você precisa estar logado para publicar/editar uma vaga.');
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
        console.error('Erro de geocodificação ao criar/editar vaga:', geocodeErr);
      }

      let saveError;
      if (jobToEdit) {
        // Edit flow
        const { error } = await supabase
          .from('jobs')
          .update({
            title: formData.title,
            type: typeStr,
            role: roleStr,
            location: formData.location || 'São Paulo, SP',
            latitude: lat,
            longitude: lng,
            value: formData.value || 'R$ 1.000',
            original_value: jobToEdit.original_value || jobToEdit.value || formData.value,
            description: formData.description,
            date: formData.date || null
          })
          .eq('id', jobToEdit.id);
        saveError = error;
      } else {
        // Create flow
        const { error } = await supabase
          .from('jobs')
          .insert({
            title: formData.title,
            type: typeStr,
            role: roleStr,
            location: formData.location || 'São Paulo, SP',
            latitude: lat,
            longitude: lng,
            value: formData.value || 'R$ 1.000',
            original_value: formData.value || 'R$ 1.000',
            description: formData.description,
            date: formData.date || null,
            author_id: user.id,
            status: 'Open'
          });
        saveError = error;
      }

      if (saveError) throw saveError;

      setStep(3);
      setTimeout(() => {
        onClose();
        setStep(1);
        setFormData({
          title: '',
          location: '',
          value: '',
          description: '',
          date: ''
        });
        setSelectedTypes([]);
        setSelectedRoles([]);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar a vaga.');
    } finally {
      setLoading(false);
    }
  };

  const isStep1Disabled = !formData.title || selectedTypes.length === 0 || selectedRoles.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1A1A1A] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 max-h-[90vh] flex flex-col">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-800 shrink-0">
            <div 
                className="h-full bg-[#8A2BE2] transition-all duration-500" 
                style={{ width: `${(step / 3) * 100}%` }}
            />
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-white">{jobToEdit ? 'Editar' : 'Postar'} <span className="text-[#8A2BE2]">Vaga</span></h2>
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
              <div className="space-y-5">
                <Input 
                  label="Título do Projeto"
                  placeholder="Ex: Casamento na Praia, Vídeo Institucional..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />

                {/* Job Type Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo de Trabalho da Vaga</label>
                  
                  {/* Default types pills */}
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_JOB_TYPES.map(type => {
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleType(type)}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all font-bold
                            ${isSelected
                              ? 'bg-[#8A2BE2] border-[#8A2BE2] text-white shadow-[0_0_12px_rgba(138,43,226,0.3)]'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#8A2BE2]/40 hover:text-white'}`}
                        >
                          {type}
                        </button>
                      );
                    })}

                    {/* Custom added types pills */}
                    {selectedTypes.filter(t => !DEFAULT_JOB_TYPES.includes(t)).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        className="text-xs px-3.5 py-2 rounded-xl border transition-all font-bold bg-[#8A2BE2] border-[#8A2BE2] text-white shadow-[0_0_12px_rgba(138,43,226,0.3)] flex items-center gap-1 animate-in zoom-in duration-200"
                      >
                        {type}
                        <X size={12} className="opacity-60 hover:opacity-100" />
                      </button>
                    ))}
                  </div>

                  {/* Add Custom Type input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Outro tipo de trabalho..."
                      value={customTypeInput}
                      onChange={e => setCustomTypeInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomType();
                        }
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2]/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomType}
                      className="bg-white/10 hover:bg-white/15 border border-white/5 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Desired Professional Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Profissionais / Habilidades Desejadas</label>
                  <p className="text-[9px] text-gray-600 font-bold ml-1">Selecione uma ou mais habilidades ou adicione especialidades</p>
                  
                  {/* Grid / list of predefined roles */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#222] rounded-xl border border-white/5">
                    {ALL_SKILLS.map(role => {
                      const isSelected = selectedRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all font-bold
                            ${isSelected
                              ? 'bg-[#8A2BE2] border-[#8A2BE2] text-white'
                              : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'}`}
                        >
                          {role}
                        </button>
                      );
                    })}

                    {/* Custom added roles pills */}
                    {selectedRoles.filter(r => !ALL_SKILLS.includes(r)).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg border transition-all font-bold bg-[#8A2BE2] border-[#8A2BE2] text-white flex items-center gap-1 animate-in zoom-in duration-200"
                      >
                        {role}
                        <X size={10} className="opacity-60 hover:opacity-100" />
                      </button>
                    ))}
                  </div>

                  {/* Add Custom Role/Specialty input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ex: Roteirista de Humor, Animador 3D..."
                      value={customRoleInput}
                      onChange={e => setCustomRoleInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomRole();
                        }
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2]/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomRole}
                      className="bg-white/10 hover:bg-white/15 border border-white/5 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
              <Button fullWidth onClick={() => setStep(2)} disabled={isStep1Disabled}>Próximo Passo</Button>
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
                  placeholder="R$ 1.500"
                  icon={<DollarSign size={18} />}
                  value={formData.value}
                  onChange={handleValueChange}
                  required
                />
                
                {/* Event Date field — prominent with calendar icon */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data do Evento</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-[#8A2BE2]/20 rounded-lg">
                      <Calendar size={14} className="text-[#8A2BE2]" />
                    </div>
                    <input
                      type="date"
                      className="w-full bg-[#222] border border-[#8A2BE2]/30 rounded-2xl p-4 pl-12 text-white text-sm focus:border-[#8A2BE2]/70 outline-none transition-all"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  {formData.date && (() => {
                    const eventDate = new Date(formData.date + 'T00:00:00');
                    const today = new Date();
                    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysUntil <= 0) return null;
                    return (
                      <p className={`text-[10px] font-black ml-1 ${
                        daysUntil <= 7 ? 'text-red-400' : daysUntil <= 30 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {daysUntil <= 7 ? '🔴' : daysUntil <= 30 ? '🟡' : '🟢'} Faltam {daysUntil} dias · {eventDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    );
                  })()}
                </div>

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
                <Button type="submit" disabled={loading} className="flex-2">{loading ? 'Salvando...' : (jobToEdit ? 'Salvar Alterações' : 'Publicar Vaga')}</Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="py-12 text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <Check size={40} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{jobToEdit ? 'Vaga Atualizada!' : 'Vaga Publicada!'}</h3>
                <p className="text-gray-500 text-sm mt-2">
                  {jobToEdit ? 'Suas alterações foram salvas com sucesso.' : 'Em breve profissionais qualificados entrarão em contato.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
