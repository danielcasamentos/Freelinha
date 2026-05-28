
export interface RatingMetrics {
  qualidadeTecnica: number;
  pontualidade: number;
  comunicacao: number;
  posturaSet: number;
  equipamento: number;
  prazos: number;
  confiabilidade: number;
  trabalhoEquipe: number;
  resolucaoProblemas: number;
  comprometimento: number;
}

export interface Review {
  reviewerName: string;
  rating: number; // General rating (1-5)
  metrics?: RatingMetrics; // Detailed breakdown
  comment: string;
  showComment: boolean; // User can hide the text, but not the rating
  date: string;
}

export interface PortfolioLinks {
  instagram?: string;
  vimeo?: string;
  website?: string;
  linkedin?: string;
}

export interface CustomService {
  name: string;
  price: string;
}

export interface Freelancer {
  id: string;
  username: string;
  nomeCompleto: string;
  funcoes: string[]; // Kept for backward compatibility, usually contains [MainRole]
  specialties: string[]; // New field for tags (Social, Agro, etc)
  regiao: string;
  bio: string;
  portfolioLinks: PortfolioLinks;
  whatsapp?: string;
  faixaValor: string; // Display string
  currency: 'BRL' | 'USD' | 'EUR';
  minPrice: number; // For filtering
  maxPrice: number; // For filtering
  services: CustomService[];
  disponibilidade: 'Disponível' | 'Ocupado';
  rate: number;
  jobsCount: number;
  avatarUrl: string;
  reviews: Review[];
  coordinates?: { lat: number; lng: number };
}

export interface Message {
  id: string;
  senderId: string; // 'me' or freelancerId
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface User {
  id: string;
  username: string;
  nomeCompleto: string;
  avatarUrl: string;
  role: string;
  isPro: boolean;
}

export interface JobVacancy {
  id: string;
  title: string;
  type: string; // e.g., 'Casamento', 'Publicidade'
  role: string; // e.g., 'Fotógrafo'
  location: string;
  coordinates?: { lat: number; lng: number };
  value: string;
  description: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  status: 'Open' | 'Matched' | 'Completed';
}

export interface Match {
  id: string;
  jobId: string;
  freelancerId: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}
