
import React, { useState, useEffect } from 'react';
import { User, Appointment, ViewState } from '../types';
import { db, collection, onSnapshot, query, where, handleFirestoreError, doc, setDoc, cleanObject, OperationType } from '../firebase';

interface ClientPortalProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (u: User) => void;
  onNavigate: (view: ViewState) => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ user, onLogout, onUpdateUser, onNavigate }) => {
  const [myBookings, setMyBookings] = useState<Appointment[]>([]);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [requestingChangeId, setRequestingChangeId] = useState<string | null>(null);
  const [changeDate, setChangeDate] = useState('');
  const [changeTime, setChangeTime] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'appointments'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyBookings(snapshot.docs.map(doc => doc.data() as Appointment));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments'));

    return () => unsubscribe();
  }, [user.id]);

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      alert("Por favor, digite uma nova senha.");
      return;
    }
    try {
      await onUpdateUser({ ...user, password: newPassword });
      setIsEditingPassword(false);
      setNewPassword('');
      alert("Senha atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
    }
  };

  const handleRequestDeletion = async (appt: Appointment) => {
    // Check if signed (anamnesis exists)
    if (user.anamnesis && !appt.deletionRequested) {
      const confirmReq = confirm("Você já assinou o termo de responsabilidade. A exclusão precisa ser aprovada pela administração. Deseja solicitar a exclusão?");
      if (!confirmReq) return;
    } else if (!appt.deletionRequested) {
      const confirmReq = confirm("Deseja solicitar a exclusão deste agendamento? A administração precisará aprovar.");
      if (!confirmReq) return;
    } else {
      alert("Uma solicitação de exclusão já está pendente para este agendamento.");
      return;
    }

    try {
      await setDoc(doc(db, 'appointments', appt.id), cleanObject({
        ...appt,
        deletionRequested: true
      }));
      alert("Solicitação de exclusão enviada com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${appt.id}`);
    }
  };

  const handleRequestChange = async (appt: Appointment) => {
    if (!changeDate || !changeTime) {
      alert("Por favor, selecione a nova data e horário.");
      return;
    }

    try {
      await setDoc(doc(db, 'appointments', appt.id), cleanObject({
        ...appt,
        changeRequested: {
          newDate: changeDate,
          newTime: changeTime,
          status: 'pending'
        }
      }));
      setRequestingChangeId(null);
      setChangeDate('');
      setChangeTime('');
      alert("Solicitação de alteração enviada com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${appt.id}`);
    }
  };

  const upcomingBookings = myBookings.filter(b => new Date(b.date) >= new Date()).sort((a,b) => a.date.localeCompare(b.date));
  const pastBookings = myBookings.filter(b => new Date(b.date) < new Date()).sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-20 animate-fade-in">
      {/* Banner de Boas-vindas e Ação */}
      <div className="bg-stone-900 text-white p-8 md:p-12 rounded-[3rem] mb-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">Seja bem-vinda, <span className="text-amber-500">{user.name.split(' ')[0]}</span>!</h2>
          <p className="text-stone-400 text-lg font-light italic">Vamos agendar um procedimento hoje?</p>
        </div>
        <button 
          onClick={() => onNavigate('booking')} 
          className="relative z-10 bg-white text-stone-900 px-10 py-5 rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-amber-500 hover:text-white transition-all transform active:scale-95"
        >
          Agendar Agora
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-10 md:mb-20 gap-6 md:gap-8 text-center md:text-left">
        <div>
          <span className="text-amber-600 font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] mb-2 block">Seu Histórico na Clínica</span>
          <h1 className="text-3xl md:text-5xl font-bold text-stone-800 tracking-tighter uppercase">Painel da Paciente</h1>
        </div>
        <button 
          onClick={onLogout}
          className="w-full sm:w-auto px-10 py-4 border-2 border-stone-200 text-stone-500 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-100 active:scale-95 transition-all"
        >
          Sair do Sistema
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12">
        {/* Lado Esquerdo: Perfil */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-3xl md:rounded-[3rem] shadow-sm border border-stone-100 text-center lg:text-left">
            <div className="w-20 h-20 bg-stone-900 text-white rounded-3xl flex items-center justify-center text-3xl font-bold mb-6 mx-auto lg:mx-0 shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div className="mb-8">
              <h3 className="font-bold text-stone-800 text-sm md:text-base uppercase tracking-tight truncate">{user.name}</h3>
              <p className="text-[9px] text-stone-400 font-bold mt-1 uppercase tracking-widest italic">Paciente Verificada</p>
            </div>
            
            <div className="space-y-6 pt-6 border-t border-stone-50 text-left">
              <div>
                <p className="text-[8px] md:text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-1">CPF</p>
                <p className="text-sm font-semibold text-stone-700">{user.cpf || '---'}</p>
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-1">E-mail</p>
                <p className="text-sm font-semibold text-stone-700 truncate">{user.email}</p>
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-1">Telefone</p>
                <p className="text-sm font-semibold text-stone-700">{user.phone || '---'}</p>
              </div>
              
              <div className="pt-6 border-t border-stone-50">
                {isEditingPassword ? (
                  <div className="space-y-4 animate-fade-in">
                    <input 
                      type="password" 
                      placeholder="Nova Senha" 
                      className="w-full p-3 bg-stone-50 rounded-xl text-xs outline-none border border-stone-100 focus:border-amber-200"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleUpdatePassword} className="flex-1 py-2 bg-stone-800 text-white text-[9px] font-bold uppercase rounded-lg">Salvar</button>
                      <button onClick={() => setIsEditingPassword(false)} className="flex-1 py-2 bg-stone-100 text-stone-500 text-[9px] font-bold uppercase rounded-lg">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setIsEditingPassword(true)} className="text-[9px] font-bold uppercase text-amber-600 hover:text-amber-800 transition-colors underline">Alterar Senha</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Atividades */}
        <div className="lg:col-span-3 space-y-8 md:space-y-12">
          {/* Próximos Eventos */}
          <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-xl border border-stone-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
              <h2 className="font-bold text-stone-800 uppercase tracking-widest text-[9px] md:text-[10px]">Próximas Visitas</h2>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <div className="divide-y divide-stone-50">
              {upcomingBookings.length > 0 ? upcomingBookings.map(appt => (
                <div key={appt.id} className="p-6 md:p-10 flex flex-col sm:flex-row justify-between items-center group gap-6 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex flex-col items-center justify-center border border-amber-100 shadow-sm">
                       <span className="text-[10px] font-bold text-amber-800 uppercase leading-none">{new Date(appt.date).toLocaleDateString('pt-BR', {month: 'short'})}</span>
                       <span className="text-2xl font-bold text-amber-900">{new Date(appt.date).getDate()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 text-lg md:text-xl group-hover:text-amber-600 transition-colors uppercase tracking-tight">{appt.serviceName}</p>
                      <p className="text-xs text-stone-400 font-medium">Horário: <span className="text-stone-700 font-bold">{appt.time}</span></p>
                      {appt.changeRequested && appt.changeRequested.status === 'pending' && (
                        <p className="text-[9px] text-amber-600 font-bold uppercase mt-1 italic">Alteração Solicitada: {new Date(appt.changeRequested.newDate).toLocaleDateString('pt-BR')} às {appt.changeRequested.newTime}</p>
                      )}
                      {appt.deletionRequested && (
                        <p className="text-[9px] text-red-500 font-bold uppercase mt-1 italic">Exclusão Solicitada</p>
                      )}
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex flex-col gap-3">
                    <span className={`block w-full text-center px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-md ${appt.status === 'confirmed' ? 'bg-stone-900 text-white' : 'bg-amber-100 text-amber-600'}`}>
                      {appt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </span>
                    
                    <div className="flex gap-2 justify-center sm:justify-end">
                      <button 
                        onClick={() => setRequestingChangeId(appt.id)} 
                        className="text-[8px] font-bold uppercase text-stone-400 hover:text-amber-600 transition-colors"
                      >
                        Alterar
                      </button>
                      <button 
                        onClick={() => handleRequestDeletion(appt)} 
                        className="text-[8px] font-bold uppercase text-stone-400 hover:text-red-500 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>

                    {requestingChangeId === appt.id && (
                      <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-3 animate-fade-in">
                        <input 
                          type="date" 
                          className="w-full p-2 bg-white rounded-lg text-[10px] outline-none border border-stone-100"
                          value={changeDate}
                          onChange={e => setChangeDate(e.target.value)}
                        />
                        <select 
                          className="w-full p-2 bg-white rounded-lg text-[10px] outline-none border border-stone-100 font-bold"
                          value={changeTime}
                          onChange={e => setChangeTime(e.target.value)}
                        >
                          <option value="">Horário...</option>
                          {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => handleRequestChange(appt)} className="flex-1 py-2 bg-amber-600 text-white text-[8px] font-bold uppercase rounded-lg">Solicitar</button>
                          <button onClick={() => setRequestingChangeId(null)} className="flex-1 py-2 bg-stone-200 text-stone-600 text-[8px] font-bold uppercase rounded-lg">X</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-16 md:p-20 text-center bg-stone-50/30">
                  <p className="text-stone-300 italic font-bold uppercase tracking-widest text-[10px] mb-4">Sua agenda está livre</p>
                  <button onClick={() => onNavigate('booking')} className="bg-white text-amber-600 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100 shadow-sm hover:shadow-md transition-all active:scale-95">Reservar um horário</button>
                </div>
              )}
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-stone-50 bg-stone-50/50">
              <h2 className="font-bold text-stone-800 uppercase tracking-widest text-[9px] md:text-[10px]">Tratamentos Realizados</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {pastBookings.length > 0 ? pastBookings.map(appt => (
                <div key={appt.id} className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center opacity-60 hover:opacity-100 transition-all gap-4 sm:gap-0">
                  <div className="text-center sm:text-left">
                    <p className="font-bold text-stone-700 uppercase text-xs tracking-tight">{appt.serviceName}</p>
                    <p className="text-[10px] text-stone-400 font-bold mt-1 uppercase">{new Date(appt.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="px-4 py-1.5 rounded-full border border-stone-200 text-stone-400 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Procedimento Concluído</span>
                </div>
              )) : (
                <div className="p-16 text-center text-stone-300 italic font-bold uppercase tracking-widest text-[10px]">Histórico ainda não disponível</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
