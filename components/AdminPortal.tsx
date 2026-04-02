
import React, { useState, useEffect } from 'react';
import { Share2, Copy, MessageCircle, Link, Printer } from 'lucide-react';
import { User, Appointment, Service, BusinessInfo, Anamnesis, Coupon, Transaction, CashierSession, PaymentMethod, CarouselItem, WorkVideo } from '../types';
import { DEFAULT_BUSINESS_INFO } from '../constants';
import { formatPhone, formatCPF, formatName } from '../utils';
import AnamnesisForm from './AnamnesisForm';
import { auth, db, collection, doc, setDoc, deleteDoc, onSnapshot, handleFirestoreError, OperationType, cleanObject } from '../firebase';

interface AdminPortalProps {
  services: Service[];
  businessInfo: BusinessInfo;
  carouselItems: CarouselItem[];
  workVideos: WorkVideo[];
  onUpdateServices: (s: Service[]) => void;
  onUpdateBusinessInfo: (info: BusinessInfo) => void;
}

type AdminViewMode = 'agendamento' | 'pacientes' | 'caixa' | 'serviços' | 'cupons' | 'configurações' | 'personalização' | 'sobre' | 'legal' | 'carrossel' | 'trabalho';

const SUPER_ADMINS = ['lanjc0245@gmail.com', 'jclanhouse2012@hotmail.com.br'];

