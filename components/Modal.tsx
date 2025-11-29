import React from 'react';
import { X, Mail, Phone, CheckCircle } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  freelancerName: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, freelancerName }) => {
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) setSent(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-gray-800 w-full max-w-md rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {!sent ? (
          <>
            <h3 className="text-2xl font-bold text-white mb-2">Entrar em Contato</h3>
            <p className="text-gray-400 mb-6">
              Envie uma mensagem direta para <span className="text-[#8A2BE2] font-semibold">{freelancerName}</span>.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-[#121212] rounded-xl border border-gray-800">
                <Mail className="text-[#8A2BE2]" size={20} />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                  <p className="text-white">contato@{freelancerName.toLowerCase().replace(' ', '')}.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-[#121212] rounded-xl border border-gray-800">
                <Phone className="text-[#8A2BE2]" size={20} />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Telefone</p>
                  <p className="text-white">+55 (11) 99999-9999</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setSent(true)} fullWidth>
              Enviar Mensagem de Interesse
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Sucesso!</h3>
            <p className="text-gray-400">
              Sua mensagem foi enviada para {freelancerName}.
            </p>
            <Button onClick={onClose} variant="outline" className="mt-8" fullWidth>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;