
import React, { useState, useMemo } from 'react';
import { Search, UserCircle, MapPin, SlidersHorizontal, X, LocateFixed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_FREELANCERS, MAIN_ROLES, SPECIALTIES } from '../constants';
import FreelancerCard from '../components/FreelancerCard';
import Input from '../components/Input';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import Select from '../components/Select';

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter States
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('BRL');

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(MOCK_FREELANCERS.map(f => f.regiao))).sort();
  }, []);

  const handleUseLocation = () => {
    // Mock geolocation behavior
    if (navigator.geolocation) {
      // Simulate success delay
      setTimeout(() => {
        setLocation('São Paulo, SP'); // Mock finding user in SP
      }, 500);
    }
  };

  const clearFilters = () => {
    setSelectedRole('');
    setSelectedSpecialty('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setCurrency('BRL');
    setIsFilterOpen(false);
  };

  const activeFiltersCount = [
    selectedRole, 
    selectedSpecialty,
    location, 
    minPrice, 
    maxPrice
  ].filter(Boolean).length;

  const filteredFreelancers = useMemo(() => {
    return MOCK_FREELANCERS.filter(f => {
      // 1. Text Search Logic
      const matchesSearch = 
        searchTerm === '' ||
        f.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.funcoes.some(func => func.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.specialties && f.specialties.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        f.regiao.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Advanced Filters Logic
      
      // Role Filter (Main Role)
      if (selectedRole && !f.funcoes.includes(selectedRole)) return false;

      // Specialty Filter
      if (selectedSpecialty && !f.specialties?.includes(selectedSpecialty)) return false;

      // Location Filter (Partial match)
      if (location && !f.regiao.toLowerCase().includes(location.toLowerCase())) return false;

      // Currency Filter
      if (f.currency !== currency) return false;

      // Price Filter
      const fMin = f.minPrice || 0;
      const fMax = f.maxPrice || 999999;
      const filterMin = minPrice ? parseFloat(minPrice) : 0;
      const filterMax = maxPrice ? parseFloat(maxPrice) : Infinity;

      // Check if ranges overlap
      // Freelancer range: [fMin, fMax]
      // User filter: [filterMin, filterMax]
      // Overlap if (StartA <= EndB) and (EndA >= StartB)
      const rangesOverlap = (fMin <= filterMax) && (fMax >= filterMin);
      
      if (!rangesOverlap) return false;

      return true;
    });
  }, [searchTerm, selectedRole, selectedSpecialty, location, minPrice, maxPrice, currency]);

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-32">
      {/* Fixed Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold select-none">
          Free<span className="text-[#8A2BE2]">linha</span>
        </h1>
        <button 
          onClick={() => navigate('/my-profile')}
          className="text-[#8A2BE2] hover:text-white transition-colors p-1"
          title="Meu Perfil"
        >
          <UserCircle size={28} />
        </button>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex gap-2">
          <div className="flex-1">
             <Input 
              placeholder="Busque por nome, tag..." 
              icon={<Search size={20} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-xl"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className={`
              flex items-center justify-center w-12 shrink-0 rounded-lg border transition-colors
              ${activeFiltersCount > 0 
                ? 'bg-[#8A2BE2] border-[#8A2BE2] text-white' 
                : 'bg-[#1A1A1A] border-gray-800 text-gray-400 hover:text-white'}
            `}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {selectedRole && <span className="bg-[#8A2BE2]/20 text-[#8A2BE2] text-xs px-3 py-1 rounded-full border border-[#8A2BE2]/30 whitespace-nowrap">{selectedRole}</span>}
            {selectedSpecialty && <span className="bg-purple-900/40 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-800 whitespace-nowrap">{selectedSpecialty}</span>}
            {location && <span className="bg-[#8A2BE2]/20 text-[#8A2BE2] text-xs px-3 py-1 rounded-full border border-[#8A2BE2]/30 whitespace-nowrap">{location}</span>}
            {(minPrice || maxPrice) && <span className="bg-[#8A2BE2]/20 text-[#8A2BE2] text-xs px-3 py-1 rounded-full border border-[#8A2BE2]/30 whitespace-nowrap">{currency} {minPrice}-{maxPrice}</span>}
             <button onClick={clearFilters} className="text-xs text-gray-500 underline whitespace-nowrap px-2">Limpar</button>
          </div>
        )}

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>{filteredFreelancers.length} profissionais</span>
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span>Brasil</span>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4 min-h-[50vh]">
          {filteredFreelancers.length > 0 ? (
            filteredFreelancers.map(freelancer => (
              <FreelancerCard key={freelancer.id} freelancer={freelancer} />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500 bg-[#1A1A1A] rounded-xl border border-gray-800 border-dashed">
              <p>Nenhum profissional encontrado.</p>
              <Button 
                onClick={clearFilters}
                variant="ghost"
                className="mt-2 text-[#8A2BE2]"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Filter Drawer/Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:items-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           {/* Close area */}
           <div className="flex-1 w-full" onClick={() => setIsFilterOpen(false)} />
           
           <div className="bg-[#1A1A1A] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 border-t sm:border border-gray-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">Filtros Avançados</h3>
               <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-white p-2">
                 <X size={24} />
               </button>
             </div>

             <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
               {/* Role Filter */}
               <div className="space-y-2">
                 <Select 
                    label="Função Principal"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                 >
                   <option value="">Todas as funções</option>
                   {MAIN_ROLES.map(role => (
                     <option key={role} value={role}>{role}</option>
                   ))}
                 </Select>
               </div>

               {/* Specialty Filter */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-400">Especialidade / Nicho</label>
                 <div className="flex flex-wrap gap-2">
                   {SPECIALTIES.map(spec => (
                     <button
                       key={spec}
                       onClick={() => setSelectedSpecialty(selectedSpecialty === spec ? '' : spec)}
                       className={`
                         text-xs px-3 py-1.5 rounded-full border transition-all
                         ${selectedSpecialty === spec 
                           ? 'bg-[#8A2BE2] border-[#8A2BE2] text-white shadow-lg' 
                           : 'bg-[#121212] border-gray-800 text-gray-400 hover:border-gray-600'}
                       `}
                     >
                       {spec}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Location Filter */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-400">Localização</label>
                 <div className="relative">
                   <Input 
                     placeholder="Cidade, Estado..."
                     value={location}
                     onChange={(e) => setLocation(e.target.value)}
                   />
                   <button 
                    onClick={handleUseLocation}
                    className="absolute right-3 top-3 text-[#8A2BE2] hover:text-white transition-colors"
                    title="Usar minha localização"
                   >
                     <LocateFixed size={20} />
                   </button>
                 </div>
                 <div className="flex flex-wrap gap-2 mt-2">
                   {/* Quick cities */}
                   {uniqueLocations.slice(0, 3).map(loc => (
                     <button 
                      key={loc}
                      onClick={() => setLocation(loc)}
                      className="text-xs bg-[#121212] border border-gray-800 px-2 py-1 rounded text-gray-400 hover:text-white hover:border-gray-600"
                     >
                       {loc}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Price & Currency Filter */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-400">Faixa de Valor</label>
                 
                 <div className="flex gap-2 mb-2">
                    <button 
                      onClick={() => setCurrency('BRL')} 
                      className={`flex-1 py-1 text-sm rounded border ${currency === 'BRL' ? 'bg-[#8A2BE2]/20 border-[#8A2BE2] text-[#8A2BE2]' : 'border-gray-800 text-gray-500'}`}
                    >
                      BRL (R$)
                    </button>
                    <button 
                      onClick={() => setCurrency('USD')} 
                      className={`flex-1 py-1 text-sm rounded border ${currency === 'USD' ? 'bg-[#8A2BE2]/20 border-[#8A2BE2] text-[#8A2BE2]' : 'border-gray-800 text-gray-500'}`}
                    >
                      USD ($)
                    </button>
                     <button 
                      onClick={() => setCurrency('EUR')} 
                      className={`flex-1 py-1 text-sm rounded border ${currency === 'EUR' ? 'bg-[#8A2BE2]/20 border-[#8A2BE2] text-[#8A2BE2]' : 'border-gray-800 text-gray-500'}`}
                    >
                      EUR (€)
                    </button>
                 </div>

                 <div className="flex gap-4 items-center">
                   <Input 
                      type="number" 
                      placeholder="Mín" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                   />
                   <span className="text-gray-500">-</span>
                   <Input 
                      type="number" 
                      placeholder="Máx" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                   />
                 </div>
               </div>
             </div>

             <div className="mt-8 pt-4 border-t border-gray-800 flex gap-4 safe-area-bottom">
               <Button variant="ghost" onClick={clearFilters} className="flex-1">Limpar</Button>
               <Button onClick={() => setIsFilterOpen(false)} className="flex-[2]">Aplicar Filtros</Button>
             </div>
           </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Feed;
