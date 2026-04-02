
import React, { useState, useEffect } from 'react';
import { Service, User, Appointment, BusinessInfo, Coupon, CashierSession, ViewState } from '../types';
import AnamnesisForm from './AnamnesisForm';
import { formatPhone, formatCPF } from '../utils';
import { db, collection, getDocs, setDoc, doc, onSnapshot, handleFirestoreError, OperationType, cleanObject } from '../firebase';

interface BookingProps {
  loggedUser: User | null;
  services: Service[];
  businessInfo: BusinessInfo;
  onAuthRequired: () => void;
  onUpdateUser: (u: User) => void;
  onNavigate: (view: ViewState) => void;
}

const BookingProcess: React.FC<BookingProps> = ({ loggedUser, services, businessInfo, onAuthRequired, onUpdateUser, onNavigate }) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [booked, setBooked] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [existingAppointmentsCount, setExistingAppointmentsCount] = useState(0);
  const [isCashierOpen, setIsCashierOpen] = useState(false);

  const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cashier_sessions'), (snapshot) => {
      const sessions = snapshot.docs.map(doc => doc.data() as CashierSession);
      setIsCashierOpen(sessions.some(s => s.status === 'open'));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      checkAvailability(selectedDate, selectedTime);
    }
  }, [selectedDate, selectedTime]);

  const checkAvailability = async (date: string, time: string) => {
    setIsCheckingAvailability(true);
    try {
      const snapshot = await getDocs(collection(db, 'appointments'));
      const dayAppts = snapshot.docs
        .map(doc => doc.data() as Appointment)
        .filter(a => a.date === date && a.time === time && a.status !== 'cancelled');
      
      setExistingAppointmentsCount(dayAppts.length);
      
      // Limit of 3 people per slot (example)
      if (dayAppts.length >= 3) {
        (window as any).showError("Este horário já atingiu o limite máximo de clientes.");
        setSelectedTime('');
      }
    } catch (error) {
      console.error("Error checking availability:", error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (selectedService) {
      let price = selectedService.price;
      if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') {
          price = price * (1 - appliedCoupon.discount / 100);
        } else {
          price = Math.max(0, price - appliedCoupon.discount);
        }
      }
      setFinalPrice(price);
    }
  }, [selectedService, appliedCoupon]);

  const handleApplyCoupon = async () => {
    try {
      const couponsSnap = await getDocs(collection(db, 'coupons'));
      const savedCoupons = couponsSnap.docs.map(doc => doc.data() as Coupon);
      const coupon = savedCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      if (coupon) {
        setAppliedCoupon(coupon);
        (window as any).showSuccess(`Cupom ${coupon.code} aplicado com sucesso!`);
      } else {
        (window as any).showError("Cupom inválido ou expirado.");
        setAppliedCoupon(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'coupons');
    }
  };

  const handleBookingFinal = async () => {
    if (!loggedUser || !selectedService) return;
    
    const bookingId = Math.random().toString(36).substr(2, 9);
    const newBooking: Appointment = {
      id: bookingId,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      userId: loggedUser.id,
      userName: loggedUser.name,
      date: selectedDate,
      time: selectedTime,
      status: isCashierOpen ? 'confirmed' : 'pending',
      price: finalPrice,
      couponUsed: appliedCoupon?.code
    };
    
    try {
      await setDoc(doc(db, 'appointments', bookingId), cleanObject(newBooking));
      
      const clinicPhone = businessInfo.phone.replace(/\D/g, '');
      const dateFormatted = selectedDate.split('-').reverse().join('/');
      
      const message = `DETALHES DO AGENDAMENTO:
Nome do Procedimento: ${selectedService.name}
Data: ${dateFormatted}
Hora: ${selectedTime}

DADOS DO CLIENTE:
Nome: ${loggedUser.name}
CPF: ${formatCPF(loggedUser.cpf || '')}
Telefone: ${formatPhone(loggedUser.phone || '')}`;

      const waUrl = `https://wa.me/55${clinicPhone}?text=${encodeURIComponent(message)}`;
      setBooked(true);
      setTimeout(() => { window.open(waUrl, '_blank'); }, 1500);
      (window as any).showSuccess?.("Agendamento realizado com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${bookingId}`);
    }
  };

  if (booked) {
    return (
      <div className="max-w-xl mx-auto py-32 px-4 text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">✓</div>
        <h2 className="text-4xl font-bold mb-4 text-stone-800 uppercase tracking-tighter">Agendado!</h2>
        <p className="text-stone-600 mb-8 italic">Confirme os detalhes no seu WhatsApp.</p>
        <button onClick={() => onNavigate('client-portal')} className="bg-stone-800 text-white px-12 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl">Concluir</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-20">
      <div className="flex justify-between mb-16 relative overflow-x-auto pb-4 scrollbar-hide">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-100 -translate-y-1/2 -z-10 min-w-[500px]"></div>
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex flex-col items-center flex-1 min-w-[80px]">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 font-bold transition-all shadow-md ${step >= s ? 'bg-stone-800 text-white scale-110' : 'bg-white text-stone-300 border border-stone-100'}`}>
              {s}
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="animate-fade-in">
          <h3 className="text-3xl font-bold mb-10 text-center text-stone-800 uppercase tracking-tighter">Escolha seu Tratamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div 
                key={service.id}
                onClick={() => { setSelectedService(service); setStep(2); window.scrollTo(0, 0); }}
                className={`cursor-pointer rounded-[2.5rem] overflow-hidden border-2 transition-all group relative bg-white shadow-sm hover:shadow-2xl ${selectedService?.id === service.id ? 'border-amber-500' : 'border-stone-50 hover:border-amber-200'}`}
              >
                <div className="h-56 overflow-hidden relative">
                   {service.originalPrice! > service.price && (
                     <div className="absolute top-4 left-4 z-10 bg-red-600 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest animate-bounce">Promoção</div>
                   )}
                   <img src={service.images && service.images[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-bold text-stone-800 mb-2">{service.name}</h4>
                  <div className="flex justify-between items-center border-t border-stone-50 pt-4">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">{service.duration} min</span>
                    <div className="flex flex-col items-end">
                       {service.originalPrice! > service.price && (
                         <span className="text-stone-300 line-through text-[10px] font-bold">R$ {service.originalPrice}</span>
                       )}
                       <span className="text-lg font-bold text-stone-800">R$ {service.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-stone-100">
          <h3 className="text-2xl font-bold mb-8 text-stone-800">Selecione seu momento</h3>
          <div className="space-y-8">
            <input 
              type="date" 
              className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50 outline-none" 
              value={selectedDate} 
              min={new Date().toLocaleDateString('en-CA')}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime(''); // Reset time when date changes
              }} 
            />
            <div className="grid grid-cols-3 gap-3">
                {times.map((t) => {
                  const isPastTime = () => {
                    if (!selectedDate) return false;
                    const todayStr = new Date().toLocaleDateString('en-CA');
                    if (selectedDate < todayStr) return true;
                    if (selectedDate > todayStr) return false;
                    
                    const now = new Date();
                    const [h, m] = t.split(':').map(Number);
                    const selectedDateTime = new Date();
                    selectedDateTime.setHours(h, m, 0, 0);
                    return selectedDateTime < now;
                  };

                  const past = isPastTime();

                  return (
                    <button 
                      key={t} 
                      onClick={() => {
                        if (past) {
                          (window as any).showError("Este horário já passou no dia de hoje. Por favor, escolha outro horário.");
                          return;
                        }
                        setSelectedTime(t);
                      }} 
                      disabled={past}
                      className={`p-4 rounded-xl border text-sm font-bold transition-all relative ${past ? 'opacity-20 cursor-not-allowed bg-stone-50 text-stone-300' : selectedTime === t ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border-stone-100'}`}
                    >
                      {t}
                      {selectedDate && selectedTime === t && existingAppointmentsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded-full shadow-sm">
                          {existingAppointmentsCount} agendados
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
            <button 
              onClick={() => {
                const todayStr = new Date().toLocaleDateString('en-CA');
                if (selectedDate < todayStr) {
                  (window as any).showError("Não é possível selecionar uma data passada.");
                  return;
                }
                
                // Final check for time if it's today
                if (selectedDate === todayStr) {
                  const now = new Date();
                  const [h, m] = selectedTime.split(':').map(Number);
                  const selectedDateTime = new Date();
                  selectedDateTime.setHours(h, m, 0, 0);
                  if (selectedDateTime < now) {
                    (window as any).showError("O horário selecionado acabou de passar. Por favor, escolha outro horário.");
                    setSelectedTime('');
                    return;
                  }
                }

                setStep(3);
              }} 
              disabled={!selectedDate || !selectedTime} 
              className="w-full py-5 bg-stone-800 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
         <div className="animate-fade-in max-w-xl mx-auto text-center p-12 bg-white rounded-[3rem] shadow-xl">
            <h3 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Identificação</h3>
            <p className="mb-8 text-stone-500">Faça login para salvar seus dados e agendamentos.</p>
            {loggedUser ? (
               <button onClick={() => setStep(4)} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg">Continuar</button>
            ) : (
               <button onClick={onAuthRequired} className="w-full bg-amber-600 text-white py-5 rounded-2xl font-bold uppercase tracking-widest shadow-xl">Entrar ou Cadastrar</button>
            )}
         </div>
      )}

      {step === 4 && loggedUser && (
        <AnamnesisForm user={loggedUser} onComplete={(data) => { onUpdateUser({...loggedUser, anamnesis: data}); setStep(5); }} />
      )}

      {step === 5 && selectedService && loggedUser && (
        <div className="animate-fade-in max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-stone-100">
          <h3 className="text-2xl font-bold mb-8 text-stone-800 uppercase tracking-tighter text-center">Resumo Final</h3>
          <div className="bg-stone-50 p-8 rounded-[2rem] space-y-4 mb-8">
            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-stone-400 uppercase">Tratamento</span><span className="font-bold text-stone-800">{selectedService.name}</span></div>
            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-stone-400 uppercase">Preço Base</span><span className="font-bold text-stone-800">R$ {selectedService.price.toFixed(2)}</span></div>
            
            {/* INPUT DE CUPOM CONDICIONAL */}
            {businessInfo.isCouponsEnabled && (
              <div className="pt-4 border-t border-stone-200">
                 <div className="flex gap-2">
                    <input placeholder="Cupom de Desconto" className="flex-1 p-3 bg-white rounded-xl border outline-none text-xs font-bold uppercase" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                    <button onClick={handleApplyCoupon} className="bg-stone-800 text-white px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest">Aplicar</button>
                 </div>
                 {appliedCoupon && (
                   <p className="mt-2 text-[9px] font-bold text-green-600 uppercase tracking-widest">Cupom {appliedCoupon.code} aplicado!</p>
                 )}
              </div>
            )}

            <div className="flex justify-between items-center text-amber-700 font-bold text-2xl border-t border-stone-200 pt-6 mt-4">
              <span className="text-[12px] uppercase tracking-widest">Total a Pagar</span>
              <span>R$ {finalPrice.toFixed(2)}</span>
            </div>
          </div>

          {!isCashierOpen && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 animate-pulse">
              <span className="text-xl">⚠️</span>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest mb-1">Aviso: Caixa Fechado</p>
                <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                  Nosso caixa está fechado no momento. Você pode finalizar seu agendamento normalmente, mas ele ficará com status <strong>"Pendente de Confirmação"</strong> até que nossa equipe valide o recebimento.
                </p>
              </div>
            </div>
          )}

          <button onClick={handleBookingFinal} className="w-full py-6 bg-stone-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-2xl transform hover:scale-[1.02] transition-all">Confirmar e Finalizar</button>
        </div>
      )}
    </div>
  );
};

export default BookingProcess;
