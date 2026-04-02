
import React, { useState, useEffect } from 'react';
import { User, BusinessInfo } from '../types';
import { DEFAULT_BUSINESS_INFO } from '../constants';

interface ChatSupportProps {
  user: User | null;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState(user?.name || '');
  const [userPhone, setUserPhone] = useState(user?.phone || '');

  const businessInfo: BusinessInfo = JSON.parse(localStorage.getItem('topissima_info') || JSON.stringify(DEFAULT_BUSINESS_INFO));

  useEffect(() => {
    if (user) {
      setUserName(user.name);
      setUserPhone(user.phone || '');
    }
  }, [user]);

  const handleOpenWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone) return;

    const clinicPhone = businessInfo.phone.replace(/\D/g, '');
    const message = `Olá! Meu nome é *${userName}* e gostaria de informações sobre os procedimentos da Topíssima Estética.
    
*Telefone de Contato:* ${userPhone}`;
    
    const waUrl = `https://wa.me/55${clinicPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-80 md:w-96 bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 flex flex-col mb-4 animate-fade-in overflow-hidden">
          <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
             <div>
                <h4 className="font-bold text-sm uppercase tracking-widest">WhatsApp Direto</h4>
                <p className="text-[8px] text-amber-500 uppercase font-bold tracking-[0.2em]">Topíssima Estética</p>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-xl opacity-50 hover:opacity-100">×</button>
          </div>
          
          <div className="p-8 flex flex-col justify-center bg-stone-50">
             <div className="text-center mb-6">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💬</div>
               <h5 className="font-bold text-stone-800 uppercase text-xs">Fale Conosco agora</h5>
               <p className="text-[9px] text-stone-400 mt-1 uppercase tracking-widest leading-relaxed">Preencha seus dados para ser redirecionado ao nosso atendimento oficial.</p>
             </div>
             <form onSubmit={handleOpenWhatsApp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-2">Seu Nome</label>
                  <input required placeholder="Nome Completo" className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-2 focus:ring-green-200 bg-white text-xs font-semibold" value={userName} onChange={e => setUserName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-2">Seu Telefone</label>
                  <input required placeholder="Telefone com DDD" className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-2 focus:ring-green-200 bg-white text-xs font-semibold" value={userPhone} onChange={e => setUserPhone(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-green-500 transition-all flex items-center justify-center gap-2">
                   Abrir WhatsApp
                </button>
             </form>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-green-500 transition-all transform active:scale-95 relative"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.474.873 3.103 1.332 4.775 1.333 5.394 0 9.786-4.391 9.788-9.784.002-5.392-4.39-9.783-9.784-9.783-2.612 0-5.067 1.017-6.913 2.863-1.845 1.846-2.861 4.302-2.862 6.915 0 1.725.451 3.411 1.306 4.887l-1.103 4.027 4.128-1.083zm12.336-11.232c-.06-.101-.219-.161-.459-.281s-1.421-.701-1.641-.781c-.22-.08-.38-.121-.54.121s-.621.781-.76.941c-.141.16-.281.181-.52.061s-1.011-.372-1.926-1.189c-.711-.635-1.192-1.42-1.331-1.661s-.015-.372.105-.491c.108-.107.24-.281.36-.421s.16-.239.24-.4c.08-.161.04-.301-.02-.421s-.54-1.301-.741-1.781c-.195-.47-.393-.406-.54-.414l-.46-.008c-.161 0-.421.061-.641.301s-.841.821-.841 2.002 1.141 2.323 1.301 2.543c.161.22 2.241 3.424 5.431 4.799.758.327 1.35.522 1.812.668.761.241 1.453.207 2.002.125.611-.091 1.641-.671 1.871-1.322.23-.651.23-1.211.161-1.321z" />
        </svg>
      </button>
    </div>
  );
};

export default ChatSupport;
