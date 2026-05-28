import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Globe, Briefcase, Eye, EyeOff } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { supabase } from '../lib/supabase';
import { MAIN_ROLES } from '../constants';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    state: '',
    country: 'Brasil',
    role: 'Produtor'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Validation
        if (formData.password !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        if (formData.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }

        // Register in Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
              city: formData.city,
              state: formData.state,
              country: formData.country,
              role: formData.role,
              username: `${formData.firstName.toLowerCase()}_${formData.lastName.toLowerCase()}`
            }
          }
        });

        if (signUpError) throw signUpError;
        
        alert('Cadastro realizado com sucesso! Faça login para entrar.');
        setIsSignUp(false);
      } else {
        // Log in to Supabase Auth
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (signInError) throw signInError;
        
        navigate('/explore');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#121212] overflow-y-auto">
      <div className="w-full max-w-md space-y-8 my-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Logo Section */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Free<span className="text-[#8A2BE2]">linha</span>
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Cadastre-se na maior plataforma audiovisual.' : 'Conecte-se com os melhores profissionais.'}
          </p>
        </div>

        {/* Form Box */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-[32px] p-8 shadow-2xl space-y-6">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-center animate-bounce">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            
            {isSignUp ? (
              // --- SIGN UP FIELDS ---
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    name="firstName"
                    placeholder="Nome" 
                    icon={<User size={18} />} 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input 
                    name="lastName"
                    placeholder="Sobrenome" 
                    icon={<User size={18} />} 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <Input 
                  name="email"
                  type="email"
                  placeholder="seu@email.com" 
                  icon={<Mail size={18} />} 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />

                <Input 
                  name="phone"
                  placeholder="Telefone com DDD" 
                  icon={<Phone size={18} />} 
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    name="city"
                    placeholder="Cidade" 
                    icon={<MapPin size={18} />} 
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                  <Input 
                    name="state"
                    placeholder="Estado (Ex: SP)" 
                    icon={<MapPin size={18} />} 
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <Input 
                  name="country"
                  placeholder="País" 
                  icon={<Globe size={18} />} 
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                />

                <Select 
                  name="role"
                  label="Minha Atividade Principal"
                  icon={<Briefcase size={18} />}
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  {MAIN_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </Select>

                <div className="relative">
                  <Input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Sua senha secreta" 
                    icon={<Lock size={18} />} 
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[14px] text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <Input 
                  name="confirmPassword"
                  type="password" 
                  placeholder="Confirme sua senha" 
                  icon={<Lock size={18} />} 
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            ) : (
              // --- LOGIN FIELDS ---
              <div className="space-y-4">
                <Input 
                  name="email"
                  type="email" 
                  placeholder="seu@email.com" 
                  icon={<Mail size={20} />} 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                
                <div className="relative">
                  <Input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Sua senha secreta" 
                    icon={<Lock size={20} />} 
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[14px] text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading} className="bg-[#8A2BE2] hover:bg-[#9D4EDD] py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_20px_rgba(138,43,226,0.3)]">
              {loading ? 'Processando...' : isSignUp ? 'Criar Minha Conta' : 'Acessar Plataforma'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <span 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[#8A2BE2] font-black cursor-pointer hover:underline"
            >
              {isSignUp ? 'Fazer Login' : 'Criar Conta'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;