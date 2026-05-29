import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, MapPin, Briefcase, Filter, Plus,
    Sparkles, LayoutGrid, Users, ShieldCheck, Star, Navigation, X, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import Input from '../components/Input';
import Button from '../components/Button';
import CreateJobModal from '../components/CreateJobModal';
import FreelancerCard from '../components/FreelancerCard';

// Haversine formula — distance in km between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isSameCity(userCity: string | undefined | null, userState: string | undefined | null, jobLocationStr: string | undefined | null): boolean {
  if (!userCity || !jobLocationStr) return false;
  const uCity = userCity.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const jobParts = jobLocationStr.split(',').map(p => p.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const jCity = jobParts[0] || "";
  
  return uCity === jCity || uCity.includes(jCity) || jCity.includes(uCity);
}

function isFreelancerSameCity(userCity: string | undefined | null, userState: string | undefined | null, otherCity: string | undefined | null, otherState: string | undefined | null): boolean {
  if (!userCity || !otherCity) return false;
  const uCity = userCity.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const oCity = otherCity.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return uCity === oCity || uCity.includes(oCity) || oCity.includes(uCity);
}

function formatDistance(km: number, isSameCityFlag?: boolean): string {
  if (isSameCityFlag) return 'Na sua cidade';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

function distanceBadgeColor(km: number): string {
  if (km <= 20) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (km <= 100) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-gray-700/50 text-gray-400 border-gray-600/30';
}

import { useApp } from '../lib/AppContext';

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vagas' | 'profissionais' | 'minhas'>('vagas');

  // Advanced filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Global cached states from AppContext
  const { 
    currentUser, 
    vacancies, 
    freelancers, 
    myMatches, 
    loading, 
    refetchAll 
  } = useApp();

  // Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [citySearch, setCitySearch] = useState('');
  const [citySearching, setCitySearching] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const citySearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Separate state for author's full job history (including archived/expired)
  const [myAllJobs, setMyAllJobs] = useState<any[]>([]);
  const [myAllJobsLoading, setMyAllJobsLoading] = useState(false);

  // Auto-request GPS on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: 'Sua localização'
          });
          setLocationStatus('active');
        },
        () => {
          setLocationStatus('error');
        },
        { timeout: 8000 }
      );
    } else {
      setLocationStatus('error');
    }
  }, []);

  // Fetch ALL jobs for the author (including archived) when on the Postadas tab
  useEffect(() => {
    if (activeTab !== 'minhas' || !currentUser) return;
    setMyAllJobsLoading(true);
    supabase
      .from('jobs')
      .select('*')
      .eq('author_id', currentUser.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setMyAllJobs(data);
      })
      .finally(() => setMyAllJobsLoading(false));
  }, [activeTab, currentUser]);

  // Geocode city name via Nominatim (free, no API key)
  const handleCitySearch = async (cityName: string) => {
    if (!cityName.trim()) {
      setCityError(null);
      return;
    }
    try {
      setCitySearching(true);
      setCityError(null);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + ', Brasil')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const shortLabel = display_name.split(',').slice(0, 2).join(',').trim();
        setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lon), label: shortLabel });
        setLocationStatus('active');
        setCitySearch('');
      } else {
        setCityError('Cidade não encontrada. Tente ex: "São Paulo" ou "Rio de Janeiro".');
      }
    } catch {
      setCityError('Erro ao buscar cidade. Verifique sua conexão.');
    } finally {
      setCitySearching(false);
    }
  };

  const clearLocation = () => {
    setUserLocation(null);
    setLocationStatus('idle');
    setCitySearch('');
    setCityError(null);
  };

  // Attach distance to each job, apply filters, and sort with smart logic
  const jobsWithDistance = useMemo(() => {
    const hasDateFilter = !!(filterDateFrom || filterDateTo);
    const hasCityFilter = !!filterCity.trim();

    return vacancies
      .filter(job => {
        // Text search
        const q = searchTerm.toLowerCase();
        const matchesText = !q || (
          job.title?.toLowerCase().includes(q) ||
          job.role?.toLowerCase().includes(q) ||
          job.type?.toLowerCase().includes(q) ||
          job.description?.toLowerCase().includes(q) ||
          job.location?.toLowerCase().includes(q)
        );

        // City filter
        const matchesCity = !hasCityFilter || (
          job.location?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .includes(filterCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        );

        // Date filter — only apply if job has a date
        let matchesDate = true;
        if (hasDateFilter && job.date) {
          const d = new Date(job.date);
          if (filterDateFrom) matchesDate = matchesDate && d >= new Date(filterDateFrom);
          if (filterDateTo)   matchesDate = matchesDate && d <= new Date(filterDateTo);
        } else if (hasDateFilter && !job.date) {
          matchesDate = false;
        }

        return matchesText && matchesCity && matchesDate;
      })
      .map(job => {
        const sameCity = isSameCity(currentUser?.city, currentUser?.state, job.location);
        let dist = (userLocation && job.latitude && job.longitude)
          ? getDistance(userLocation.lat, userLocation.lng, job.latitude, job.longitude)
          : null;
        if (sameCity && (dist === null || dist > 150)) {
          dist = 0.1;
        }
        return { ...job, distance: dist };
      })
      .sort((a, b) => {
        if (hasCityFilter && !hasDateFilter) {
          const da = a.date ? new Date(a.date).getTime() : Infinity;
          const db = b.date ? new Date(b.date).getTime() : Infinity;
          return da - db;
        }
        if (hasDateFilter && !hasCityFilter) {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        }
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [vacancies, searchTerm, userLocation, currentUser, filterCity, filterDateFrom, filterDateTo]);

  // Attach distance to freelancers and sort
  const freelancersWithDistance = useMemo(() => {
    return freelancers
      .filter(f => {
        if (currentUser && f.id === currentUser.id) return false;
        const name = `${f.profile?.first_name || ''} ${f.profile?.last_name || ''}`;
        const q = searchTerm.toLowerCase();
        return !q || name.toLowerCase().includes(q) ||
          (f.funcoes && f.funcoes.some((r: string) => r.toLowerCase().includes(q)));
      })
      .map(f => {
        const sameCity = isFreelancerSameCity(currentUser?.city, currentUser?.state, f.profile?.city, f.profile?.state);
        let dist = (userLocation && f.latitude && f.longitude)
          ? getDistance(userLocation.lat, userLocation.lng, f.latitude, f.longitude)
          : null;
        if (sameCity && (dist === null || dist > 150)) {
          dist = 0.1;
        }
        return {
          ...f,
          distance: dist
        };
      })
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [freelancers, searchTerm, userLocation, currentUser]);

  const eliteFreelancers = useMemo(() =>
    freelancersWithDistance.filter(f => f.rate >= 4.8 && f.id !== currentUser?.id).slice(0, 5),
    [freelancersWithDistance, currentUser]
  );

  const myJobs = useMemo(() =>
    vacancies.filter(v => v.author_id === currentUser?.id),
    [vacancies, currentUser]
  );

  const handleInterest = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (myMatches.some(m => m.job_id === jobId)) return;
    try {
      const { error } = await supabase.from('matches').insert({
        job_id: jobId, freelancer_id: currentUser.id, status: 'Pending'
      });
      if (error) throw error;
      refetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-[#8A2BE2] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#121212] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              Central de <span className="text-[#8A2BE2]">Oportunidades</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-black tracking-[0.2em] uppercase mt-1">Marketplace Audiovisual</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#8A2BE2] hover:bg-[#9D4EDD] text-white p-3.5 rounded-2xl transition-all duration-300 shadow-[0_10px_25px_rgba(138,43,226,0.4)] hover:scale-110 active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 p-1.5 rounded-[22px] border border-white/5">
          {(['vagas', 'profissionais', 'minhas'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                ${activeTab === tab ? 'bg-[#8A2BE2] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              {tab === 'vagas' ? 'Vagas' : tab === 'profissionais' ? 'Freelas' : 'Postadas'}
            </button>
          ))}
        </div>
      </header>

      <CreateJobModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); refetchAll(); }} />

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto animate-in fade-in duration-500">

        {/* Search + Location + Filters Bar */}
        {activeTab !== 'minhas' && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder={activeTab === 'vagas' ? 'Busque por cargo, projeto...' : 'Busque por nome, especialidade...'}
                  icon={<Search size={20} className="text-gray-500" />}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <button
                onClick={() => setShowFilterPanel(prev => !prev)}
                className={`border p-3 rounded-xl hover:text-white transition-all ${
                  showFilterPanel || filterCity || filterDateFrom || filterDateTo
                    ? 'bg-[#8A2BE2]/20 border-[#8A2BE2]/40 text-[#8A2BE2]'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
                title="Filtros avançados"
              >
                <Filter size={20} />
              </button>
            </div>

            {/* Advanced Filter Panel */}
            {showFilterPanel && (
              <div className="bg-white/5 border border-[#8A2BE2]/20 rounded-[24px] p-5 space-y-4 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#8A2BE2] uppercase tracking-widest">Filtros Avançados</span>
                  {(filterCity || filterDateFrom || filterDateTo) && (
                    <button
                      onClick={() => { setFilterCity(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                      className="text-[9px] font-black text-red-400 uppercase tracking-wider hover:text-red-300 transition-all"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>

                {/* City filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo, Rio de Janeiro..."
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-xl px-4 py-2.5 placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2]/50 transition-all"
                  />
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data a partir de</label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={e => setFilterDateFrom(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#8A2BE2]/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Até</label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={e => setFilterDateTo(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#8A2BE2]/50 transition-all"
                    />
                  </div>
                </div>

                {/* Smart sort hint */}
                <p className="text-[9px] text-gray-600 font-bold">
                  {filterCity && !filterDateFrom && !filterDateTo
                    ? '📅 Ordenação por data do evento (mais próximos primeiro)'
                    : (filterDateFrom || filterDateTo) && !filterCity
                    ? '📍 Ordenação por distância da sua localização'
                    : '📍 Ordenação padrão por distância'}
                </p>
              </div>
            )}

            {/* Location Panel */}
            <div className="bg-white/5 border border-white/5 rounded-[24px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation size={15} className={locationStatus === 'active' ? 'text-[#8A2BE2]' : 'text-gray-600'} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {locationStatus === 'loading' ? 'Detectando localização...' :
                     locationStatus === 'active' ? (userLocation?.label || 'GPS Ativo') :
                     locationStatus === 'error' ? 'GPS indisponível' : 'Localização desativada'}
                  </span>
                </div>
                {locationStatus === 'active' && (
                  <button onClick={clearLocation} className="text-gray-600 hover:text-white transition-all">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* City Search Input */}
              {locationStatus !== 'active' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ou busque por cidade: ex. São Paulo"
                    value={citySearch}
                    onChange={e => setCitySearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCitySearch(citySearch)}
                    className="flex-1 bg-white/5 border border-white/10 text-white text-xs rounded-xl px-4 py-2.5 placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2]/50 transition-all"
                  />
                  <button
                    onClick={() => handleCitySearch(citySearch)}
                    disabled={citySearching || !citySearch.trim()}
                    className="bg-[#8A2BE2] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-[#9D4EDD]"
                  >
                    {citySearching ? '...' : 'Buscar'}
                  </button>
                </div>
              )}

              {cityError && <p className="text-red-400 text-[10px] font-bold">{cityError}</p>}

              {locationStatus === 'active' && (
                <p className="text-[10px] text-gray-500">
                  Resultados ordenados por distância · Distâncias exibidas em cada card
                </p>
              )}
            </div>
          </div>
        )}

        {/* VAGAS TAB */}
        {activeTab === 'vagas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                {userLocation ? 'Ordenado por Distância' : 'Oportunidades em Aberto'}
              </h2>
              <span className="text-xs font-medium text-[#8A2BE2]">{jobsWithDistance.length} encontradas</span>
            </div>

            <div className="space-y-4">
              {jobsWithDistance.map(job => {
                const match = myMatches.find(m => m.job_id === job.id);
                const isAccepted = match?.status === 'Accepted';
                const isPending = match?.status === 'Pending';

                return (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="group bg-[#1A1A1A] border border-white/5 rounded-[32px] p-6 transition-all duration-500 hover:border-[#8A2BE2]/30 hover:bg-[#222] shadow-2xl cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Clickable Job Type Tags */}
                          {(job.type || 'Job').split(',').map((t: string) => t.trim()).map((t: string, i: number) => (
                            <button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchTerm(t);
                              }}
                              className="text-[9px] font-black text-[#8A2BE2] uppercase tracking-wider bg-[#8A2BE2]/10 hover:bg-[#8A2BE2]/25 border border-[#8A2BE2]/20 hover:border-[#8A2BE2]/40 px-2 py-0.5 rounded-md transition-all z-10"
                            >
                              {t}
                            </button>
                          ))}
                          {/* Distance Badge */}
                          {job.distance !== null && (
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${distanceBadgeColor(job.distance)}`}>
                              📍 {formatDistance(job.distance, isSameCity(currentUser?.city, currentUser?.state, job.location))}
                            </span>
                          )}
                          {/* Date Badge */}
                          {job.date && (() => {
                            const eventDate = new Date(job.date + 'T00:00:00');
                            const today = new Date();
                            const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            if (daysUntil < 0) return null;
                            const color = daysUntil <= 7
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : daysUntil <= 30
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                            return (
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${color}`}>
                                <Calendar size={9} />
                                {daysUntil === 0 ? 'Hoje!' : daysUntil === 1 ? 'Amanhã!' : `${daysUntil}d`}
                              </span>
                            );
                          })()}
                        </div>
                        <h3 className="text-xl font-black text-white group-hover:text-[#8A2BE2] transition-colors tracking-tight truncate">
                          {job.title}
                        </h3>
                        {/* Clickable Desired Professional Tags */}
                        {job.role && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(job.role || '').split(',').map((r: string) => r.trim()).map((r: string, i: number) => (
                              <button
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchTerm(r);
                                }}
                                className="text-[9px] font-black text-gray-400 bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10 uppercase transition-all z-10"
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-black text-white">{job.value}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{job.location}</div>
                        {job.date && (
                          <div className="text-[9px] text-gray-600 font-bold mt-1">
                            {new Date(job.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center font-black text-[10px]">
                          {(job.author?.first_name || 'U').charAt(0)}
                        </div>
                        {job.author ? `${job.author.first_name} ${job.author.last_name}` : 'Usuário'}
                      </div>
                      {job.author_id === currentUser?.id ? (
                        <span className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-500 border border-white/5">
                          Sua Vaga
                        </span>
                      ) : (
                        <button
                          onClick={e => handleInterest(e, job.id)}
                          disabled={!!match}
                          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${isAccepted ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : isPending ? 'bg-[#8A2BE2]/10 text-[#8A2BE2] border border-[#8A2BE2]/20'
                            : 'bg-white text-black hover:bg-[#8A2BE2] hover:text-white shadow-lg'}`}
                        >
                          {isAccepted ? '✓ MATCH!' : isPending ? 'INTERESSE ENVIADO' : 'TENHO INTERESSE'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {jobsWithDistance.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-white/5 border-dashed space-y-4">
                  <Briefcase size={40} className="mx-auto text-gray-600" />
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Nenhuma vaga encontrada</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFISSIONAIS TAB */}
        {activeTab === 'profissionais' && (
          <div className="space-y-10">
            {eliteFreelancers.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <ShieldCheck size={18} className="text-[#8A2BE2]" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Sugestões de Elite</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {eliteFreelancers.map(f => {
                    const name = `${f.profile?.first_name || ''} ${f.profile?.last_name || ''}`;
                    const sameCity = isFreelancerSameCity(currentUser?.city, currentUser?.state, f.profile?.city, f.profile?.state);
                    let dist = (userLocation && f.latitude && f.longitude)
                      ? getDistance(userLocation.lat, userLocation.lng, f.latitude, f.longitude)
                      : null;
                    if (sameCity && (dist === null || dist > 150)) {
                      dist = 0.1;
                    }
                    return (
                      <div
                        key={f.id}
                        onClick={() => navigate(`/profile/${f.profile?.username}`)}
                        className="min-w-[160px] bg-white/5 border border-white/5 rounded-[32px] p-5 flex flex-col items-center gap-3 cursor-pointer hover:bg-white/10 transition-all"
                      >
                        <div className="relative">
                          <img src={f.profile?.avatar_url || 'https://picsum.photos/200/200?random=1'} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#8A2BE2]" />
                          <div className="absolute -top-1 -right-1 bg-[#8A2BE2] p-1 rounded-full border-2 border-[#121212]">
                            <Star size={10} fill="white" color="white" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="text-xs font-black text-white truncate w-[120px]">{name}</h4>
                          <p className="text-[9px] text-[#8A2BE2] font-bold uppercase mt-0.5">{f.funcoes?.[0] || 'Profissional'}</p>
                          {dist !== null && (
                            <p className={`text-[9px] font-black mt-1 px-2 py-0.5 rounded-full border ${distanceBadgeColor(dist)}`}>
                              {formatDistance(dist, sameCity)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
 
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  {userLocation ? 'Ordenado por Distância' : 'Todos os Profissionais'}
                </h2>
                <span className="text-xs font-medium text-[#8A2BE2]">{freelancersWithDistance.length} encontrados</span>
              </div>
              <div className="space-y-2">
                {freelancersWithDistance.map(f => (
                  <div key={f.id} className="relative">
                    {f.distance !== null && (
                      <span className={`absolute top-4 right-4 z-10 text-[10px] font-black px-2.5 py-1 rounded-full border ${distanceBadgeColor(f.distance)}`}>
                        📍 {formatDistance(f.distance, isFreelancerSameCity(currentUser?.city, currentUser?.state, f.profile?.city, f.profile?.state))}
                      </span>
                    )}
                    <FreelancerCard
                      freelancer={{
                        id: f.id,
                        username: f.profile?.username,
                        nomeCompleto: `${f.profile?.first_name} ${f.profile?.last_name}`,
                        funcoes: f.funcoes || [],
                        specialties: f.specialties || [],
                        regiao: `${f.profile?.city}, ${f.profile?.state}`,
                        bio: f.bio,
                        portfolioLinks: f.portfolio_links || {},
                        whatsapp: '🔒 Oculto até Match',
                        faixaValor: `R$ ${f.min_price} - R$ ${f.max_price}`,
                        currency: f.currency,
                        minPrice: f.min_price,
                        maxPrice: f.max_price,
                        services: [],
                        disponibilidade: f.disponibilidade,
                        rate: f.rate,
                        jobsCount: f.jobs_count,
                        avatarUrl: f.profile?.avatar_url,
                        reviews: []
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POSTADAS TAB */}
        {activeTab === 'minhas' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Suas Vagas Publicadas</h2>
              <span className="text-xs font-medium text-[#8A2BE2]">{myAllJobs.length} vagas</span>
            </div>
            {myAllJobsLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-t-2 border-[#8A2BE2] rounded-full animate-spin" />
              </div>
            ) : myAllJobs.length > 0 ? myAllJobs.map(job => {
              const today = new Date().toISOString().split('T')[0];
              const isArchived = !!job.deleted_at || (job.date && job.date < today);
              return (
                <div
                  key={job.id}
                  onClick={() => !isArchived && navigate(`/jobs/${job.id}`)}
                  className={`bg-white/5 border rounded-[32px] p-6 flex items-center justify-between group transition-all ${
                    isArchived
                      ? 'border-white/5 opacity-60 cursor-default'
                      : 'border-white/5 hover:bg-white/10 hover:border-[#8A2BE2]/20 cursor-pointer'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className={`text-lg font-black transition-colors truncate ${
                      isArchived ? 'text-gray-500' : 'text-white group-hover:text-[#8A2BE2]'
                    }`}>{job.title}</h3>
                    <div className="flex items-center gap-3 flex-wrap text-xs font-bold text-gray-500">
                      {isArchived ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                          {job.deleted_at ? '🗂 Encerrada' : '📅 Expirada'}
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1"><Users size={14} /><span>Ver Interessados</span></div>
                          <div className="flex items-center gap-1"><LayoutGrid size={14} /><span>{job.status}</span></div>
                          {job.date && (
                            <div className="flex items-center gap-1 text-[#8A2BE2]">
                              <Calendar size={12} />
                              <span>{new Date(job.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl ml-4 shrink-0 shadow-lg transition-all ${
                    isArchived
                      ? 'bg-white/5 text-gray-600'
                      : 'bg-white/5 text-gray-400 group-hover:bg-[#8A2BE2] group-hover:text-white'
                  }`}>
                    <Sparkles size={20} />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-20 bg-white/5 rounded-[40px] border border-white/5 border-dashed space-y-6">
                <Briefcase size={40} className="mx-auto text-gray-600" />
                <div>
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma vaga postada</p>
                  <p className="text-gray-600 text-[10px] mt-1">Publique um job e ache o freela perfeito.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>Criar minha primeira vaga</Button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;
