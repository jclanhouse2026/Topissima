
import React, { useState } from 'react';
import { ViewState, SocialLinks } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  socialLinks: SocialLinks;
  businessName: string;
  headerWelcome: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  onNavigate, 
  isLoggedIn, 
  isAdmin, 
  onOpenLogin, 
  onLogout,
  socialLinks, 
  businessName, 
  headerWelcome 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Início' },
    { id: 'services', label: 'Tratamentos' },
    { id: 'booking', label: 'Agenda' },
    { id: 'about', label: 'Sobre a Clínica' },
    { id: 'legal', label: 'Garantias & Responsabilidade' },
    { id: 'energy-calculator', label: 'Gasto Diário' }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-stone-900 text-white py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center gap-4">
          <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em]">{headerWelcome}</span>
          <div className="flex gap-4">
            {Object.entries(socialLinks).map(([key, url]) => url && (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors text-[9px] font-bold uppercase tracking-widest">{key}</a>
            ))}
          </div>
        </div>
      </div>

      <nav className="bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex justify-between items-center">
          <div className="cursor-pointer flex items-center gap-2" onClick={() => onNavigate('home')}>
            <span className="text-lg md:text-2xl font-bold tracking-widest text-stone-800 uppercase">{businessName}</span>
          </div>
          
          <div className="hidden xl:flex space-x-6">
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => onNavigate(item.id as ViewState)}
                className={`${currentView === item.id ? 'text-amber-700 border-b-2 border-amber-700' : 'text-stone-600'} uppercase text-[10px] tracking-widest font-bold py-1 transition-all hover:text-amber-700 whitespace-nowrap`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-full border border-stone-100">
                <button 
                  onClick={() => onNavigate(isAdmin ? 'admin-portal' : 'client-portal')} 
                  className="px-4 py-2 text-white rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm hover:brightness-110 transition-all"
                  style={{ backgroundColor: isAdmin ? 'var(--btn-admin)' : 'var(--primary-color)' }}
                >
                  {isAdmin ? 'Painel ADM' : 'Meu Perfil'}
                </button>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 bg-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors border"
                  style={{ color: 'var(--btn-sair)', borderColor: 'var(--btn-sair)' }}
                >
                  Sair
                </button>
              </div>
            ) : (
              <button onClick={onOpenLogin} className="text-[10px] font-bold uppercase tracking-widest border border-stone-200 px-6 py-2 rounded-full hover:bg-stone-50 transition-all">Login</button>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="xl:hidden text-stone-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M12 12h8m-8 6h8"></path></svg>
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="xl:hidden bg-white border-b border-stone-100 animate-fade-in shadow-xl max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-6 space-y-4">
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => { onNavigate(item.id as ViewState); setIsMenuOpen(false); }}
                className="block w-full text-left uppercase text-[10px] tracking-widest font-bold text-stone-600 hover:text-amber-700"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
