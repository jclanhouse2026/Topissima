
import { Service, BusinessInfo, QuickReply } from './types';

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: 'qr1', keyword: 'preço', response: 'Nossos valores variam de R$ 150 a R$ 1.200 dependendo do protocolo. Você pode conferir a tabela completa na aba "Tratamentos" do nosso site!' },
  { id: 'qr2', keyword: 'localização', response: 'Estamos localizados na Quadra 208, Alvorada Norte 6, Lote 8, Plano Diretor Norte, Palmas - TO. Esperamos sua visita!' },
  { id: 'qr3', keyword: 'horário', response: 'Atendemos de Segunda a Sexta das 08:00 às 20:00 e aos Sábados das 09:00 às 13:00.' },
  { id: 'qr4', keyword: 'olá', response: 'Olá! Seja bem-vinda à Topíssima Estética. Como posso transformar sua beleza hoje?' }
];

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'consult-1',
    name: 'Consulta com Dra. Sônia',
    description: 'Avaliação personalizada para diagnóstico e plano de tratamento exclusivo.',
    duration: 40,
    price: 150,
    category: 'facial',
    images: ['https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800'],
    status: 'active'
  },
  {
    id: '1',
    name: 'Limpeza de Pele Fotônica',
    description: 'Extração profunda associada a LEDterapia para cicatrização e hidratação.',
    duration: 60,
    price: 180,
    category: 'facial',
    images: ['https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800'],
    status: 'active'
  }
];

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: 'Topíssima Estética',
  ownerName: 'Dra. Sônia Coimbra',
  address: 'Quadra 208, Alvorada Norte 6, Lote 8, Plano Diretor Norte, Palmas - TO',
  phone: '(63) 98138-5081',
  email: 'jclanhouse2012@hotmail.com.br',
  adminPassword: '123456',
  openingHours: 'Seg - Sex: 08:00 - 20:00 | Sáb: 09:00 - 13:00',
  googleMapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.266205934522!2d-48.330740000000005!3d-10.180425!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x933b2be03c000001%3A0x0!2zMTDCsDEwJzQ5LjUiUyA0OMKwMTknNTAuNyJX!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr',
  description: 'Referência em tratamentos de alta performance em Palmas, unindo tecnologia e o cuidado especializado da Dra. Sônia Coimbra.',
  headerWelcome: 'Bem-vinda ao Espaço Dra. Sônia Coimbra',
  footerNote: 'Topíssima Estética - Excelência em Estética Avançada.',
  primaryColor: '#b45309',
  headingColor: '#1c1917',
  bodyTextColor: '#44403c',
  navTextColor: '#1c1917',
  footerTextColor: '#ffffff',
  heroSubtitleColor: '#ffffff',
  heroTitleFont: "'Playfair Display', serif",
  heroTitleColor: '#ffffff',
  btnAdminColor: '#b45309',
  btnLogoutColor: '#ef4444',
  btnSaveColor: '#1c1917',
  btnCancelColor: '#78716c',
  socialLinks: {
    instagram: 'https://instagram.com/topissimaestetica',
    whatsapp: 'https://wa.me/5563981385081',
    facebook: 'https://facebook.com/topissimaestetica',
    youtube: 'https://youtube.com/topissimaestetica'
  },
  isAiChatEnabled: true,
  isCouponsEnabled: true,
  quickReplies: DEFAULT_QUICK_REPLIES,
  aboutContent: 'A Topíssima Estética nasceu da paixão da Dra. Sônia Coimbra por elevar a autoestima através de procedimentos baseados em ciência e tecnologia avançada. Localizada no coração de Palmas, nossa clínica oferece um ambiente acolhedor e exclusivo, focado em resultados reais e duradouros.',
  legalContent: 'GARANTIA E RESPONSABILIDADE:\n\n1. Todos os procedimentos são realizados mediante avaliação clínica prévia.\n2. Os resultados podem variar de acordo com o biotipo e disciplina de cada paciente.\n3. Cancelamentos devem ser feitos com 24h de antecedência para manutenção de crédito.\n4. Reembolsos são analisados individualmente conforme o Código de Defesa do Consumidor.'
};

export const LEGAL_TERM_TEXT = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO. Declaro estar ciente de que os procedimentos estéticos realizados pela Dra. Sônia Coimbra e sua equipe são atos de saúde. Comprometo-me a seguir todas as orientações pós-procedimento para garantir a segurança e eficácia do tratamento...`;
