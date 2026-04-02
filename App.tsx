
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import Navbar from './components/Navbar';
import AIConsultant from './components/AIConsultant';
import BookingProcess from './components/BookingProcess';
import ClientPortal from './components/ClientPortal';
import AdminPortal from './components/AdminPortal';
import ChatSupport from './components/ChatSupport';
import EnergyCalculator from './components/EnergyCalculator';
import RegistrationExtraInfo from './components/RegistrationExtraInfo';
import AnamnesisForm from './components/AnamnesisForm';
import { DEFAULT_SERVICES, DEFAULT_BUSINESS_INFO } from './constants';
import { ViewState, User, Service, BusinessInfo, Anamnesis, CarouselItem, WorkVideo } from './types';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  onSnapshot, 
  collection, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  googleProvider, 
  signOut,
  handleFirestoreError,
  OperationType,
  cleanObject
} from './firebase';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsedError = JSON.parse(this.state.error?.message || "{}");
        if (parsedError.error) {
          errorMessage = `Erro no Banco de Dados: ${parsedError.error} (Operação: ${parsedError.operationType})`;
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 text-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md">
            <h2 className="text-2xl font-bold text-stone-800 mb-4">Ops! Algo deu errado.</h2>
            <p className="text-stone-600 mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-8 py-3 bg-stone-800 text-white rounded-full font-bold uppercase tracking-widest"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const VIEW_HASHES: Record<ViewState, string> = {
  'home': '#/',
  'services': '#/tratamentos',
  'booking': '#/agenda',
  'energy-calculator': '#/gasto-diario',
  'ai-consultant': '#/consultoria-ia',
  'client-portal': '#/meu-perfil',
  'admin-portal': '#/admin',
  'profile-completion': '#/completar-perfil',
  'about': '#/sobre-nos',
  'legal': '#/legal'
};

const HASH_TO_VIEW: Record<string, ViewState> = Object.entries(VIEW_HASHES).reduce(
  (acc, [view, hash]) => ({ ...acc, [hash]: view as ViewState }), 
  {} as Record<string, ViewState>
);

const getYoutubeEmbedUrl = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

const getYoutubeThumbnail = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`
    : null;
};

const HomeView: React.FC<{ 
  businessInfo: BusinessInfo; 
  carouselItems: CarouselItem[];
  workVideos: WorkVideo[];
  onAction: (v: ViewState) => void 
}> = ({ businessInfo, carouselItems, workVideos, onAction }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const slides = carouselItems || [];

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="pt-24 animate-fade-in">
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Carousel Background */}
        <div className="absolute inset-0 z-0">
          {slides.length > 0 ? (
            slides.map((slide, idx) => (
              <a 
                key={slide.id} 
                href={slide.linkUrl}
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <img src={slide.imageUrl} className="w-full h-full object-cover brightness-50" alt={`Banner ${idx + 1}`} />
              </a>
            ))
          ) : (
            <img src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=2070" className="w-full h-full object-cover brightness-50" alt="Hero" />
          )}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl pointer-events-none">
          <span className="font-bold uppercase tracking-[0.5em] text-xs mb-6 block animate-fade-in" style={{ color: businessInfo.primaryColor }}>{businessInfo.ownerName}</span>
          <h1 
            className="hero-title text-5xl md:text-8xl font-bold mb-8 tracking-tighter animate-fade-in drop-shadow-2xl" 
            style={{ 
              fontFamily: businessInfo.heroTitleFont || 'inherit',
              color: businessInfo.heroTitleColor || '#ffffff'
            }}
          >
            {businessInfo.name}
          </h1>
          <p 
            className="text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in opacity-95 drop-shadow-lg"
            style={{ color: businessInfo.heroSubtitleColor || '#ffffff' }}
          >
            {businessInfo.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in pointer-events-auto">
            <button 
              onClick={() => onAction('booking')} 
              className="px-12 py-5 rounded-full font-bold uppercase tracking-widest transition-all shadow-2xl active:scale-95 bg-white hover:brightness-110"
              style={{ color: businessInfo.primaryColor }}
            >
              Agendar Avaliação
            </button>
            <button onClick={() => onAction('ai-consultant')} className="bg-stone-900/40 backdrop-blur-md text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-all">Consultoria IA</button>
          </div>
        </div>

        {/* Carousel Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {slides.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Seção Nosso Trabalho */}
      {workVideos && workVideos.length > 0 && (
        <section className="py-24 bg-stone-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="font-bold uppercase tracking-[0.3em] text-xs mb-4 block" style={{ color: businessInfo.primaryColor }}>Galeria de Vídeos</span>
              <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter" style={{ color: 'var(--heading-color)' }}>NOSSO TRABALHO</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {workVideos.map((video) => {
                const embedUrl = getYoutubeEmbedUrl(video.url);
                const thumbnailUrl = getYoutubeThumbnail(video.url);
                const isPlaying = playingVideoId === video.id;

                if (!embedUrl) return null;
                return (
                  <div key={video.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-xl border border-stone-100 transition-all hover:shadow-2xl hover:-translate-y-1">
                    <div className="aspect-video relative">
                      {isPlaying ? (
                        <iframe
                          src={`${embedUrl}?autoplay=1`}
                          className="absolute inset-0 w-full h-full"
                          title={video.title || "Vídeo de Trabalho"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="absolute inset-0 w-full h-full cursor-pointer group/play" onClick={() => setPlayingVideoId(video.id)}>
                          {thumbnailUrl ? (
                            <img src={thumbnailUrl} className="w-full h-full object-cover brightness-75 group-hover/play:brightness-90 transition-all" alt={video.title} />
                          ) : (
                            <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-stone-400 uppercase">Assistir Vídeo</span>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover/play:scale-110 transition-transform">
                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-stone-900 border-b-[10px] border-b-transparent ml-1"></div>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {video.title && (
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-stone-800 line-clamp-1">{video.title}</h3>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <div className="space-y-8">
            <div>
              <span className="font-bold uppercase tracking-widest text-xs mb-4 block" style={{ color: businessInfo.primaryColor }}>Sobre a Clínica</span>
              <h2 className="text-4xl md:text-6xl font-bold leading-tight" style={{ color: 'var(--heading-color)' }}>Ciência e Estética <br/><span className="serif italic font-normal" style={{ color: businessInfo.primaryColor }}>de Alto Padrão</span></h2>
            </div>
            <p className="text-lg leading-relaxed">{businessInfo.description}</p>
            <div className="p-10 bg-stone-50 rounded-[3rem] border border-stone-200 shadow-inner">
               <h4 className="font-bold mb-4 uppercase text-xs tracking-[0.2em] border-b border-stone-200 pb-2">Onde nos encontrar:</h4>
               <p className="text-sm leading-relaxed mb-6 italic">{businessInfo.address}</p>
               <div className="flex items-center gap-4" style={{ color: businessInfo.primaryColor }}>
                  <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">📞</div>
                  <span className="font-bold text-xl">{businessInfo.phone}</span>
               </div>
            </div>
          </div>
          <div className="h-[600px] rounded-[4rem] overflow-hidden shadow-2xl border-8 border-stone-50 transform hover:scale-[1.01] transition-transform">
             <iframe src={businessInfo.googleMapsUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

const AboutView: React.FC<{ businessInfo: BusinessInfo }> = ({ businessInfo }) => (
  <div className="pt-40 max-w-4xl mx-auto px-4 pb-24 animate-fade-in">
    <div className="text-center mb-16">
      <span className="text-amber-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2 block">Conheça nossa História</span>
      <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter" style={{ color: 'var(--heading-color)' }}>Sobre a Clínica</h2>
    </div>
    <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border border-stone-100">
       <div className="prose prose-stone prose-lg mx-auto whitespace-pre-wrap leading-relaxed text-stone-600 italic">
          {businessInfo.aboutContent || "Conteúdo em breve."}
       </div>
    </div>
  </div>
);

const LegalView: React.FC<{ businessInfo: BusinessInfo }> = ({ businessInfo }) => (
  <div className="pt-40 max-w-4xl mx-auto px-4 pb-24 animate-fade-in">
    <div className="text-center mb-16">
      <span className="text-amber-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2 block">Políticas e Termos</span>
      <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter" style={{ color: 'var(--heading-color)' }}>Garantia, Reembolso & Responsabilidade</h2>
    </div>
    <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border border-stone-100">
       <div className="prose prose-stone prose-lg mx-auto whitespace-pre-wrap leading-relaxed text-stone-600">
          {businessInfo.legalContent || "Conteúdo em breve."}
       </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  const [isAuthForm, setIsAuthForm] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(DEFAULT_BUSINESS_INFO);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [workVideos, setWorkVideos] = useState<WorkVideo[]>([]);
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      const targetView = HASH_TO_VIEW[hash] || 'home';
      setView(targetView);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newView: ViewState) => {
    window.location.hash = VIEW_HASHES[newView];
  };

  // Global File Validation Logic (Optimized)
  useEffect(() => {
    const MAX_FILE_SIZE = 1048576; // 1MB
    let timeoutId: NodeJS.Timeout;

    const validateFile = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'file' && target.files && target.files.length > 0) {
        const file = target.files[0];
        if (file.size > MAX_FILE_SIZE) {
          (window as any).showError('Esta imagem é muito grande para anexar (Máximo 1MB)');
          target.value = ''; // Clear the input
        }
      }
    };

    const injectLabels = () => {
      const inputs = document.querySelectorAll('input[type="file"]:not([data-file-validated])');
      if (inputs.length === 0) return;

      inputs.forEach((input) => {
        const htmlInput = input as HTMLInputElement;
        htmlInput.setAttribute('data-file-validated', 'true');
        
        const parent = htmlInput.parentElement;
        if (parent && !parent.querySelector('.file-limit-info')) {
          const info = document.createElement('div');
          info.className = 'file-limit-info text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 mt-1 block w-full';
          info.innerText = 'A imagem deve ter no máximo 1MB.';
          
          if (htmlInput.classList.contains('hidden') || htmlInput.style.display === 'none') {
            parent.parentNode?.insertBefore(info, parent);
          } else {
            htmlInput.parentNode?.insertBefore(info, htmlInput);
          }
        }
      });
    };

    const debouncedInject = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(injectLabels, 100);
    };

    document.addEventListener('change', validateFile, true);
    debouncedInject();

    const observer = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
      if (hasAddedNodes) debouncedInject();
    });

    // Global Notification System
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(toastContainer);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      const toast = document.createElement('div');
      toast.className = `
        min-w-[280px] p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in-right pointer-events-auto
        ${type === 'success' ? 'bg-white border-l-4 border-green-500 text-stone-800' : 'bg-white border-l-4 border-red-500 text-stone-800'}
      `;
      
      const icon = document.createElement('span');
      icon.className = 'text-xl';
      icon.innerText = type === 'success' ? '✅' : '❌';
      
      const text = document.createElement('span');
      text.className = 'text-[11px] font-black uppercase tracking-widest';
      text.innerText = message;
      
      toast.appendChild(icon);
      toast.appendChild(text);
      toastContainer.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 500);
      }, 4000);
    };

    (window as any).showNotification = showNotification;
    (window as any).showSuccess = (msg: string) => showNotification(msg, 'success');
    (window as any).showError = (msg: string) => showNotification(msg, 'error');

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button');
      if (btn) {
        const text = btn.innerText.toLowerCase();
        if (text.includes('salvar') || text.includes('adicionar') || text.includes('confirmar')) {
          // We wait a bit to see if there's an error thrown by the actual logic
          // This is a bit tricky since we don't know if the save succeeded or failed here
          // But the user asked for "Sempre que clicar em qualquer botão 'Salvar' ... Exibir uma notificação automática de sucesso"
          // However, point 2 says "Caso ocorra erro ao salvar ... Exibir mensagem: 'Erro ao salvar, tente novamente'"
          // So we should probably only trigger success if the button click doesn't result in an immediate error.
          // For now, I'll implement the functions and let the components call them explicitly for better control,
          // but I'll also add a small delay and check if an error was logged.
          // Actually, it's better to just provide the functions and update the components.
          // But the user said "Funcionar para todos os usuários ... Código em JavaScript puro ... reutilizável em todo o sistema"
          // Let's stick to providing the functions on window.
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('change', validateFile, true);
      document.removeEventListener('click', handleGlobalClick);
      observer.disconnect();
      clearTimeout(timeoutId);
      toastContainer.remove();
    };
  }, []);

  // Firebase Auth State Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setLoggedUser(userDoc.data() as User);
          } else {
            // New user
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: (firebaseUser.email === businessInfo.email || firebaseUser.email === 'lanjc0245@gmail.com' || firebaseUser.email === 'jclanhouse2012@hotmail.com.br') ? 'admin' : 'client',
              isProfileComplete: false,
              registrationSource: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'manual'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(newUser));
            setLoggedUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        // Only clear if not in a local master session
        setLoggedUser(prev => (prev?.id === 'admin-master' ? prev : null));
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [businessInfo.email]);

  // Real-time Business Info & Services
  useEffect(() => {
    const unsubInfo = onSnapshot(doc(db, 'settings', 'businessInfo'), (snapshot) => {
      if (snapshot.exists()) {
        setBusinessInfo(snapshot.data() as BusinessInfo);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/businessInfo'));

    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      if (!snapshot.empty) {
        const loadedServices = snapshot.docs.map(doc => doc.data() as Service);
        setServices(loadedServices);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'services'));

    const unsubCarousel = onSnapshot(collection(db, 'carouselItems'), (snapshot) => {
      setCarouselItems(snapshot.docs.map(doc => doc.data() as CarouselItem));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'carouselItems'));

    const unsubVideos = onSnapshot(collection(db, 'workVideos'), (snapshot) => {
      setWorkVideos(snapshot.docs.map(doc => doc.data() as WorkVideo));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'workVideos'));

    return () => {
      unsubInfo();
      unsubServices();
      unsubCarousel();
      unsubVideos();
    };
  }, []);

  // Database Initialization (Admin only)
  useEffect(() => {
    if (isAuthReady && loggedUser?.role === 'admin' && auth.currentUser) {
      const initDb = async () => {
        try {
          const infoDoc = await getDoc(doc(db, 'settings', 'businessInfo'));
          if (!infoDoc.exists()) {
            await setDoc(doc(db, 'settings', 'businessInfo'), DEFAULT_BUSINESS_INFO);
          }

          const servicesSnap = await getDocs(collection(db, 'services'));
          if (servicesSnap.empty) {
            for (const s of DEFAULT_SERVICES) {
              await setDoc(doc(db, 'services', s.id), s);
            }
          }

          const carouselSnap = await getDocs(collection(db, 'carouselItems'));
          if (carouselSnap.empty) {
            const defaultItem: CarouselItem = {
              id: 'def1',
              imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=2070',
              linkUrl: '#/tratamentos'
            };
            await setDoc(doc(db, 'carouselItems', defaultItem.id), defaultItem);
          }
        } catch (error) {
          console.error("Initialization Error:", error);
        }
      };
      initDb();
    }
  }, [isAuthReady, loggedUser]);

  const handleUpdateServices = async (newServices: Service[]) => {
    try {
      // For simplicity, we update the whole list in Firestore
      // In a real app, we'd update individual docs
      for (const s of newServices) {
        await setDoc(doc(db, 'services', s.id), s);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'services');
    }
  };

  const handleUpdateBusinessInfo = async (newInfo: BusinessInfo) => {
    try {
      // Strip old fields that might still be in the object to avoid size errors
      // We also strip any other potentially large fields if they are not needed in the main doc
      const { carouselItems, workVideos, ...cleanInfo } = newInfo as any;
      
      // Ensure we don't save massive base64 strings in the main doc if they leaked in
      // This is a safety measure
      Object.keys(cleanInfo).forEach(key => {
        if (typeof cleanInfo[key] === 'string' && cleanInfo[key].length > 100000) {
          console.warn(`Field ${key} is too large, stripping to avoid Firestore limit.`);
          delete cleanInfo[key];
        }
      });

      await setDoc(doc(db, 'settings', 'businessInfo'), cleanObject(cleanInfo));
      (window as any).showSuccess("Salvo com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/businessInfo');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await setDoc(doc(db, 'users', updatedUser.id), cleanObject(updatedUser));
      (window as any).showSuccess("Perfil atualizado com sucesso!");
      setLoggedUser(updatedUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${updatedUser.id}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigateTo('home');
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthForm(false);
    } catch (error) {
      console.error("Login Error:", error);
      (window as any).showError("Erro ao entrar com Google.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // 1. Basic Validation
    if (!authEmail || !authEmail.includes('@')) {
      setAuthError("Por favor, insira um e-mail válido.");
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    
    const isAdminEmail = authEmail.trim().toLowerCase() === businessInfo.email.trim().toLowerCase() || 
                         authEmail.trim().toLowerCase() === 'jclanhouse2012@hotmail.com.br' ||
                         authEmail.trim().toLowerCase() === 'lanjc0245@gmail.com';

    const isMasterPassword = authPassword === businessInfo.adminPassword;

    try {
      if (authMode === 'login') {
        // 2. Primary Login Method: Firebase Auth
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        // 3. Registration Method: Firebase Auth
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setIsAuthForm(false);
    } catch (error: any) {
      console.error("Auth Error:", error.code, error.message);
      
      // 4. Specific handling for Admin/Master credentials
      // If it's an admin email and the master password was used, but login failed
      if (isAdminEmail && isMasterPassword) {
        // If account doesn't exist, try to auto-register it to sync with Firebase
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            console.log("Admin email detected with master password. Attempting to initialize account in Firebase...");
            await createUserWithEmailAndPassword(auth, authEmail, authPassword);
            setIsAuthForm(false);
            setAuthError(null);
            return;
          } catch (createError: any) {
            if (createError.code === 'auth/email-already-in-use') {
              // This means the email exists but the password provided (master) is wrong for the Firebase account
              setAuthError("Este e-mail de administrador já está registrado no Firebase com uma senha diferente. Tente sua senha pessoal ou use 'Esqueci minha senha'.");
              return;
            }
          }
        }
      }

      // 5. Standard Error Handling
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        if (isAdminEmail && authMode === 'login') {
          setAuthError("E-mail ou senha incorretos. Administrador: se este é seu primeiro acesso, use a senha padrão ou clique em 'Cadastre-se'.");
        } else {
          setAuthError("E-mail ou senha incorretos. Por favor, verifique suas credenciais.");
        }
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError("Este e-mail já está em uso. Tente fazer login.");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("A senha deve ter pelo menos 6 caracteres.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError("O login por e-mail/senha não está ativado no Firebase Console.");
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError("Muitas tentativas de login. Tente novamente mais tarde.");
      } else if (error.code === 'auth/invalid-email') {
        setAuthError("E-mail inválido. Por favor, verifique o formato.");
      } else {
        setAuthError(`Erro de autenticação: ${error.message}`);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!authEmail) {
      setAuthError("Por favor, insira seu e-mail para recuperar a senha.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, authEmail);
      (window as any).showSuccess("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      setAuthError(`Erro ao enviar e-mail de recuperação: ${error.message}`);
    }
  };

  const handleCompleteAnamnesis = (data: Anamnesis) => {
    if (loggedUser) {
      handleUpdateUser({ ...loggedUser, anamnesis: data, isProfileComplete: true });
      (window as any).showSuccess("Ficha técnica salva com sucesso! Seu perfil está ativo.");
      navigateTo('client-portal');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400 font-bold uppercase tracking-widest">Carregando...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col font-inter relative" style={{ backgroundColor: 'var(--bg-stone-50)' }}>
        {showTopBanner && (
          <div className="bg-stone-900 text-white py-3 px-6 flex items-center justify-between relative z-[10000] animate-fade-in">
            <div className="flex-grow text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                <span className="text-amber-400">⚠️</span>
                Atenção: Atualizações recentes foram feitas no sistema
              </p>
            </div>
            <button 
              onClick={() => setShowTopBanner(false)}
              className="text-white/50 hover:text-white transition-colors text-xl font-light"
            >
              ×
            </button>
          </div>
        )}
        <Navbar 
          currentView={view} 
          onNavigate={navigateTo} 
          isLoggedIn={!!loggedUser} 
          isAdmin={loggedUser?.role === 'admin'} 
          onOpenLogin={() => setIsAuthForm(true)} 
          onLogout={handleLogout} 
          socialLinks={businessInfo.socialLinks}
          businessName={businessInfo.name} 
          headerWelcome={businessInfo.headerWelcome}
        />
      
      <main className="flex-grow">
        {view === 'home' && <HomeView businessInfo={businessInfo} carouselItems={carouselItems} workVideos={workVideos} onAction={navigateTo} />}
        {view === 'about' && <AboutView businessInfo={businessInfo} />}
        {view === 'legal' && <LegalView businessInfo={businessInfo} />}
        {view === 'services' && (
           <div className="pt-32 max-w-7xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-3 text-center mb-10">
                 <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-4" style={{ color: 'var(--heading-color)' }}>Tratamentos</h2>
              </div>
              {services.filter(s => s.status === 'active').map(s => (
                <div key={s.id} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500">
                  <div className="h-72 w-full overflow-hidden rounded-[2.5rem] mb-8 bg-stone-50 relative">
                    <img src={s.images[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={s.name} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 uppercase tracking-tight" style={{ color: 'var(--heading-color)' }}>{s.name}</h3>
                  <p className="text-sm italic flex-grow mb-10 leading-relaxed opacity-70">"{s.description}"</p>
                  <div className="flex justify-between items-center border-t border-stone-100 pt-6">
                    <span className="font-black text-xl" style={{ color: businessInfo.primaryColor }}>R$ {s.price}</span>
                    <button onClick={() => navigateTo('booking')} className="px-8 py-3 text-white rounded-full font-bold uppercase text-[10px] tracking-widest shadow-lg" style={{ backgroundColor: businessInfo.primaryColor }}>Agendar</button>
                  </div>
                </div>
              ))}
           </div>
        )}
        {view === 'booking' && <div className="pt-32"><BookingProcess loggedUser={loggedUser} services={services.filter(s => s.status === 'active')} businessInfo={businessInfo} onAuthRequired={() => setIsAuthForm(true)} onUpdateUser={handleUpdateUser} onNavigate={navigateTo} /></div>}
        {view === 'admin-portal' && (
          loggedUser?.role === 'admin' ? (
            <div className="pt-32">
              <AdminPortal 
                services={services} 
                businessInfo={businessInfo} 
                carouselItems={carouselItems}
                workVideos={workVideos}
                onUpdateServices={handleUpdateServices} 
                onUpdateBusinessInfo={handleUpdateBusinessInfo} 
              />
            </div>
          ) : (
            <div className="pt-40 text-center">
              <h2 className="text-2xl font-bold text-stone-800">Acesso Negado</h2>
              <p className="text-stone-500 mt-4">Você não tem permissão para acessar esta área.</p>
              <button onClick={() => navigateTo('home')} className="mt-8 px-8 py-3 bg-stone-900 text-white rounded-full font-bold uppercase tracking-widest">Voltar para Home</button>
            </div>
          )
        )}
        
        {view === 'client-portal' && loggedUser && (
          <div className="pt-32">
            {!loggedUser.isProfileComplete ? (
              <RegistrationExtraInfo user={loggedUser} onComplete={handleUpdateUser} />
            ) : !loggedUser.anamnesis ? (
              <div className="animate-fade-in py-10">
                <div className="max-w-4xl mx-auto px-4 mb-10 text-center">
                  <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Ação Obrigatória</span>
                  <h2 className="text-4xl font-bold uppercase tracking-tighter" style={{ color: 'var(--heading-color)' }}>Ficha de Anamnese</h2>
                  <p className="opacity-70 italic mt-4">Preencha seu prontuário clínico para liberar o acesso ao painel.</p>
                </div>
                <AnamnesisForm user={loggedUser} onComplete={handleCompleteAnamnesis} />
              </div>
            ) : (
              <ClientPortal user={loggedUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser} onNavigate={navigateTo} />
            )}
          </div>
        )}

        {view === 'ai-consultant' && <div className="pt-32"><AIConsultant loggedUser={loggedUser} onUpdateUser={handleUpdateUser} /></div>}
        {view === 'energy-calculator' && <div className="pt-32"><EnergyCalculator onNavigate={navigateTo} /></div>}
      </main>

      <footer className="footer-area py-24" style={{ backgroundColor: '#1c1917' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
             <h3 className="text-4xl font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--footer-text-color)' }}>{businessInfo.name}</h3>
             <p className="text-[10px] font-bold uppercase tracking-widest mt-10 opacity-60" style={{ color: 'var(--footer-text-color)' }}>{businessInfo.footerNote}</p>
        </div>
      </footer>

      {view !== 'admin-portal' && <ChatSupport user={loggedUser} />}

      {isAuthForm && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
           <div className="bg-white p-12 rounded-[4rem] w-full max-w-md shadow-2xl relative border border-stone-100">
              <button onClick={() => setIsAuthForm(false)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-800 text-2xl z-10">×</button>
              <h2 className="text-3xl font-bold mb-8 text-center uppercase tracking-tighter" style={{ color: 'var(--heading-color)' }}>
                {authMode === 'login' ? 'Acesso' : 'Criar Conta'}
              </h2>
              
              {authError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold uppercase tracking-widest text-center animate-shake">
                  {authError}
                </div>
              )}

              <div className="space-y-6">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full py-5 bg-white border border-stone-200 text-stone-800 rounded-2xl font-bold uppercase tracking-widest shadow-sm hover:bg-stone-50 transition-all flex items-center justify-center gap-3"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                  {authMode === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}
                </button>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-stone-100"></div>
                  <span className="flex-shrink mx-4 text-stone-300 text-[10px] font-bold uppercase tracking-widest">ou</span>
                  <div className="flex-grow border-t border-stone-100"></div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <input 
                    required 
                    type="email"
                    className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:ring-2 focus:ring-amber-200 transition-all cursor-text relative z-10" 
                    placeholder="E-mail" 
                    value={authEmail || ''} 
                    onChange={(e) => setAuthEmail(e.target.value)} 
                  />
                  <input 
                    required 
                    className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:ring-2 focus:ring-amber-200 transition-all cursor-text relative z-10" 
                    type="password" 
                    placeholder="Senha" 
                    value={authPassword || ''} 
                    onChange={(e) => setAuthPassword(e.target.value)} 
                  />
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={handleResetPassword}
                      className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-amber-700 transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <button type="submit" className="w-full py-5 text-white rounded-2xl font-bold uppercase tracking-widest shadow-2xl active:scale-95 transition-all relative z-10" style={{ backgroundColor: businessInfo.primaryColor }}>
                    {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
                  </button>
                </form>

                <div className="text-center">
                  <button 
                    onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(null); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:text-amber-700 transition-colors"
                  >
                    {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => setIsAuthForm(false)} 
                  className="w-full py-4 text-stone-400 hover:text-stone-800 font-bold uppercase tracking-widest text-[10px] transition-all"
                >
                  Voltar para o Início
                </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        :root { 
          --primary-color: ${businessInfo.primaryColor || '#b45309'};
          --heading-color: ${businessInfo.headingColor || '#1c1917'};
          --body-text-color: ${businessInfo.bodyTextColor || '#44403c'};
          --nav-text-color: ${businessInfo.navTextColor || '#1c1917'};
          --footer-text-color: ${businessInfo.footerTextColor || '#ffffff'};
          --btn-admin: ${businessInfo.btnAdminColor || '#b45309'};
          --btn-sair: ${businessInfo.btnLogoutColor || '#ef4444'};
          --btn-salvar: ${businessInfo.btnSaveColor || '#1c1917'};
          --btn-cancelar: ${businessInfo.btnCancelColor || '#78716c'};
          --hero-title-color: ${businessInfo.heroTitleColor || 'var(--heading-color)'};
          --bg-stone-50: #fafaf9;
        }
        body { 
          color: var(--body-text-color); 
        }
        h1, h2, h3, h4, h5, h6, .serif { 
          color: var(--heading-color); 
        }
        .hero-title {
          color: var(--hero-title-color) !important;
        }
        nav button, nav a, .nav-item {
          color: var(--nav-text-color) !important;
        }
        .footer-area h3, .footer-area p {
          color: var(--footer-text-color) !important;
        }
        @media print { .no-print { display: none !important; } }
        
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-out { animation: fade-out 0.5s forwards; }
      `}</style>
    </div>
    </ErrorBoundary>
  );
};

export default App;