const AdminPortal: React.FC<AdminPortalProps> = ({ services, businessInfo, carouselItems, workVideos, onUpdateServices, onUpdateBusinessInfo }) => {
  const [viewMode, setViewMode] = useState<AdminViewMode>('agendamento');
  
  // States para dados do sistema
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // States para o sistema de Caixa
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cashierSessions, setCashierSessions] = useState<CashierSession[]>([]);
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null);
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'entry' | 'exit'>('entry');
  
  // States para Modais e Edições
  const [selectedUserForAnamnesis, setSelectedUserForAnamnesis] = useState<User | null>(null);
  const [isEditingAnamnesis, setIsEditingAnamnesis] = useState(false);
  const [selectedPrintTemplate, setSelectedPrintTemplate] = useState<string>('template1');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [serviceBeingEdited, setServiceBeingEdited] = useState<Partial<Service> | null>(null);
  const [isEditingService, setIsEditingService] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);

  // States para Carrossel
  const [newCarouselImage, setNewCarouselImage] = useState<string | null>(null);
  const [newCarouselLink, setNewCarouselLink] = useState('');

  // States para Nosso Trabalho
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  // State for Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Carregamento inicial
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubAppts = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      setAppointments(snapshot.docs.map(doc => doc.data() as Appointment));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as User));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => doc.data() as Coupon));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'coupons'));

    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    const unsubMethods = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
      if (!snapshot.empty) {
        setPaymentMethods(snapshot.docs.map(doc => doc.data() as PaymentMethod));
      } else {
        const defaultMethods: PaymentMethod[] = [
          { id: '1', name: 'Dinheiro', isActive: true },
          { id: '2', name: 'PIX', isActive: true },
          { id: '3', name: 'Cartão de Crédito', isActive: true },
          { id: '4', name: 'Cartão de Débito', isActive: true },
          { id: '5', name: 'Transferência', isActive: true },
          { id: '6', name: 'Boleto', isActive: true },
          { id: '7', name: 'Cartão de Crédito (Máquina)', isActive: true },
          { id: '8', name: 'Cartão de Débito (Máquina)', isActive: true },
        ];
        defaultMethods.forEach(m => setDoc(doc(db, 'payment_methods', m.id), m));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'payment_methods'));

    const unsubSessions = onSnapshot(collection(db, 'cashier_sessions'), (snapshot) => {
      const sessions = snapshot.docs.map(doc => doc.data() as CashierSession);
      setCashierSessions(sessions);
      const open = sessions.find(s => s.status === 'open');
      setActiveSession(open || null);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'cashier_sessions'));

    return () => {
      unsubAppts();
      unsubUsers();
      unsubCoupons();
      unsubTransactions();
      unsubMethods();
      unsubSessions();
    };
  }, []);

  // Funções de Agendamento
  const handleCancelAppointment = async (appt: Appointment) => {
    openConfirm(
      "Cancelar Agendamento",
      `Deseja realmente cancelar o agendamento de ${appt.userName}? Uma notificação será simulada para o cliente.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'appointments', appt.id));
          (window as any).showSuccess(`Agendamento de ${appt.userName} cancelado.`);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `appointments/${appt.id}`);
        }
        closeConfirm();
      }
    );
  };

  const handleApproveDeletion = async (appt: Appointment) => {
    openConfirm(
      "Aprovar Exclusão",
      `Aprovar exclusão do agendamento de ${appt.userName}?`,
      async () => {
        try {
          await deleteDoc(doc(db, 'appointments', appt.id));
          (window as any).showSuccess("Agendamento excluído com sucesso.");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `appointments/${appt.id}`);
        }
        closeConfirm();
      }
    );
  };

  const handleRejectDeletion = async (appt: Appointment) => {
    try {
      await setDoc(doc(db, 'appointments', appt.id), cleanObject({
        ...appt,
        deletionRequested: false
      }));
      (window as any).showSuccess("Solicitação de exclusão rejeitada.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${appt.id}`);
    }
  };

  const handleDeleteAppointment = async (appt: Appointment) => {
    openConfirm(
      "Apagar Agendamento",
      `Deseja realmente APAGAR DEFINITIVAMENTE o agendamento de ${appt.userName}? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'appointments', appt.id));
          (window as any).showSuccess("Agendamento apagado definitivamente.");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `appointments/${appt.id}`);
        }
        closeConfirm();
      },
      'danger'
    );
  };

  const handleApproveChange = async (appt: Appointment) => {
    if(!appt.changeRequested) return;
    try {
      await setDoc(doc(db, 'appointments', appt.id), cleanObject({
        ...appt,
        date: appt.changeRequested.newDate,
        time: appt.changeRequested.newTime,
        changeRequested: undefined
      }));
      (window as any).showSuccess("Alteração de agendamento aprovada!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${appt.id}`);
    }
  };

  const handleRejectChange = async (appt: Appointment) => {
    try {
      await setDoc(doc(db, 'appointments', appt.id), cleanObject({
        ...appt,
        changeRequested: undefined
      }));
      (window as any).showSuccess("Solicitação de alteração rejeitada.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${appt.id}`);
    }
  };

  const handleSaveAnamnesis = async (data: Anamnesis) => {
    if (!selectedUserForAnamnesis) return;
    try {
      await setDoc(doc(db, 'users', selectedUserForAnamnesis.id), cleanObject({
        ...selectedUserForAnamnesis,
        anamnesis: data,
        isProfileComplete: true
      }));
      (window as any).showSuccess("Prontuário atualizado com sucesso!");
      setIsEditingAnamnesis(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${selectedUserForAnamnesis.id}`);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      (window as any).showError("A logo deve ter no máximo 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateBusinessInfo({ ...businessInfo, logoUrl: reader.result as string });
      (window as any).showSuccess("Logo carregada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  const executePrint = () => {
    const printContent = document.getElementById('printable-area');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Prontuário - ${selectedUserForAnamnesis?.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              .no-print { display: none; }
              body { padding: 0; margin: 0; }
            }
            ${getTemplateStyles(businessInfo.printTemplateId || 'template1')}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getTemplateStyles = (id: string) => {
    switch (id) {
      case 'template1': return '.print-container { font-family: serif; color: #1c1917; } .header-accent { border-bottom: 4px solid #b45309; }';
      case 'template2': return '.print-container { font-family: sans-serif; color: #2d3748; } .header-accent { background: #f7fafc; padding: 20px; border-radius: 10px; }';
      case 'template3': return '.print-container { font-family: "Playfair Display", serif; } .header-accent { border-left: 10px solid #b45309; padding-left: 20px; }';
      case 'template4': return '.print-container { font-family: "Inter", sans-serif; } .header-accent { display: flex; flex-direction: column; align-items: center; text-align: center; }';
      case 'template5': return '.print-container { background: #fffaf0; } .header-accent { border: 2px solid #b45309; padding: 15px; }';
      case 'template6': return '.print-container { font-family: "Georgia", serif; } .header-accent { text-transform: uppercase; letter-spacing: 2px; }';
      case 'template7': return '.print-container { color: #1a202c; } .header-accent { border-bottom: 1px dashed #cbd5e0; }';
      case 'template8': return '.print-container { font-family: "Verdana", sans-serif; } .header-accent { background: #1c1917; color: white; padding: 20px; }';
      case 'template9': return '.print-container { font-family: "Trebuchet MS", sans-serif; } .header-accent { border-radius: 50px 0 50px 0; background: #fff7ed; padding: 30px; }';
      case 'template10': return '.print-container { font-family: "Courier New", monospace; } .header-accent { border: 5px double #b45309; padding: 20px; }';
      default: return '';
    }
  };

  const handleConfirmAppointment = async (appt: Appointment) => {
    try {
      await setDoc(doc(db, 'appointments', appt.id), cleanObject({
        ...appt,
        status: 'confirmed'
      }));
      (window as any).showSuccess("Agendamento confirmado!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${appt.id}`);
    }
  };

  // Funções de Pacientes
  const handleEditUser = (u: User) => {
    setSelectedUserForEdit(u);
    setIsUserModalOpen(true);
  };

  const handleRegisterUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: '',
      email: '',
      role: 'client',
      registrationSource: 'manual',
      isProfileComplete: false
    };
    setSelectedUserForEdit(newUser);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    if (!selectedUserForEdit) return;
    try {
      await setDoc(doc(db, 'users', selectedUserForEdit.id), cleanObject(selectedUserForEdit));
      (window as any).showSuccess("Dados do paciente atualizados!");
      setIsUserModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${selectedUserForEdit.id}`);
    }
  };

  const handleDeleteUser = async (u: User) => {
    const isSuperAdmin = auth.currentUser?.email === 'lanjc0245@gmail.com' || auth.currentUser?.email === 'jclanhouse2012@hotmail.com.br';
    
    if (u.email === businessInfo.email && !isSuperAdmin) {
      (window as any).showError("A conta principal de administrador não pode ser apagada por este usuário.");
      return;
    }

    if (u.id === auth.currentUser?.uid) {
      (window as any).showError("Você não pode apagar sua própria conta enquanto estiver logado.");
      return;
    }

    openConfirm(
      "Apagar Paciente",
      `Deseja realmente apagar permanentemente a conta de ${u.name}? Esta ação é irreversível.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'users', u.id));
          (window as any).showSuccess("Paciente removido com sucesso!");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${u.id}`);
        }
        closeConfirm();
      }
    );
  };

  // Funções de Caixa
  const handleOpenCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = Number((e.currentTarget as any).initialBalance.value);
    const sessionId = Date.now().toString();
    const newSession: CashierSession = {
      id: sessionId,
      openedAt: new Date().toISOString(),
      initialBalance: balance,
      status: 'open',
      responsible: 'Administrador'
    };
    
    try {
      await setDoc(doc(db, 'cashier_sessions', sessionId), cleanObject(newSession));
      (window as any).showSuccess("Caixa aberto com sucesso!");
      setActiveSession(newSession);
      setIsCashierModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `cashier_sessions/${sessionId}`);
    }
  };

  const handleCloseCashier = async () => {
    if (!activeSession) return;
    const dayTransactions = transactions.filter(t => t.createdAt >= activeSession.openedAt);
    const entries = dayTransactions.filter(t => t.type === 'entry').reduce((acc, t) => acc + t.value, 0);
    const exits = dayTransactions.filter(t => t.type === 'exit').reduce((acc, t) => acc + t.value, 0);
    const finalBalance = activeSession.initialBalance + entries - exits;

    openConfirm(
      "Fechar Caixa",
      `Deseja fechar o caixa? \n\nSaldo Inicial: R$ ${activeSession.initialBalance.toFixed(2)}\nEntradas: R$ ${entries.toFixed(2)}\nSaídas: R$ ${exits.toFixed(2)}\nSaldo Final: R$ ${finalBalance.toFixed(2)}`,
      async () => {
        try {
          const closedSession = { ...activeSession, status: 'closed', closedAt: new Date().toISOString(), finalBalance } as CashierSession;
          await setDoc(doc(db, 'cashier_sessions', activeSession.id), cleanObject(closedSession));
          (window as any).showSuccess("Caixa fechado com sucesso!");
          setActiveSession(null);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `cashier_sessions/${activeSession.id}`);
        }
        closeConfirm();
      },
      'warning'
    );
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as any;
    const transId = Date.now().toString();
    const newTrans: Transaction = {
      id: transId,
      type: transactionType,
      category: form.category.value,
      value: Number(form.value.value),
      description: form.description.value,
      date: form.date.value,
      paymentMethod: form.paymentMethod.value,
      customerName: form.customerName?.value || '',
      status: form.status.value,
      responsible: 'Administrador',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'transactions', transId), cleanObject(newTrans));
      (window as any).showSuccess("Lançamento salvo com sucesso!");
      setIsTransactionModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `transactions/${transId}`);
    }
  };

  // Funções de Cupons
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as any;
    const code = form.code.value.toUpperCase();
    const discount = Number(form.discount.value);
    const type = form.type.value;
    
    if (!code || !discount) return alert("Preencha todos os campos!");
    
    const couponId = Date.now().toString();
    const newCoupon: Coupon = {
      id: couponId,
      code,
      discount,
      type,
      isActive: true
    };

    try {
      await setDoc(doc(db, 'coupons', couponId), cleanObject(newCoupon));
      (window as any).showSuccess("Cupom criado com sucesso!");
      form.reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `coupons/${couponId}`);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    openConfirm(
      "Excluir Cupom",
      "Deseja realmente excluir este cupom?",
      async () => {
        try {
          await deleteDoc(doc(db, 'coupons', id));
          (window as any).showSuccess("Cupom excluído!");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `coupons/${id}`);
        }
        closeConfirm();
      }
    );
  };

  const handleDeleteService = async (id: string) => {
    openConfirm(
      "Excluir Serviço",
      "Deseja realmente excluir este serviço?",
      async () => {
        try {
          await deleteDoc(doc(db, 'services', id));
          (window as any).showSuccess("Serviço excluído!");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
        }
        closeConfirm();
      }
    );
  };

  const handleDeleteTransaction = async (id: string) => {
    openConfirm(
      "Excluir Lançamento",
      "Deseja realmente excluir este lançamento financeiro?",
      async () => {
        try {
          await deleteDoc(doc(db, 'transactions', id));
          (window as any).showSuccess("Lançamento excluído!");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
        }
        closeConfirm();
      }
    );
  };
  const handleResendAppointment = (appt: Appointment) => {
    const clinicPhone = businessInfo.phone.replace(/\D/g, '');
    const dateFormatted = new Date(appt.date).toLocaleDateString('pt-BR');
    const message = `*REENVIO DE AGENDAMENTO*\n\nOlá ${appt.userName}!\nLembramos do seu agendamento.\n\n✨ *Serviço:* ${appt.serviceName}\n📅 *Data:* ${dateFormatted}\n⏰ *Horário:* ${appt.time}\n💰 *Valor:* R$ ${appt.price.toFixed(2)}\n\n📍 *Local:* ${businessInfo.address}`;
    const waUrl = `https://wa.me/55${clinicPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleResendAnamnesis = (u: User) => {
    if (!u.anamnesis) return;
    const clinicPhone = businessInfo.phone.replace(/\D/g, '');
    const message = `*REENVIO DE PRONTUÁRIO*\n\nOlá ${u.name}!\nAqui está o resumo da sua ficha de anamnese preenchida em ${u.anamnesis.filledAt}.\n\n*Queixa:* ${u.anamnesis.mainComplaint}\n*Ocupação:* ${u.anamnesis.occupation}`;
    const waUrl = `https://wa.me/55${clinicPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };
  const handleShareWhatsApp = (c: Coupon) => {
    const message = `✨ *DESCONTO EXCLUSIVO* na *${businessInfo.name}*! ✨\n\nUse o cupom: *${c.code}*\nGanhe: *${c.discount}${c.type === 'percent' ? '%' : ' de desconto'}*\n\nAgende agora pelo site:\n${window.location.origin}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyCouponLink = (c: Coupon) => {
    const message = `✨ DESCONTO EXCLUSIVO na ${businessInfo.name}! ✨\n\nUse o cupom: ${c.code}\nGanhe: ${c.discount}${c.type === 'percent' ? '%' : ' de desconto'}\n\nAgende agora pelo site: ${window.location.origin}`;
    navigator.clipboard.writeText(message).then(() => {
      (window as any).showSuccess("Mensagem copiada!");
    });
  };

  const handleWebShare = (c: Coupon) => {
    const message = `✨ DESCONTO EXCLUSIVO na ${businessInfo.name}! ✨\n\nUse o cupom: ${c.code}\nGanhe: ${c.discount}${c.type === 'percent' ? '%' : ' de desconto'}`;
    if (navigator.share) {
      navigator.share({
        title: `Cupom ${c.code} - ${businessInfo.name}`,
        text: message,
        url: window.location.origin,
      }).catch(console.error);
    } else {
      handleCopyCouponLink(c);
    }
  };

  const handleShareFacebook = (c: Coupon) => {
    const message = `✨ DESCONTO EXCLUSIVO na ${businessInfo.name}! ✨\n\nUse o cupom: ${c.code}\nGanhe: ${c.discount}${c.type === 'percent' ? '%' : ' de desconto'}\n\nAgende agora pelo site: ${window.location.origin}`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyOnlyLink = (c: Coupon) => {
    const url = `${window.location.origin}?coupon=${c.code}`;
    navigator.clipboard.writeText(url).then(() => {
      (window as any).showSuccess("Link copiado!");
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!serviceBeingEdited) return;
    
    const serviceId = serviceBeingEdited.id || Math.random().toString(36).substr(2, 9);
    const finalService = { 
      ...serviceBeingEdited, 
      id: serviceId, 
      status: serviceBeingEdited.status || 'active', 
      category: serviceBeingEdited.category || 'facial' 
    } as Service;

    // Check for document size limit (approximate)
    const stringified = JSON.stringify(finalService);
    if (stringified.length > 1000000) { // 1MB limit
      return alert("O tamanho total das imagens deste serviço excede o limite permitido pelo banco de dados. Por favor, use imagens menores ou menos fotos.");
    }

    try {
      await setDoc(doc(db, 'services', serviceId), cleanObject(finalService));
      (window as any).showSuccess("Serviço salvo com sucesso!");
      setIsEditingService(false);
      setServiceBeingEdited(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `services/${serviceId}`);
    }
  };

  // Funções de Personalização
  const handleResetColors = () => {
    openConfirm(
      "Resetar Cores",
      "Deseja realmente resetar todas as cores para o padrão de fábrica?",
      () => {
        onUpdateBusinessInfo({
          ...businessInfo,
          primaryColor: DEFAULT_BUSINESS_INFO.primaryColor,
          headingColor: DEFAULT_BUSINESS_INFO.headingColor,
          bodyTextColor: DEFAULT_BUSINESS_INFO.bodyTextColor,
          navTextColor: DEFAULT_BUSINESS_INFO.navTextColor,
          footerTextColor: DEFAULT_BUSINESS_INFO.footerTextColor,
          heroSubtitleColor: DEFAULT_BUSINESS_INFO.heroSubtitleColor,
          heroTitleColor: DEFAULT_BUSINESS_INFO.heroTitleColor,
          btnAdminColor: DEFAULT_BUSINESS_INFO.btnAdminColor,
          btnLogoutColor: DEFAULT_BUSINESS_INFO.btnLogoutColor,
          btnSaveColor: DEFAULT_BUSINESS_INFO.btnSaveColor,
          btnCancelColor: DEFAULT_BUSINESS_INFO.btnCancelColor
        });
        (window as any).showSuccess("Cores resetadas!");
        closeConfirm();
      },
      'warning'
    );
  };

  const handleAddCarouselItem = async () => {
    if (!newCarouselImage) return alert("Selecione uma imagem!");
    
    // Check for document size limit (approximate)
    if (newCarouselImage.length > 1000000) { // 1MB limit
      return alert("A imagem selecionada é muito grande. Por favor, use uma imagem menor.");
    }

    const itemId = Date.now().toString();
    const newItem: CarouselItem = {
      id: itemId,
      imageUrl: newCarouselImage,
      linkUrl: newCarouselLink || '#/'
    };
    try {
      await setDoc(doc(db, 'carouselItems', itemId), cleanObject(newItem));
      (window as any).showSuccess("Banner adicionado com sucesso!");
      setNewCarouselImage(null);
      setNewCarouselLink('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `carouselItems/${itemId}`);
    }
  };

  const handleRemoveCarouselItem = async (id: string) => {
    openConfirm(
      "Remover Banner",
      "Deseja remover este banner do carrossel?",
      async () => {
        try {
          await deleteDoc(doc(db, 'carouselItems', id));
          (window as any).showSuccess("Banner removido!");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `carouselItems/${id}`);
        }
        closeConfirm();
      }
    );
  };

  const handleAddWorkVideo = async () => {
    if (!newVideoUrl) return alert("Insira o link do YouTube!");
    const videoId = Date.now().toString();
    const newItem: WorkVideo = {
      id: videoId,
      url: newVideoUrl,
      title: newVideoTitle
    };
    try {
      await setDoc(doc(db, 'workVideos', videoId), cleanObject(newItem));
      (window as any).showSuccess("Vídeo adicionado com sucesso!");
      setNewVideoUrl('');
      setNewVideoTitle('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workVideos/${videoId}`);
    }
  };

  const handleRemoveWorkVideo = async (id: string) => {
    openConfirm(
      "Remover Vídeo",
      "Deseja remover este vídeo da seção Nosso Trabalho?",
      async () => {
        try {
          await deleteDoc(doc(db, 'workVideos', id));
          setDeletingVideoId(null);
          (window as any).showSuccess("Vídeo removido!");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `workVideos/${id}`);
        }
        closeConfirm();
      }
    );
  };

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
      ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`
      : null;
  };

  return (
    <div className="w-full min-h-screen bg-stone-50 flex flex-col no-print">
      {/* Menu Administrativo Superior */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-50 no-print shadow-sm overflow-x-auto">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center gap-2">
          {[
            { id: 'agendamento', label: 'Agenda', icon: '📅' },
            { id: 'pacientes', label: 'Pacientes', icon: '👥' },
            { id: 'caixa', label: 'Caixa', icon: '💰' },
            { id: 'serviços', label: 'Serviços', icon: '✨' },
            { id: 'cupons', label: 'Cupons', icon: '🎟️' },
            { id: 'carrossel', label: 'Banner Home', icon: '🖼️' },
            { id: 'trabalho', label: 'Nosso Trabalho', icon: '🎥' },
            { id: 'sobre', label: 'Pag. Sobre', icon: '🏢' },
            { id: 'legal', label: 'Pag. Legal', icon: '⚖️' },
            { id: 'configurações', label: 'Acesso', icon: '🔐' },
            { id: 'personalização', label: 'Configurações & Design', icon: '🎨' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setViewMode(tab.id as AdminViewMode)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === tab.id ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:text-stone-800 bg-stone-50/50'}`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-6 py-10 flex-grow">
        
        {/* AGENDAMENTO */}
        {viewMode === 'agendamento' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden animate-fade-in">
            <div className="p-8 border-b border-stone-50 flex justify-between items-center bg-stone-50/30">
               <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800">Próximos Agendamentos</h3>
               <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-stone-200 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-50">🖨️ Imprimir Agenda</button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-stone-50 text-[9px] font-black uppercase text-stone-400 tracking-widest border-b">
                <tr>
                  <th className="p-8">Nome do Paciente</th>
                  <th className="p-8">Serviços</th>
                  <th className="p-8">Data e Hora</th>
                  <th className="p-8">Status</th>
                  <th className="p-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {appointments.map(appt => {
                  const user = users.find(u => u.id === appt.userId);
                  return (
                    <tr key={appt.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-8">
                        <span className="font-bold text-stone-800 text-sm uppercase tracking-tight">{appt.userName}</span>
                      </td>
                      <td className="p-8 text-xs text-stone-500 font-medium">{appt.serviceName}</td>
                      <td className="p-8">
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-stone-800">{new Date(appt.date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{appt.time}</span>
                         </div>
                      </td>
                      <td className="p-8">
                        <div className="flex flex-col gap-1">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {appt.status}
                          </span>
                          {appt.deletionRequested && (
                            <span className="px-4 py-1 bg-red-100 text-red-600 rounded-full text-[7px] font-black uppercase tracking-widest text-center">Exclusão Solicitada</span>
                          )}
                          {appt.changeRequested && (
                            <span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[7px] font-black uppercase tracking-widest text-center">Alteração Solicitada</span>
                          )}
                        </div>
                      </td>
                      <td className="p-8 text-right space-y-2">
                        {appt.status === 'pending' && (
                          <button onClick={() => handleConfirmAppointment(appt)} className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-green-600 transition-all">Confirmar</button>
                        )}
                        
                        {appt.deletionRequested && (
                          <div className="flex gap-2 justify-end mb-2">
                            <button onClick={() => handleApproveDeletion(appt)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase">Aprovar Exclusão</button>
                            <button onClick={() => handleRejectDeletion(appt)} className="px-3 py-1.5 bg-stone-200 text-stone-600 rounded-lg text-[8px] font-black uppercase">Rejeitar</button>
                          </div>
                        )}

                        {appt.changeRequested && (
                          <div className="flex flex-col gap-2 mb-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-[8px] font-bold text-blue-800 uppercase text-center">Nova Data: {new Date(appt.changeRequested.newDate).toLocaleDateString('pt-BR')} às {appt.changeRequested.newTime}</p>
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => handleApproveChange(appt)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase">Aprovar Troca</button>
                              <button onClick={() => handleRejectChange(appt)} className="px-3 py-1.5 bg-stone-200 text-stone-600 rounded-lg text-[8px] font-black uppercase">Rejeitar</button>
                            </div>
                          </div>
                        )}

                        {user?.anamnesis && (
                          <button onClick={() => setSelectedUserForAnamnesis(user)} className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-stone-800 transition-all">📄 Ver Prontuário</button>
                        )}
                        <button 
                          onClick={() => handleCancelAppointment(appt)} 
                          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all text-white"
                          style={{ backgroundColor: 'var(--btn-cancelar)' }}
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleDeleteAppointment(appt)} 
                          className="px-5 py-2.5 bg-red-100 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-200 transition-all"
                        >
                          Apagar
                        </button>
                        <button 
                          onClick={() => handleResendAppointment(appt)} 
                          className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-green-600 transition-all"
                        >
                          Reenviar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PACIENTES */}
        {viewMode === 'pacientes' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden animate-fade-in">
            <div className="p-8 border-b border-stone-50 flex justify-between items-center bg-stone-50/30">
               <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800">Base de Pacientes</h3>
               <button onClick={handleRegisterUser} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-800">➕ Novo Paciente</button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-stone-50 text-[9px] font-black uppercase text-stone-400 border-b">
                <tr>
                  <th className="p-8">Nome / E-mail</th>
                  <th className="p-8">Telefone</th>
                  <th className="p-8">Nível</th>
                  <th className="p-8 text-right">Gerenciar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-stone-50/30">
                    <td className="p-8">
                      <p className="font-bold text-stone-800 text-sm uppercase">{u.name}</p>
                      <p className="text-[10px] text-stone-400 font-medium lowercase">{u.email}</p>
                    </td>
                    <td className="p-8 text-xs font-mono">{u.phone || '---'}</td>
                    <td className="p-8">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-500'}`}>
                         {u.role}
                       </span>
                    </td>
                    <td className="p-8 text-right space-x-3">
                      <button onClick={() => setSelectedUserForAnamnesis(u)} className="text-[9px] font-black uppercase text-amber-600 underline hover:text-amber-800 transition-colors">Prontuário</button>
                      {u.anamnesis && (
                        <button onClick={() => handleResendAnamnesis(u)} className="text-[9px] font-black uppercase text-green-600 underline hover:text-green-800 transition-colors">Reenviar Ficha</button>
                      )}
                      <button onClick={() => handleEditUser(u)} className="text-[9px] font-black uppercase text-stone-400 underline hover:text-stone-800 transition-colors">Editar</button>
                      <button onClick={() => handleDeleteUser(u)} className="text-[9px] font-black uppercase text-red-400 hover:text-red-600 transition-colors">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CARROSSEL HOME */}
        {viewMode === 'carrossel' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
             <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-8">
                <h3 className="text-3xl font-black uppercase text-stone-800 tracking-tighter border-b border-stone-50 pb-6">Gestão de Banners (Home)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Nova Imagem do Carrossel</label>
                      <div className="w-full h-48 bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group">
                         {newCarouselImage ? (
                           <img src={newCarouselImage} className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-stone-300 font-bold uppercase text-[10px]">Clique para Upload</span>
                         )}
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                           const f = e.target.files?.[0];
                           if(f) {
                             const r = new FileReader();
                             r.onloadend = () => setNewCarouselImage(r.result as string);
                             r.readAsDataURL(f);
                           }
                         }} />
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest block mb-2">Link de Destino</label>
                        <input className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" placeholder="EX: #/tratamentos ou URL completa" value={newCarouselLink || ''} onChange={e => setNewCarouselLink(e.target.value)} />
                      </div>
                      <button 
                        onClick={handleAddCarouselItem} 
                        className="w-full py-5 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:brightness-110 transition-all"
                        style={{ backgroundColor: 'var(--btn-salvar)' }}
                      >
                        Adicionar ao Carrossel
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-stone-50">
                   {carouselItems?.map((item) => (
                     <div key={item.id} className="bg-stone-50 rounded-[2.5rem] p-4 border border-stone-100 relative group">
                        <div className="h-40 rounded-[1.5rem] overflow-hidden mb-4">
                           <img src={item.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-2 truncate max-w-[200px]">Destino: {item.linkUrl}</p>
                        <button onClick={() => handleRemoveCarouselItem(item.id)} className="absolute top-6 right-6 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-black shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">×</button>
                     </div>
                   ))}
                   {(!carouselItems || carouselItems.length === 0) && (
                     <div className="col-span-full py-20 text-center">
                        <p className="text-stone-300 font-bold uppercase text-xs">Nenhum banner cadastrado.</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* NOSSO TRABALHO */}
        {viewMode === 'trabalho' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
             <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-8">
                <h3 className="text-3xl font-black uppercase text-stone-800 tracking-tighter border-b border-stone-50 pb-6">Gestão de Vídeos (Nosso Trabalho)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest block mb-2">Link do YouTube</label>
                       <input 
                         className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" 
                         placeholder="https://www.youtube.com/watch?v=..." 
                         value={newVideoUrl || ''} 
                         onChange={e => setNewVideoUrl(e.target.value)} 
                       />
                       <p className="text-[8px] text-stone-400 uppercase font-bold ml-4">Suporta links normais, shorts e compartilhamento.</p>
                    </div>
                   <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest block mb-2">Título do Vídeo (Opcional)</label>
                        <input 
                          className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" 
                          placeholder="Ex: Procedimento de Limpeza" 
                          value={newVideoTitle || ''} 
                          onChange={e => setNewVideoTitle(e.target.value)} 
                        />
                      </div>
                      <button 
                        onClick={handleAddWorkVideo} 
                        className="w-full py-5 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:brightness-110 transition-all"
                        style={{ backgroundColor: 'var(--btn-salvar)' }}
                      >
                        Adicionar Vídeo
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-stone-50">
                   {workVideos?.map((video) => {
                     const embedUrl = getYoutubeEmbedUrl(video.url);
                     const thumbnailUrl = getYoutubeThumbnail(video.url);
                     const isPlaying = playingVideoId === video.id;

                     return (
                       <div key={video.id} className="bg-stone-50 rounded-[2.5rem] p-4 border border-stone-100 relative group">
                          <div className="aspect-video rounded-[1.5rem] overflow-hidden mb-4 bg-stone-200 flex items-center justify-center relative">
                             {embedUrl ? (
                               isPlaying ? (
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
                                       <span className="text-[10px] font-bold text-stone-400 uppercase">Sem Miniatura</span>
                                     </div>
                                   )}
                                   <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover/play:scale-110 transition-transform">
                                         <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-stone-900 border-b-[10px] border-b-transparent ml-1"></div>
                                      </div>
                                   </div>
                                 </div>
                               )
                             ) : (
                               <span className="text-[10px] font-bold text-stone-400 uppercase">Link Inválido</span>
                             )}
                          </div>
                          <h4 className="text-xs font-black uppercase text-stone-800 tracking-widest ml-2 truncate">{video.title || 'Sem Título'}</h4>
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest ml-2 truncate">{video.url}</p>
                          
                          {deletingVideoId === video.id ? (
                            <div className="absolute inset-0 bg-red-600/95 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center z-20">
                               <p className="text-white font-black uppercase text-[10px] tracking-widest mb-4">Confirmar Exclusão?</p>
                               <div className="flex gap-2">
                                  <button onClick={() => handleRemoveWorkVideo(video.id)} className="px-4 py-2 bg-white text-red-600 rounded-lg font-black uppercase text-[8px] tracking-widest hover:bg-stone-100 transition-all">Sim, Excluir</button>
                                  <button 
                                    onClick={() => setDeletingVideoId(null)} 
                                    className="px-4 py-2 rounded-lg font-black uppercase text-[8px] tracking-widest hover:brightness-110 transition-all text-white"
                                    style={{ backgroundColor: 'var(--btn-cancelar)' }}
                                  >
                                    Cancelar
                                  </button>
                               </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setDeletingVideoId(video.id)} 
                              className="absolute top-6 right-6 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-black shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 hover:bg-red-600 z-10"
                              title="Excluir Vídeo"
                            >
                              ×
                            </button>
                          )}
                       </div>
                     );
                   })}
                   {(!workVideos || workVideos.length === 0) && (
                     <div className="col-span-full py-20 text-center">
                        <p className="text-stone-300 font-bold uppercase text-xs">Nenhum vídeo cadastrado.</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* CAIXA (SISTEMA COMPLETO) */}
        {viewMode === 'caixa' && (
          <div className="space-y-8 animate-fade-in">
            {/* Dashboard Financeiro do Dia */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Status do Caixa</p>
                  <div className="flex items-center gap-3">
                     <span className={`w-3 h-3 rounded-full ${activeSession ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                     <h4 className="text-2xl font-black uppercase">{activeSession ? 'Aberto' : 'Fechado'}</h4>
                  </div>
                  {activeSession ? (
                    <button onClick={handleCloseCashier} className="mt-6 w-full py-3 bg-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">Fechar Caixa</button>
                  ) : (
                    <button onClick={() => setIsCashierModalOpen(true)} className="mt-6 w-full py-3 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:brightness-110 transition-all">Abrir Caixa</button>
                  )}
               </div>
               
               <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Total de Entradas</p>
                  <h4 className="text-3xl font-black text-green-600">
                    R$ {transactions.filter(t => t.type === 'entry' && (!activeSession || t.createdAt >= activeSession.openedAt)).reduce((acc, t) => acc + t.value, 0).toFixed(2)}
                  </h4>
                  <p className="text-[8px] font-bold text-stone-300 uppercase mt-2">Recebimentos hoje</p>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Total de Saídas</p>
                  <h4 className="text-3xl font-black text-red-500">
                    R$ {transactions.filter(t => t.type === 'exit' && (!activeSession || t.createdAt >= activeSession.openedAt)).reduce((acc, t) => acc + t.value, 0).toFixed(2)}
                  </h4>
                  <p className="text-[8px] font-bold text-stone-300 uppercase mt-2">Despesas hoje</p>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Saldo em Caixa</p>
                  {activeSession ? (
                    <h4 className="text-3xl font-black text-stone-800">
                      R$ {(activeSession.initialBalance + transactions.filter(t => t.createdAt >= activeSession.openedAt).reduce((acc, t) => acc + (t.type === 'entry' ? t.value : -t.value), 0)).toFixed(2)}
                    </h4>
                  ) : (
                    <h4 className="text-3xl font-black text-stone-300">R$ 0,00</h4>
                  )}
                  <p className="text-[8px] font-bold text-stone-300 uppercase mt-2">Disponível agora</p>
               </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex gap-4">
               <button 
                 onClick={() => { setTransactionType('entry'); setIsTransactionModalOpen(true); }} 
                 disabled={!activeSession} 
                 className="flex-1 py-5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-20 transition-all"
                 style={{ backgroundColor: 'var(--btn-salvar)' }}
               >
                 <span>📥</span> Registrar Recebimento
               </button>
               <button onClick={() => { setTransactionType('exit'); setIsTransactionModalOpen(true); }} disabled={!activeSession} className="flex-1 py-5 bg-white text-stone-800 border-2 border-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-stone-50 disabled:opacity-20 transition-all">
                 <span>📤</span> Lançar Despesa
               </button>
            </div>

            {/* Histórico de Movimentações */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-stone-100 overflow-hidden">
               <div className="p-8 border-b border-stone-50 flex justify-between items-center bg-stone-50/20">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-stone-800">Fluxo de Caixa em Tempo Real</h3>
                  <div className="flex gap-4">
                     <button className="text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 underline transition-all">Relatório Completo (PDF)</button>
                  </div>
               </div>
               <table className="w-full text-left">
                  <thead className="bg-stone-50 text-[9px] font-black uppercase text-stone-400 border-b">
                    <tr>
                      <th className="p-6">Tipo</th>
                      <th className="p-6">Categoria</th>
                      <th className="p-6">Cliente / Descrição</th>
                      <th className="p-6">Método</th>
                      <th className="p-6">Status</th>
                      <th className="p-6 text-right">Valor</th>
                      <th className="p-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {transactions.slice().reverse().map(t => (
                      <tr key={t.id} className="hover:bg-stone-50/50">
                        <td className="p-6">
                           <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${t.type === 'entry' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                             {t.type === 'entry' ? '↓' : '↑'}
                           </span>
                        </td>
                        <td className="p-6 font-bold text-[10px] uppercase text-stone-400">{t.category}</td>
                        <td className="p-6">
                           <p className="text-xs font-black text-stone-800 uppercase truncate max-w-[200px]">{t.customerName || t.description}</p>
                           {t.customerName && <p className="text-[8px] text-stone-400 uppercase font-bold">{t.description}</p>}
                        </td>
                        <td className="p-6 text-[10px] font-bold text-stone-500 uppercase">{t.paymentMethod}</td>
                        <td className="p-6">
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${t.status === 'paid' ? 'bg-green-100 text-green-700' : t.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                             {t.status}
                           </span>
                        </td>
                        <td className={`p-6 text-right font-black ${t.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'exit' ? '-' : '+'} R$ {t.value.toFixed(2)}
                        </td>
                        <td className="p-6 text-right space-x-2">
                           <button onClick={() => handleDeleteTransaction(t.id)} className="text-red-400 text-xs">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* SERVIÇOS (CATÁLOGO COM GALERIA) */}
        {viewMode === 'serviços' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
               <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800">Catálogo de Serviços</h3>
               <button 
                 onClick={() => { setServiceBeingEdited({images: []}); setIsEditingService(true); }} 
                 className="px-8 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
                 style={{ backgroundColor: 'var(--btn-salvar)' }}
               >
                 + Adicionar Novo Serviço
               </button>
            </div>

            {isEditingService && (
              <form onSubmit={handleSaveService} className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest">Nome do Procedimento</label>
                    <input required className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none font-bold text-stone-800" value={serviceBeingEdited?.name || ''} onChange={e => setServiceBeingEdited({...serviceBeingEdited, name: e.target.value})} />
                 </div>
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest">Descrição Completa</label>
                    <textarea required className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none h-40 text-sm italic" value={serviceBeingEdited?.description || ''} onChange={e => setServiceBeingEdited({...serviceBeingEdited, description: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest">Preço de Venda (R$)</label>
                    <input type="number" required className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none font-black text-2xl text-stone-800" value={serviceBeingEdited?.price || 0} onChange={e => setServiceBeingEdited({...serviceBeingEdited, price: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest">Preço Promocional (Opcional)</label>
                    <input type="number" className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none font-black text-2xl text-red-500" value={serviceBeingEdited?.originalPrice || 0} onChange={e => setServiceBeingEdited({...serviceBeingEdited, originalPrice: Number(e.target.value)})} />
                 </div>
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-4 tracking-widest">Upload de Imagens (Galeria)</label>
                    <div className="flex flex-wrap gap-4">
                       {serviceBeingEdited?.images?.map((img, idx) => (
                         <div key={idx} className="w-24 h-24 rounded-2xl overflow-hidden border border-stone-100 relative group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setServiceBeingEdited({...serviceBeingEdited, images: serviceBeingEdited.images?.filter((_, i) => i !== idx)})} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-black">×</button>
                         </div>
                       ))}
                       <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors">
                          <span className="text-3xl text-stone-300">+</span>
                          <input type="file" multiple className="hidden" onChange={(e) => {
                             const files = Array.from(e.target.files || []) as File[];
                             files.forEach(f => {
                                const r = new FileReader();
                                r.onloadend = () => setServiceBeingEdited(prev => ({...prev, images: [...(prev?.images || []), r.result as string]}));
                                r.readAsDataURL(f);
                             });
                          }} />
                       </label>
                    </div>
                 </div>
                 <div className="md:col-span-2 flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsEditingService(false)} className="flex-1 py-6 bg-stone-100 text-stone-400 rounded-3xl font-black uppercase tracking-widest text-xs">Descartar</button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-6 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                      style={{ backgroundColor: 'var(--btn-salvar)' }}
                    >
                      Salvar Serviço
                    </button>
                 </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
               {services.map(s => (
                 <div key={s.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-stone-100 group">
                    <div className="h-48 bg-stone-50 rounded-[1.5rem] mb-6 overflow-hidden relative">
                       <img src={s.images[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute top-4 right-4 flex flex-col gap-2">
                          <button onClick={() => { setServiceBeingEdited(s); setIsEditingService(true); }} className="w-10 h-10 bg-white/90 backdrop-blur text-stone-800 rounded-xl shadow-lg flex items-center justify-center font-bold">✎</button>
                          <button onClick={() => handleDeleteService(s.id)} className="w-10 h-10 bg-red-500/90 backdrop-blur text-white rounded-xl shadow-lg flex items-center justify-center font-black">×</button>
                       </div>
                    </div>
                    <h4 className="font-bold text-stone-800 text-sm mb-2 uppercase tracking-tight">{s.name}</h4>
                    <div className="flex justify-between items-center mt-auto">
                       <span className="text-lg font-black text-amber-600">R$ {s.price.toFixed(2)}</span>
                       <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {viewMode === 'cupons' && (
          <div className="space-y-12 animate-fade-in">
             <form onSubmit={handleSaveCoupon} className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-stone-100">
                <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 mb-10">Gerar Novo Cupom de Desconto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 ml-2 tracking-widest">Código do Cupom</label>
                      <input name="code" className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none font-black uppercase tracking-[0.2em] text-stone-800" placeholder="EX: TOPIS20" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 ml-2 tracking-widest">Valor do Desconto</label>
                      <input name="discount" type="number" className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none font-black text-2xl text-stone-800" placeholder="0" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 ml-2 tracking-widest">Tipo de Desconto</label>
                      <select name="type" className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none font-bold text-xs uppercase text-stone-800">
                         <option value="percent">Porcentagem (%)</option>
                         <option value="fixed">Valor Fixo (R$)</option>
                      </select>
                   </div>
                </div>
                <button 
                  type="submit" 
                  className="mt-10 w-full py-6 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:brightness-110 transition-all"
                  style={{ backgroundColor: 'var(--btn-salvar)' }}
                >
                  Criar Cupom Promocional
                </button>
             </form>
             
             <div className="bg-white rounded-[3rem] shadow-xl border border-stone-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 text-[9px] font-black uppercase text-stone-400 border-b">
                    <tr>
                      <th className="p-8">Código</th>
                      <th className="p-8">Desconto</th>
                      <th className="p-8">Tipo</th>
                      <th className="p-8 text-center">Compartilhar</th>
                      <th className="p-8 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {coupons.map(c => (
                      <tr key={c.id}>
                        <td className="p-8 font-black text-stone-800 text-sm tracking-widest">{c.code}</td>
                        <td className="p-8 font-black text-green-600 text-lg">{c.discount}{c.type === 'percent' ? '%' : ''}</td>
                        <td className="p-8 text-[9px] font-black text-stone-300 uppercase tracking-widest">{c.type === 'fixed' ? 'R$ FIXO' : 'PERCENTUAL'}</td>
                        <td className="p-8">
                          <div className="flex justify-center gap-4">
                            <button 
                              onClick={() => handleShareWhatsApp(c)} 
                              title="Compartilhar no WhatsApp"
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button 
                              onClick={() => handleShareFacebook(c)} 
                              title="Compartilhar no Facebook"
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            >
                              <Share2 size={16} />
                            </button>
                            {navigator.share && (
                              <button 
                                onClick={() => handleWebShare(c)} 
                                title="Outras Redes Sociais"
                                className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all"
                              >
                                <Share2 size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleCopyOnlyLink(c)} 
                              title="Copiar apenas o Link"
                              className="p-2 bg-stone-50 text-stone-600 rounded-lg hover:bg-stone-100 transition-all"
                            >
                              <Link size={16} />
                            </button>
                            <button 
                              onClick={() => handleCopyCouponLink(c)} 
                              title="Copiar Mensagem Completa"
                              className="p-2 bg-stone-50 text-stone-600 rounded-lg hover:bg-stone-100 transition-all"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="p-8 text-right">
                          <button onClick={() => handleDeleteCoupon(c.id)} className="text-red-400 font-bold uppercase text-[10px] tracking-widest">Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* PERSONALIZAÇÃO VISUAL & CONFIGURAÇÕES */}
        {viewMode === 'personalização' && (
          <div className="space-y-12 animate-fade-in">
             <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
                <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800">Configurações & Identidade Visual</h3>
                <button onClick={handleResetColors} className="px-6 py-3 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                  Resetar para Padrão de Fábrica
                </button>
             </div>

             <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-12">
                <h3 className="text-2xl font-black uppercase text-stone-800 tracking-tighter border-b border-stone-50 pb-6">Informações da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Nome da Clínica</label>
                      <input 
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                        value={businessInfo.name || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, name: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Nome da Doutora/Proprietária</label>
                      <input 
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                        value={businessInfo.ownerName || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, ownerName: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Endereço Completo</label>
                      <input 
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                        value={businessInfo.address || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, address: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Telefone de Contato</label>
                      <input 
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                        value={businessInfo.phone || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, phone: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">E-mail de Contato</label>
                      <input 
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                        value={businessInfo.email || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, email: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Google Maps Embed URL</label>
                      <input 
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                        value={businessInfo.googleMapsUrl || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, googleMapsUrl: e.target.value})} 
                        placeholder="https://www.google.com/maps/embed?..."
                      />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Descrição da Clínica (Hero)</label>
                      <textarea 
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm h-32" 
                        value={businessInfo.description || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, description: e.target.value})} 
                      />
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-12">
                   <h3 className="text-2xl font-black uppercase text-stone-800 tracking-tighter border-b border-stone-50 pb-6">Paleta de Cores</h3>
                   <div className="space-y-10">
                      <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 block mb-4 tracking-[0.4em]">Configuração Cromática</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100">
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.primaryColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, primaryColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Cor Primária</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.primaryColor}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.headingColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, headingColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Cor dos Títulos</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.headingColor}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.bodyTextColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, bodyTextColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Texto Geral</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.bodyTextColor}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.navTextColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, navTextColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Menu Superior</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.navTextColor}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.footerTextColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, footerTextColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Cor do Rodapé</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.footerTextColor}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.heroSubtitleColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, heroSubtitleColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Subtítulo Hero</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.heroSubtitleColor}</span>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-stone-50">
                        <label className="text-[10px] font-black uppercase text-stone-400 block mb-6 tracking-[0.4em]">Cores dos Botões (Exclusivo)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100">
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.btnAdminColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, btnAdminColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Botão Painel ADM</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.btnAdminColor}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.btnLogoutColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, btnLogoutColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Botão Sair</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.btnLogoutColor}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.btnSaveColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, btnSaveColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Botão Salvar</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.btnSaveColor}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.btnCancelColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, btnCancelColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Botão Cancelar</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.btnCancelColor}</span>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-stone-50">
                        <label className="text-[10px] font-black uppercase text-stone-400 block mb-6 tracking-[0.4em]">Redes Sociais & Contato</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100">
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">WhatsApp (Link ou Número)</label>
                              <input 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                                value={businessInfo.socialLinks?.whatsapp || ''} 
                                onChange={e => onUpdateBusinessInfo({...businessInfo, socialLinks: {...businessInfo.socialLinks, whatsapp: e.target.value}})} 
                                placeholder="https://wa.me/55..."
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Instagram (Link)</label>
                              <input 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                                value={businessInfo.socialLinks?.instagram || ''} 
                                onChange={e => onUpdateBusinessInfo({...businessInfo, socialLinks: {...businessInfo.socialLinks, instagram: e.target.value}})} 
                                placeholder="https://instagram.com/..."
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Facebook (Link)</label>
                              <input 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                                value={businessInfo.socialLinks?.facebook || ''} 
                                onChange={e => onUpdateBusinessInfo({...businessInfo, socialLinks: {...businessInfo.socialLinks, facebook: e.target.value}})} 
                                placeholder="https://facebook.com/..."
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">YouTube (Link)</label>
                              <input 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                                value={businessInfo.socialLinks?.youtube || ''} 
                                onChange={e => onUpdateBusinessInfo({...businessInfo, socialLinks: {...businessInfo.socialLinks, youtube: e.target.value}})} 
                                placeholder="https://youtube.com/..."
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">TikTok (Link)</label>
                              <input 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                                value={businessInfo.socialLinks?.tiktok || ''} 
                                onChange={e => onUpdateBusinessInfo({...businessInfo, socialLinks: {...businessInfo.socialLinks, tiktok: e.target.value}})} 
                                placeholder="https://tiktok.com/@..."
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase text-stone-400 block ml-2">Kwai (Link)</label>
                              <input 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                                value={businessInfo.socialLinks?.kwai || ''} 
                                onChange={e => onUpdateBusinessInfo({...businessInfo, socialLinks: {...businessInfo.socialLinks, kwai: e.target.value}})} 
                                placeholder="https://kwai.com/..."
                              />
                           </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-stone-50">
                        <label className="text-[10px] font-black uppercase text-stone-400 block mb-6 tracking-[0.4em]">Identidade Visual & Impressão</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100">
                           <div className="space-y-4">
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block ml-2">Logo da Empresa</span>
                              <div className="flex items-center gap-6">
                                 {businessInfo.logoUrl ? (
                                   <img src={businessInfo.logoUrl} className="w-20 h-20 object-contain rounded-xl bg-white p-2 border border-stone-100 shadow-sm" referrerPolicy="no-referrer" />
                                 ) : (
                                   <div className="w-20 h-20 bg-stone-200 rounded-xl flex items-center justify-center text-stone-400 text-xs font-bold">SEM LOGO</div>
                                 )}
                                 <label className="px-6 py-3 bg-white border border-stone-200 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-stone-900 hover:text-white transition-all">
                                    Alterar Logo
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                 </label>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block ml-2">Modelo de Impressão (Prontuário)</span>
                              <select 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm"
                                value={businessInfo.printTemplateId || 'template1'}
                                onChange={e => onUpdateBusinessInfo({...businessInfo, printTemplateId: e.target.value})}
                              >
                                <option value="template1">Modelo 1: Clássico Elegante</option>
                                <option value="template2">Modelo 2: Moderno Clean</option>
                                <option value="template3">Modelo 3: Editorial Luxo</option>
                                <option value="template4">Modelo 4: Minimalista Centralizado</option>
                                <option value="template5">Modelo 5: Vintage Soft</option>
                                <option value="template6">Modelo 6: Corporativo Sério</option>
                                <option value="template7">Modelo 7: Técnico Detalhado</option>
                                <option value="template8">Modelo 8: Dark Mode Contrast</option>
                                <option value="template9">Modelo 9: Orgânico Suave</option>
                                <option value="template10">Modelo 10: Retrô Monospace</option>
                              </select>
                           </div>
                           <div className="md:col-span-2">
                              <label className="text-[9px] font-bold uppercase text-stone-400 block mb-3 tracking-[0.4em] ml-2">CNPJ / CPF da Empresa</label>
                              <input 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                                value={businessInfo.cnpj || ''} 
                                onChange={e => onUpdateBusinessInfo({...businessInfo, cnpj: e.target.value})} 
                                placeholder="00.000.000/0000-00"
                              />
                           </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-stone-50">
                        <label className="text-[10px] font-black uppercase text-stone-400 block mb-6 tracking-[0.4em]">Título Principal (Hero)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100">
                           <div className="flex items-center gap-4">
                              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" value={businessInfo.heroTitleColor || '#000000'} onChange={e => onUpdateBusinessInfo({...businessInfo, heroTitleColor: e.target.value})} />
                              <div>
                                 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Cor do Título</span>
                                 <span className="font-mono text-xs font-bold text-stone-800 uppercase">{businessInfo.heroTitleColor}</span>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block ml-2">Fonte do Título</span>
                              <select 
                                className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold outline-none shadow-sm"
                                value={businessInfo.heroTitleFont || ''}
                                onChange={e => onUpdateBusinessInfo({...businessInfo, heroTitleFont: e.target.value})}
                              >
                                <option value="'Playfair Display', serif">Playfair Display (Elegante)</option>
                                <option value="'Inter', sans-serif">Inter (Moderna)</option>
                                <option value="ui-sans-serif, system-ui">Sistema Sans-Serif</option>
                                <option value="ui-serif, Georgia">Sistema Serif</option>
                                <option value="ui-monospace, SFMono-Regular">Monoespaçada (Tech)</option>
                                <option value="'Brush Script MT', cursive">Cursiva (Manuscrita)</option>
                                <option value="'Impact', sans-serif">Impact (Forte)</option>
                              </select>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-12">
                   <h3 className="text-2xl font-black uppercase text-stone-800 tracking-tighter border-b border-stone-50 pb-6">Textos Institucionais</h3>
                   <div className="space-y-8">
                      <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 block mb-3 tracking-[0.4em]">Boas-vindas (Cabeçalho)</label>
                        <input className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-100 outline-none font-bold text-stone-800" value={businessInfo.headerWelcome || ''} onChange={e => onUpdateBusinessInfo({...businessInfo, headerWelcome: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 block mb-3 tracking-[0.4em]">Nota de Rodapé</label>
                        <input className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-100 outline-none font-bold text-stone-800" value={businessInfo.footerNote || ''} onChange={e => onUpdateBusinessInfo({...businessInfo, footerNote: e.target.value})} />
                      </div>
                   </div>
                   <button 
                     onClick={() => alert("Personalização atualizada!")} 
                     className="w-full py-8 text-white rounded-[3rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:brightness-110 transition-all"
                     style={{ backgroundColor: 'var(--btn-salvar)' }}
                   >
                     Aplicar Mudanças
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* PAGINAS SOBRE E LEGAL */}
        {viewMode === 'sobre' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
             <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-8">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-black uppercase text-stone-800 tracking-tighter border-b border-stone-50 pb-6">Conteúdo: Sobre a Clínica</h3>
                </div>
                <textarea className="w-full p-8 bg-stone-50 border-2 border-stone-100 rounded-[3rem] font-medium text-stone-800 outline-none h-[400px]" value={businessInfo.aboutContent || ''} onChange={e => onUpdateBusinessInfo({...businessInfo, aboutContent: e.target.value})} />
                <button 
                  onClick={() => alert("Página Sobre atualizada!")} 
                  className="w-full py-8 text-white rounded-[4rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:brightness-110 transition-all"
                  style={{ backgroundColor: 'var(--btn-salvar)' }}
                >
                  Salvar
                </button>
             </div>
          </div>
        )}

        {viewMode === 'legal' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
             <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-8">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-black uppercase text-stone-800 tracking-tighter border-b border-stone-50 pb-6">Conteúdo: Garantias & Responsabilidade</h3>
                </div>
                <textarea className="w-full p-8 bg-stone-50 border-2 border-stone-100 rounded-[3rem] font-medium text-stone-800 outline-none h-[400px]" value={businessInfo.legalContent || ''} onChange={e => onUpdateBusinessInfo({...businessInfo, legalContent: e.target.value})} />
                <button 
                  onClick={() => alert("Página Legal atualizada!")} 
                  className="w-full py-8 text-white rounded-[4rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:brightness-110 transition-all"
                  style={{ backgroundColor: 'var(--btn-salvar)' }}
                >
                  Salvar
                </button>
             </div>
          </div>
        )}

        {/* CONFIGURAÇÕES DE ACESSO - CREDENCIAIS MASTER */}
        {viewMode === 'configurações' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
             <div className="bg-white p-16 rounded-[5rem] shadow-2xl border border-stone-100 space-y-12">
                <div className="text-center">
                  <h3 className="text-4xl font-black uppercase text-stone-800 tracking-tighter border-b border-stone-50 pb-8 mb-8">Credenciais Master</h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em] mb-4">Atenção: Estas são as credenciais para acesso total ao sistema.</p>
                </div>
                <div className="space-y-10">
                   <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 block mb-3 tracking-[0.4em] ml-6">E-mail Administrativo Master</label>
                      <input 
                        className="w-full p-8 bg-stone-50 border-2 border-stone-100 rounded-[3rem] font-bold text-stone-800 outline-none focus:border-stone-900 transition-all" 
                        value={businessInfo.email || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, email: e.target.value})} 
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 block mb-3 tracking-[0.4em] ml-6">Senha Administrativa Master</label>
                      <input 
                        type="password"
                        className="w-full p-8 bg-stone-50 border-2 border-stone-100 rounded-[3rem] font-bold text-stone-800 outline-none focus:border-stone-900 transition-all" 
                        value={businessInfo.adminPassword || ''} 
                        onChange={e => onUpdateBusinessInfo({...businessInfo, adminPassword: e.target.value})} 
                        placeholder="Nova senha master"
                      />
                   </div>
                   <button 
                     onClick={() => alert("Credenciais administrativas atualizadas!")} 
                     className="w-full py-8 text-white rounded-[4rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:brightness-110 transition-all"
                     style={{ backgroundColor: 'var(--btn-salvar)' }}
                   >
                     Salvar Credenciais Master
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>

      {/* MODAL DE PRONTUÁRIO */}
      {selectedUserForAnamnesis && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden animate-scale-in my-8">
            <div className="p-8 md:p-12 border-b border-stone-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-stone-50/50">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-stone-900 rounded-3xl flex items-center justify-center text-white text-2xl font-black">
                  {selectedUserForAnamnesis.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800">{selectedUserForAnamnesis.name}</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Visualizando Prontuário</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => setIsEditingAnamnesis(!isEditingAnamnesis)}
                  className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isEditingAnamnesis ? 'bg-stone-800 text-white' : 'bg-white text-stone-800 border border-stone-100 hover:bg-stone-50'}`}
                >
                  {isEditingAnamnesis ? 'Cancelar Edição' : 'Editar Prontuário'}
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center gap-2"
                >
                  <Printer size={14} />
                  Imprimir
                </button>
                <button 
                  onClick={() => {
                    setSelectedUserForAnamnesis(null);
                    setIsEditingAnamnesis(false);
                  }} 
                  className="px-8 py-4 bg-white text-stone-400 border border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="p-8 md:p-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {isEditingAnamnesis ? (
                <AnamnesisForm 
                  user={selectedUserForAnamnesis} 
                  initialData={selectedUserForAnamnesis.anamnesis} 
                  isAdminMode={true}
                  onComplete={handleSaveAnamnesis}
                />
              ) : (
                <div className="space-y-12">
                  {selectedUserForAnamnesis.anamnesis ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-50 pb-2">Informações Básicas</h4>
                           <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-[9px] font-bold text-stone-300 uppercase">CPF</p>
                                <p className="font-bold text-stone-800">{selectedUserForAnamnesis.anamnesis.cpf}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-stone-300 uppercase">Data Nasc.</p>
                                <p className="font-bold text-stone-800">{selectedUserForAnamnesis.anamnesis.birthDate}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-stone-300 uppercase">Telefone</p>
                                <p className="font-bold text-stone-800">{selectedUserForAnamnesis.anamnesis.phone}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-stone-300 uppercase">Ocupação</p>
                                <p className="font-bold text-stone-800">{selectedUserForAnamnesis.anamnesis.occupation}</p>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-50 pb-2">Queixa Principal</h4>
                           <p className="text-sm font-medium text-stone-600 italic bg-stone-50 p-6 rounded-3xl border border-stone-100">
                             "{selectedUserForAnamnesis.anamnesis.mainComplaint}"
                           </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                         <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-50 pb-2">Avaliação Estética</h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                               <p className="text-[9px] font-bold text-stone-300 uppercase mb-1">Tipo de Pele</p>
                               <p className="text-xs font-black text-stone-800 uppercase">{selectedUserForAnamnesis.anamnesis.skinType}</p>
                            </div>
                            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                               <p className="text-[9px] font-bold text-stone-300 uppercase mb-1">Fitzpatrick</p>
                               <p className="text-xs font-black text-stone-800 uppercase">{selectedUserForAnamnesis.anamnesis.fitzpatrick}</p>
                            </div>
                            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                               <p className="text-[9px] font-bold text-stone-300 uppercase mb-1">Peso Inicial</p>
                               <p className="text-xs font-black text-stone-800 uppercase">{selectedUserForAnamnesis.anamnesis.initialWeight} kg</p>
                            </div>
                            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                               <p className="text-[9px] font-bold text-stone-300 uppercase mb-1">Altura</p>
                               <p className="text-xs font-black text-stone-800 uppercase">{selectedUserForAnamnesis.anamnesis.height} m</p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-50 pb-2">Medidas Antropométricas</h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {Object.entries(selectedUserForAnamnesis.anamnesis.measurements).map(([key, val]) => (
                              <div key={key} className="p-4 bg-white rounded-2xl border border-stone-100 shadow-sm text-center">
                                 <p className="text-[8px] font-bold text-stone-300 uppercase mb-1">{key}</p>
                                 <p className="text-sm font-black text-stone-800">{val || '-'} <span className="text-[8px] text-stone-400">cm</span></p>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-50 pb-2">Observações e Evolução</h4>
                         <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                            <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{selectedUserForAnamnesis.anamnesis.observations || 'Nenhuma observação registrada.'}</p>
                         </div>
                      </div>

                      <div className="flex justify-between items-center pt-8 border-t border-stone-50">
                         <div>
                            <p className="text-[9px] font-bold text-stone-300 uppercase">Preenchido em</p>
                            <p className="text-xs font-black text-stone-800">{selectedUserForAnamnesis.anamnesis.filledAt || 'N/A'}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-bold text-stone-300 uppercase">Assinatura Digital</p>
                            <p className="text-xl font-serif italic text-stone-800">{selectedUserForAnamnesis.name}</p>
                         </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-stone-400 font-bold uppercase tracking-widest text-sm">Este paciente ainda não preencheu o prontuário.</p>
                      <button 
                        onClick={() => setIsEditingAnamnesis(true)}
                        className="mt-6 px-8 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all"
                      >
                        Criar Prontuário Agora
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PREVIEW DE IMPRESSÃO */}
      {isPrintPreviewOpen && selectedUserForAnamnesis && selectedUserForAnamnesis.anamnesis && (
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-scale-in my-8">
            <div className="p-8 border-b border-stone-50 flex justify-between items-center bg-stone-50">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800">Visualização de Impressão</h3>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Confirme o layout antes de imprimir</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={executePrint}
                  className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center gap-2"
                >
                  <Printer size={14} />
                  Confirmar e Imprimir
                </button>
                <button 
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="px-8 py-3 bg-white text-stone-400 border border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all"
                >
                  Voltar
                </button>
              </div>
            </div>

            <div className="p-12 max-h-[70vh] overflow-y-auto bg-stone-200/50">
              <div id="printable-area" className="bg-white shadow-2xl mx-auto p-12 print-container" style={{ width: '210mm', minHeight: '297mm' }}>
                <div className="header-accent mb-12 flex justify-between items-start">
                   <div className="space-y-4">
                      {businessInfo.logoUrl && (
                        <img src={businessInfo.logoUrl} className="h-24 object-contain" referrerPolicy="no-referrer" />
                      )}
                      <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">{businessInfo.name}</h1>
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">{businessInfo.ownerName}</p>
                      </div>
                   </div>
                   <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Informações da Clínica</p>
                      <p className="text-xs font-medium">{businessInfo.address}</p>
                      <p className="text-xs font-medium">{businessInfo.phone}</p>
                      <p className="text-xs font-medium">{businessInfo.email}</p>
                      {businessInfo.cnpj && <p className="text-xs font-black">CNPJ: {businessInfo.cnpj}</p>}
                   </div>
                </div>

                <div className="text-center mb-12">
                   <h2 className="text-2xl font-black uppercase tracking-widest border-y-2 border-stone-100 py-4">Prontuário de Estética Avançada</h2>
                   <p className="text-[10px] font-bold text-stone-400 mt-2">DOCUMENTO CONFIDENCIAL - USO PROFISSIONAL</p>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                   <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest border-b border-stone-100 pb-2">Identificação</h3>
                      <div className="space-y-2 text-sm">
                         <p><span className="font-bold uppercase text-[10px] text-stone-400">Paciente:</span> {selectedUserForAnamnesis.name}</p>
                         <p><span className="font-bold uppercase text-[10px] text-stone-400">CPF:</span> {selectedUserForAnamnesis.anamnesis.cpf}</p>
                         <p><span className="font-bold uppercase text-[10px] text-stone-400">Data Nasc:</span> {selectedUserForAnamnesis.anamnesis.birthDate}</p>
                         <p><span className="font-bold uppercase text-[10px] text-stone-400">Telefone:</span> {selectedUserForAnamnesis.anamnesis.phone}</p>
                         <p><span className="font-bold uppercase text-[10px] text-stone-400">Ocupação:</span> {selectedUserForAnamnesis.anamnesis.occupation}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest border-b border-stone-100 pb-2">Queixa Principal</h3>
                      <p className="text-sm italic text-stone-600 leading-relaxed">"{selectedUserForAnamnesis.anamnesis.mainComplaint}"</p>
                   </div>
                </div>

                <div className="mb-12">
                   <h3 className="text-sm font-black uppercase tracking-widest border-b border-stone-100 pb-2 mb-6">Avaliação Física & Medidas</h3>
                   <div className="grid grid-cols-4 gap-4 mb-8">
                      <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                         <p className="text-[8px] font-bold text-stone-400 uppercase">Tipo de Pele</p>
                         <p className="text-xs font-black uppercase">{selectedUserForAnamnesis.anamnesis.skinType}</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                         <p className="text-[8px] font-bold text-stone-400 uppercase">Fitzpatrick</p>
                         <p className="text-xs font-black uppercase">{selectedUserForAnamnesis.anamnesis.fitzpatrick}</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                         <p className="text-[8px] font-bold text-stone-400 uppercase">Peso Inicial</p>
                         <p className="text-xs font-black uppercase">{selectedUserForAnamnesis.anamnesis.initialWeight} kg</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                         <p className="text-[8px] font-bold text-stone-400 uppercase">Altura</p>
                         <p className="text-xs font-black uppercase">{selectedUserForAnamnesis.anamnesis.height} m</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-4 gap-4">
                      {Object.entries(selectedUserForAnamnesis.anamnesis.measurements).map(([key, val]) => (
                        <div key={key} className="border-b border-stone-50 py-2 flex justify-between items-center">
                           <span className="text-[9px] font-bold text-stone-400 uppercase">{key}:</span>
                           <span className="text-xs font-black">{val || '-'} cm</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mb-12">
                   <h3 className="text-sm font-black uppercase tracking-widest border-b border-stone-100 pb-2 mb-4">Observações e Evolução</h3>
                   <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selectedUserForAnamnesis.anamnesis.observations || 'Nenhuma observação registrada.'}</p>
                </div>

                <div className="mt-20 pt-12 border-t-2 border-stone-900 flex justify-between items-end">
                   <div className="text-center w-64">
                      <div className="border-b border-stone-300 mb-2"></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">{selectedUserForAnamnesis.name}</p>
                      <p className="text-[8px] text-stone-400 uppercase">Assinatura do Paciente</p>
                   </div>
                   <div className="text-center w-64">
                      <div className="border-b border-stone-300 mb-2"></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">{businessInfo.ownerName}</p>
                      <p className="text-[8px] text-stone-400 uppercase">Responsável Técnico</p>
                   </div>
                </div>

                <div className="mt-12 text-center">
                   <p className="text-[8px] text-stone-300 uppercase tracking-[0.5em]">Gerado em {new Date().toLocaleString('pt-BR')} | {businessInfo.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUserModalOpen && selectedUserForEdit && (
        <div className="fixed inset-0 bg-stone-900/90 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-12 rounded-[4rem] w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-10">
              <div className="text-center">
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Editar Paciente</h2>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest block mb-2">Nome Completo</label>
                    <input className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" value={selectedUserForEdit.name} onChange={e => setSelectedUserForEdit({...selectedUserForEdit, name: formatName(e.target.value)})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest block mb-2">E-mail</label>
                    <input className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" value={selectedUserForEdit.email} onChange={e => setSelectedUserForEdit({...selectedUserForEdit, email: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest block mb-2">CPF</label>
                    <input className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" value={selectedUserForEdit.cpf || ''} onChange={e => setSelectedUserForEdit({...selectedUserForEdit, cpf: formatCPF(e.target.value)})} maxLength={14} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest block mb-2">Telefone</label>
                    <input className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" value={selectedUserForEdit.phone || ''} onChange={e => setSelectedUserForEdit({...selectedUserForEdit, phone: formatPhone(e.target.value)})} maxLength={16} />
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-red-400">Cancelar</button>
                  <button type="submit" className="flex-[2] py-5 bg-stone-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl">Salvar Alterações</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {isCashierModalOpen && (
        <div className="fixed inset-0 bg-stone-900/90 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-12 rounded-[4rem] w-full max-w-md shadow-2xl space-y-10">
              <div className="text-center">
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Abertura de Caixa</h2>
              </div>
              <form onSubmit={handleOpenCashier} className="space-y-8">
                 <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-3 tracking-[0.2em] ml-2">Saldo Inicial (R$)</label>
                    <input name="initialBalance" type="number" required defaultValue="0.00" className="w-full p-8 bg-stone-50 border-2 border-stone-100 rounded-[2.5rem] font-black text-4xl text-center text-stone-800 outline-none" />
                 </div>
                 <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsCashierModalOpen(false)} 
                      className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all"
                      style={{ color: 'var(--btn-cancelar)' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-5 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:brightness-110 transition-all"
                      style={{ backgroundColor: 'var(--btn-salvar)' }}
                    >
                      Abrir Caixa
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-stone-900/90 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-12 rounded-[4rem] w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-10">
                 <h2 className="text-3xl font-black uppercase tracking-tighter">{transactionType === 'entry' ? 'Novo Recebimento' : 'Nova Despesa'}</h2>
              </div>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest">Valor do Lançamento (R$)</label>
                    <input name="value" type="number" step="0.01" required className="w-full p-6 bg-stone-50 border-2 border-stone-100 rounded-[2.5rem] font-black text-4xl text-center text-stone-800 outline-none" placeholder="0,00" />
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest ml-4">Categoria</label>
                    <select name="category" required className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold uppercase">
                       <option value="Procedimento">Procedimento</option>
                       <option value="Venda de Produto">Venda de Produto</option>
                       <option value="Aluguel">Aluguel</option>
                       <option value="Salários">Salários</option>
                       <option value="Marketing">Marketing</option>
                       <option value="Manutenção">Manutenção</option>
                       <option value="Outros">Outros</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest ml-4">Método de Pagamento</label>
                    <select name="paymentMethod" required className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold uppercase">
                       {paymentMethods.map(m => (
                         <option key={m.id} value={m.name}>{m.name}</option>
                       ))}
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest ml-4">Data do Lançamento</label>
                    <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" />
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest ml-4">Status</label>
                    <select name="status" required className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold uppercase">
                       <option value="paid">Pago / Recebido</option>
                       <option value="pending">Pendente</option>
                       <option value="partial">Parcial</option>
                    </select>
                 </div>

                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest ml-4">Cliente / Fornecedor (Opcional)</label>
                    <input name="customerName" className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold" placeholder="Nome do cliente ou fornecedor" />
                 </div>

                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest ml-4">Descrição / Observação</label>
                    <textarea name="description" required className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-xs font-bold h-24" placeholder="Detalhes do lançamento..."></textarea>
                 </div>

                 <div className="md:col-span-2 flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setIsTransactionModalOpen(false)} 
                      className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all"
                      style={{ color: 'var(--btn-cancelar)' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-5 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:brightness-110 transition-all"
                      style={{ backgroundColor: 'var(--btn-salvar)' }}
                    >
                      Confirmar
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modal de Confirmação Customizado */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 animate-scale-up">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${
              confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 
              confirmModal.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
              'bg-blue-100 text-blue-600'
            }`}>
              <span className="text-2xl">
                {confirmModal.type === 'danger' ? '⚠️' : confirmModal.type === 'warning' ? '🔔' : 'ℹ️'}
              </span>
            </div>
            <h3 className="text-xl font-black text-center text-stone-800 uppercase tracking-tighter mb-2">{confirmModal.title}</h3>
            <p className="text-stone-500 text-center text-sm font-medium mb-8 leading-relaxed whitespace-pre-line">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={closeConfirm}
                className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-400 hover:bg-stone-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg ${
                  confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 
                  confirmModal.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 
                  'bg-stone-900 hover:bg-stone-800'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          table { width: 100% !important; border-collapse: collapse; }
          th, td { border: 1px solid #eee !important; padding: 12px !important; font-size: 10px !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminPortal;
