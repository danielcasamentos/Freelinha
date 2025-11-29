
export interface Review {
  reviewerName: string;
  rating: number;
  comment: string;
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
