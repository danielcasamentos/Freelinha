import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/feed');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#121212]">
      <div className="w-full max-w-sm space-y-8">
        
        {/* Logo Section */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Free<span className="text-[#8A2BE2]">linha</span>
          </h1>
          <p className="text-gray-400">Conecte-se com os melhores profissionais.</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <Input 
              type="email" 
              placeholder="seu@email.com" 
              icon={<Mail size={20} />} 
              label="Email"
              required
            />
            <Input 
              type="password" 
              placeholder="Sua senha secreta" 
              icon={<Lock size={20} />} 
              label="Senha"
              required
            />
          </div>

          <Button type="submit" fullWidth>
            Login
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#121212] text-gray-500">Ou continue com</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center p-3 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <span className="text-white font-medium">Google</span>
            </button>
             <button type="button" className="flex items-center justify-center p-3 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <span className="text-white font-medium">Facebook</span>
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500">
          Não tem uma conta? <span className="text-[#8A2BE2] font-semibold cursor-pointer hover:underline">Criar Conta</span>
        </p>
      </div>
    </div>
  );
};

export default Login;