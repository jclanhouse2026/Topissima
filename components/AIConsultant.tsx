
import React, { useState, useEffect } from 'react';
import { getSkinConsultation } from '../services/geminiService';
// Fix: Use DEFAULT_BUSINESS_INFO from constants and alias it to BUSINESS_INFO
import { DEFAULT_BUSINESS_INFO as BUSINESS_INFO } from '../constants';
import { User, FavoriteRecommendation } from '../types';

interface AIConsultantProps {
  loggedUser: User | null;
  onUpdateUser: (u: User) => void;
}

const AIConsultant: React.FC<AIConsultantProps> = ({ loggedUser, onUpdateUser }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setResponse('');
    setIsFavorited(false);
    setLoading(true);
    const result = await getSkinConsultation(query);
    setResponse(result || '');
    setLoading(false);
  };

  const handleFavorite = () => {
    if (!loggedUser) {
      alert("Por favor, faça login para favoritar recomendações.");
      return;
    }

    if (isFavorited) return;

    const newFav: FavoriteRecommendation = {
      id: Math.random().toString(36).substr(2, 9),
      query: query,
      response: response,
      date: new Date().toLocaleString('pt-BR')
    };

    const updatedUser: User = {
      ...loggedUser,
      favoriteRecommendations: [...(loggedUser.favoriteRecommendations || []), newFav]
    };

    onUpdateUser(updatedUser);
    setIsFavorited(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-stone-800">Sua Jornada de Beleza Começa Aqui</h2>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto">
          Nossa inteligência artificial avançada analisa suas necessidades para recomendar o tratamento ideal na Lumina.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-stone-100">
        <form onSubmit={handleSubmit} className="mb-8">
          <label className="block text-sm font-semibold text-stone-700 mb-2 uppercase tracking-wider">
            Descreva suas preocupações ou o que deseja melhorar:
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            placeholder="Ex: Gostaria de melhorar a textura da pele e reduzir olheiras..."
            className="w-full h-32 p-4 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all resize-none text-stone-700 bg-stone-50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-stone-800 text-white py-4 rounded-xl font-bold tracking-widest uppercase hover:bg-stone-700 transition-all disabled:opacity-50 shadow-md relative overflow-hidden group"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando análise...
              </span>
            ) : 'Obter Recomendação Inteligente'}
          </button>
        </form>

        {loading && (
          <div className="relative overflow-hidden bg-stone-50 p-8 rounded-2xl border border-stone-200">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-amber-200/50 rounded-full flex items-center justify-center animate-pulse mr-4">
                <svg className="w-6 h-6 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-4 bg-stone-300 rounded w-48 animate-pulse"></div>
                <div className="h-3 bg-stone-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-3 bg-stone-200 rounded col-span-2 animate-pulse"></div>
                <div className="h-3 bg-stone-200 rounded col-span-1 animate-pulse"></div>
              </div>
              <div className="h-3 bg-stone-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-3 bg-stone-200 rounded col-span-1 animate-pulse"></div>
                <div className="h-3 bg-stone-200 rounded col-span-3 animate-pulse"></div>
              </div>
              <div className="h-3 bg-stone-200 rounded w-5/6 animate-pulse"></div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em] animate-pulse">Lumina AI está gerando sua recomendação...</span>
              <div className="h-4 bg-stone-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        )}

        {!loading && response && (
          <div className="bg-amber-50 p-8 rounded-2xl border border-amber-100 transition-all duration-500 ease-out transform translate-y-0 opacity-100 shadow-inner">
            <h3 className="text-xl font-bold mb-4 text-amber-900 flex items-center">
              <span className="mr-2">✨</span> Recomendação Lumina:
            </h3>
            <div className="text-stone-800 whitespace-pre-wrap leading-relaxed italic mb-8 border-l-4 border-amber-200 pl-4">
              {response}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4 border-t border-amber-100 pt-6">
              <button 
                onClick={handleFavorite}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all shadow-sm ${isFavorited ? 'bg-amber-600 text-white cursor-default' : 'bg-white text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200'}`}
              >
                <svg className={`w-4 h-4 ${isFavorited ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isFavorited ? 'Salvo nos Favoritos' : 'Favoritar Recomendação'}
              </button>
              <button 
                onClick={() => document.getElementById('root')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-amber-800 font-semibold underline hover:text-amber-600 transition-colors text-sm"
              >
                Ver horários para estes tratamentos
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
         <div className="p-6 bg-stone-100 rounded-2xl border border-stone-200/50">
            <h4 className="font-bold mb-2 text-stone-800">Privacidade Total</h4>
            <p className="text-sm text-stone-600">Seus dados de consulta são usados apenas para a recomendação instantânea e não são armazenados sem seu consentimento.</p>
         </div>
         <div className="p-6 bg-stone-100 rounded-2xl border border-stone-200/50">
            <h4 className="font-bold mb-2 text-stone-800">Base Especializada</h4>
            <p className="text-sm text-stone-600">Nossa IA foi configurada com protocolos estéticos modernos de alto padrão.</p>
         </div>
         <div className="p-6 bg-stone-100 rounded-2xl border border-stone-200/50 flex flex-col justify-between">
            <div>
              <h4 className="font-bold mb-2 text-stone-800">Avaliação Presencial</h4>
              <p className="text-sm text-stone-600 mb-4">A recomendação da IA serve como orientação. Agende uma avaliação física para diagnóstico clínico.</p>
            </div>
            <div className="text-[10px] uppercase font-bold text-stone-400 tracking-widest border-t border-stone-200 pt-4 mt-2">
              <p className="flex items-start gap-2 mb-2">
                <svg className="w-3 h-3 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                {BUSINESS_INFO.address}
              </p>
              <p className="flex items-center gap-2 text-amber-700">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                {BUSINESS_INFO.phone}
              </p>
            </div>
         </div>
      </div>

      {/* Botão Voltar ao Topo */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-[60] bg-stone-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:bg-stone-700 active:scale-95 ${
          showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-50'
        }`}
        aria-label="Voltar ao topo"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AIConsultant;
