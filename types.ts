
export interface SocialLinks {
  instagram: string;
  whatsapp: string;
  facebook: string;
  youtube: string;
}

export interface CarouselItem {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

export interface WorkVideo {
  id: string;
  url: string;
  title?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  originalPrice?: number;
  category: 'facial' | 'corporal' | 'injetaveis' | 'laser';
  images: string[];
  status: 'active' | 'paused' | 'disabled' | 'suspended';
  isKit?: boolean;
}

export interface QuickReply {
  id: string;
  keyword: string;
  response: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
  isRead: boolean;
}

export interface ChatSession {
  id: string;
  userName: string;
  userPhone: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  isActive: boolean;
}

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export interface BusinessInfo {
  name: string;
  ownerName: string; 
  address: string;
  phone: string;
  email: string;
  adminPassword?: string;
  openingHours: string;
  googleMapsUrl: string;
  description: string;
  footerNote: string;
  headerWelcome: string;
  socialLinks: SocialLinks;
  primaryColor?: string;
  headingColor?: string;
  bodyTextColor?: string;
  navTextColor?: string;
  footerTextColor?: string;
  heroSubtitleColor?: string;
  heroTitleFont?: string;
  heroTitleColor?: string;
  btnAdminColor?: string;
  btnLogoutColor?: string;
  btnSaveColor?: string;
  btnCancelColor?: string;
  isAiChatEnabled?: boolean;
  isCouponsEnabled?: boolean;
  quickReplies?: QuickReply[];
  aboutContent?: string;
  legalContent?: string;
  logoUrl?: string;
  cnpj?: string;
  printTemplateId?: string;
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  price: number;
  couponUsed?: string;
  deletionRequested?: boolean;
  changeRequested?: {
    newDate: string;
    newTime: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export interface FavoriteRecommendation {
  id: string;
  query: string;
  response: string;
  date: string;
}

export interface BodyMeasurements {
  bust: string;
  armL: string;
  armR: string;
  abdomen: string;
  waist: string;
  hip: string;
  culotte: string;
  thighL: string;
  thighR: string;
  calfL: string;
  calfR: string;
}

export interface Anamnesis {
  name: string;
  birthDate: string;
  occupation: string;
  phone: string;
  address: string;
  rg?: string;
  cpf: string;
  mainComplaint: string;
  skinType: 'normal' | 'seca' | 'oleosa' | 'mista';
  fitzpatrick: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  diabetes: boolean;
  epilepsy: boolean;
  intestinalRegular: boolean;
  treatmentAnterior: boolean;
  treatmentAnteriorSpec?: string;
  waterIntake: boolean;
  waterIntakeSpec?: string;
  alcohol: boolean;
  alcoholSpec?: string;
  sunExposure: boolean;
  sunExposureFreq?: string;
  menstruationPeriod: boolean;
  menstruationDate?: string;
  sleepQuality: boolean;
  sleepHours?: string;
  prosthesis: boolean;
  prosthesisSpec?: string;
  smoking: boolean;
  cardiacAlterations: boolean;
  pacemaker: boolean;
  pregnant: boolean;
  pregnantWeeks?: string;
  bodyCreams: boolean;
  bodyCreamsSpec?: string;
  physicalActivity: boolean;
  physicalActivitySpec?: string;
  contraceptive: boolean;
  contraceptiveSpec?: string;
  allergy: boolean;
  allergySpec?: string;
  nutrition: boolean;
  nutritionSpec?: string;
  skinProblems: boolean;
  skinProblemsSpec?: string;
  healingProblems: boolean;
  keloidHistory: boolean;
  metalImplants: boolean;
  metalImplantsSpec?: string;
  acidUsage: boolean;
  acidUsageSpec?: string;
  herpesHistory: boolean;
  oncologyHistory: boolean;
  measurements: BodyMeasurements;
  height: string;
  initialWeight: string;
  finalWeight?: string;
  observations: string;
  startDate: string;
  endDate?: string;
  signatureAccepted: boolean;
  filledAt?: string;
}

export interface EnergyCalculationLead {
  id: string;
  name: string;
  phone: string;
  tdee: number;
  goal: string;
  date: string;
}

export interface Transaction {
  id: string;
  type: 'entry' | 'exit';
  category: string;
  value: number;
  description: string;
  date: string;
  paymentMethod: string;
  customerName?: string;
  status: 'paid' | 'partial' | 'pending';
  responsible: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CashierSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  initialBalance: number;
  finalBalance?: number;
  status: 'open' | 'closed';
  responsible: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Occupation {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  cpf?: string;
  phone?: string;
  secondaryPhone?: string;
  birthDate?: string;
  role: 'admin' | 'client';
  registrationSource: 'manual' | 'google' | 'facebook';
  isProfileComplete: boolean;
  anamnesis?: Anamnesis;
  favoriteRecommendations?: FavoriteRecommendation[];
  address?: Address;
  patientType?: 'especial' | 'topissima';
}

export type ViewState = 'home' | 'services' | 'booking' | 'energy-calculator' | 'ai-consultant' | 'client-portal' | 'admin-portal' | 'profile-completion' | 'about' | 'legal';
