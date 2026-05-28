import { Freelancer, Chat, JobVacancy, User } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  username: 'dan_produtor',
  nomeCompleto: 'Daniel Azevedo',
  avatarUrl: 'https://picsum.photos/200/200?random=99',
  role: 'Produtor',
  isPro: false // Starting as free to test the paywall
};

export const MAIN_ROLES = [
  "Fotógrafo",
  "Videomaker",
  "Piloto de Drone",
  "Editor de Vídeo",
  "Assistente de Câmera",
  "Assistente de Iluminação",
  "Diretor de Cena",
  "Produtor",
  "Técnico de Som",
  "Colorista",
  "Motion Designer",
  "Maquiador/a",
  "Roteirista"
];

export const SPECIALTIES = [
  "Casamento",
  "Corporativo",
  "Agronegócio",
  "Imobiliário",
  "Debutante",
  "Aniversário Infantil",
  "Gastronomia",
  "Moda",
  "Esportes",
  "Documentário",
  "Publicidade",
  "Videoclipe",
  "Podcast",
  "Transmissão ao Vivo",
  "Institucional"
];

export const MOCK_FREELANCERS: Freelancer[] = [
  {
    id: '1',
    username: 'joao_editor',
    nomeCompleto: 'João Silva',
    funcoes: ['Editor de Vídeo'],
    specialties: ['Casamento', 'Corporativo', 'Videoclipe'],
    regiao: 'São Paulo, SP',
    bio: 'Editor com 5 anos de experiência em Premiere e DaVinci Resolve. Especialista em vídeos de casamento e corporativos.',
    portfolioLinks: {
      instagram: 'https://instagram.com',
      vimeo: 'https://vimeo.com',
    },
    whatsapp: '11999999999',
    faixaValor: 'R$ 800 - R$ 1200 / Dia',
    currency: 'BRL',
    minPrice: 800,
    maxPrice: 1200,
    services: [
      { name: 'Diária de Edição', price: 'R$ 800' },
      { name: 'Color Grading (Curta)', price: 'R$ 1200' }
    ],
    rate: 4.9,
    disponibilidade: 'Disponível',
    jobsCount: 34,
    coordinates: { lat: -23.5505, lng: -46.6333 }, // São Paulo (Centro)
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    reviews: [
      { 
        reviewerName: 'Produtora X', 
        rating: 5, 
        comment: 'Excelente entrega!', 
        showComment: true,
        date: '2023-10-15',
        metrics: {
          qualidadeTecnica: 5,
          pontualidade: 5,
          comunicacao: 4,
          posturaSet: 5,
          equipamento: 5,
          prazos: 5,
          confiabilidade: 5,
          trabalhoEquipe: 5,
          resolucaoProblemas: 4,
          comprometimento: 5
        }
      },
      { 
        reviewerName: 'Marcos Foto', 
        rating: 4.5, 
        comment: 'Muito rápido.', 
        showComment: true,
        date: '2023-09-20' 
      }
    ]
  },
  {
    id: '2',
    username: 'mari_drone',
    nomeCompleto: 'Mariana Costa',
    funcoes: ['Piloto de Drone'],
    specialties: ['Imobiliário', 'Agronegócio', 'Institucional'],
    regiao: 'Rio de Janeiro, RJ',
    bio: 'Piloto de drone certificada. Imagens aéreas cinemáticas para eventos e publicidade.',
    portfolioLinks: {
      instagram: 'https://instagram.com',
      website: 'https://example.com'
    },
    whatsapp: '21988888888',
    faixaValor: 'R$ 1000 - R$ 1500 / Dia',
    currency: 'BRL',
    minPrice: 1000,
    maxPrice: 1500,
    services: [
      { name: 'Diária Drone (Raw)', price: 'R$ 1500' }
    ],
    disponibilidade: 'Ocupado',
    rate: 4.9,
    jobsCount: 45,
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    reviews: [
      { reviewerName: 'Agência Y', rating: 5, comment: 'Imagens incríveis.', showComment: true, date: '2023-11-01' }
    ]
  },
  {
    id: '3',
    username: 'lucas_segunda',
    nomeCompleto: 'Lucas Pereira',
    funcoes: ['Fotógrafo'],
    specialties: ['Casamento', 'Documentário'],
    regiao: 'Belo Horizonte, MG',
    bio: 'Foco em fotografia documental e espontânea. Equipamento próprio (Canon R6).',
    portfolioLinks: {
      instagram: 'https://instagram.com'
    },
    faixaValor: 'R$ 600 - R$ 900 / Evento',
    currency: 'BRL',
    minPrice: 600,
    maxPrice: 900,
    services: [],
    disponibilidade: 'Disponível',
    rate: 4.6,
    jobsCount: 18,
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    reviews: []
  },
  {
    id: '4',
    username: 'ana_prod',
    nomeCompleto: 'Ana Souza',
    funcoes: ['Produtor'],
    specialties: ['Publicidade', 'Videoclipe'],
    regiao: 'Curitiba, PR',
    bio: 'Organizada e criativa. Ajudo a manter o set funcionando perfeitamente.',
    portfolioLinks: {
      linkedin: 'https://linkedin.com'
    },
    faixaValor: 'R$ 500 - R$ 800 / Dia',
    currency: 'BRL',
    minPrice: 500,
    maxPrice: 800,
    services: [],
    rate: 4.7,
    disponibilidade: 'Disponível',
    jobsCount: 12,
    coordinates: { lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    reviews: []
  },
  {
    id: '5',
    username: 'carlos_motion',
    nomeCompleto: 'Carlos Mendes',
    funcoes: ['Motion Designer'],
    specialties: ['Publicidade', 'Institucional', 'Esportes'],
    regiao: 'São Paulo, SP',
    bio: 'Animações 2D e 3D para explicar seu produto ou dar vida à sua marca.',
    portfolioLinks: {
      vimeo: 'https://vimeo.com',
      website: 'https://carlosmotion.com'
    },
    faixaValor: 'R$ 1200 - R$ 2000 / Projeto',
    currency: 'BRL',
    minPrice: 1200,
    maxPrice: 2000,
    services: [],
    disponibilidade: 'Ocupado',
    rate: 5.0,
    jobsCount: 50,
    avatarUrl: 'https://picsum.photos/200/200?random=5',
    reviews: [
      { reviewerName: 'StartUp Z', rating: 5, comment: 'Superou expectativas.', showComment: true, date: '2023-12-05' }
    ]
  },
  {
    id: '6',
    username: 'fernanda_foto',
    nomeCompleto: 'Fernanda Lima',
    funcoes: ['Fotógrafo'],
    specialties: ['Corporativo', 'Moda', 'Gastronomia'],
    regiao: 'Florianópolis, SC',
    bio: 'Retratos corporativos e fotografia de família com luz natural.',
    portfolioLinks: {
      instagram: 'https://instagram.com',
      website: 'https://nandalima.com'
    },
    faixaValor: 'R$ 1500 - R$ 2500 / Ensaio',
    currency: 'BRL',
    minPrice: 1500,
    maxPrice: 2500,
    services: [],
    rate: 4.8,
    disponibilidade: 'Indisponível',
    jobsCount: 28,
    coordinates: { lat: -23.6821, lng: -46.5953 }, // São Bernardo do Campo (SP)
    avatarUrl: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
    reviews: []
  },
  {
    id: '7',
    username: 'roberto_som',
    nomeCompleto: 'Roberto K.',
    funcoes: ['Técnico de Som'],
    specialties: ['Documentário', 'Podcast'],
    regiao: 'Porto Alegre, RS',
    bio: 'Captação de áudio cristalino para documentários e curtas.',
    portfolioLinks: {},
    faixaValor: 'R$ 700 - R$ 1000 / Diária',
    currency: 'BRL',
    minPrice: 700,
    maxPrice: 1000,
    services: [],
    disponibilidade: 'Disponível',
    rate: 4.9,
    jobsCount: 40,
    avatarUrl: 'https://picsum.photos/200/200?random=7',
    reviews: []
  },
  {
    id: '8',
    username: 'julio_agro',
    nomeCompleto: 'Julio Cesar',
    funcoes: ['Videomaker', 'Piloto de Drone'],
    specialties: ['Agronegócio', 'Institucional'],
    regiao: 'Goiânia, GO',
    bio: 'Especialista em filmagens para o setor agropecuário. Drone Mavic 3 Cine.',
    portfolioLinks: {
      instagram: 'https://instagram.com'
    },
    faixaValor: 'R$ 1500 - R$ 2500 / Dia',
    currency: 'BRL',
    minPrice: 1500,
    maxPrice: 2500,
    services: [],
    disponibilidade: 'Disponível',
    rate: 4.8,
    jobsCount: 22,
    avatarUrl: 'https://picsum.photos/200/200?random=8',
    reviews: []
  }
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'c1',
    freelancerId: '1',
    freelancerName: 'João Silva',
    freelancerAvatar: 'https://picsum.photos/200/200?random=1',
    lastMessage: 'Claro, podemos fechar a diária para o dia 15.',
    lastMessageTime: '10:30',
    unreadCount: 2,
    messages: [
      { id: 'm1', senderId: 'me', text: 'Olá João, tudo bem? Vi seu perfil no Freelinha.', timestamp: '10:00' },
      { id: 'm2', senderId: '1', text: 'Opa, tudo certo! Como posso ajudar?', timestamp: '10:05' },
      { id: 'm3', senderId: 'me', text: 'Preciso de um editor para um casamento.', timestamp: '10:10' },
      { id: 'm4', senderId: '1', text: 'Claro, podemos fechar a diária para o dia 15.', timestamp: '10:30' }
    ]
  },
  {
    id: 'c2',
    freelancerId: '2',
    freelancerName: 'Mariana Costa',
    freelancerAvatar: 'https://picsum.photos/200/200?random=2',
    lastMessage: 'Obrigada pelo contato!',
    lastMessageTime: 'Ontem',
    unreadCount: 0,
    messages: [
      { id: 'm1', senderId: 'me', text: 'Oi Mari, você tem disponibilidade para drone?', timestamp: '14:00' },
      { id: 'm2', senderId: '2', text: 'Oi! No momento estou ocupada essa semana.', timestamp: '14:20' },
      { id: 'm3', senderId: '2', text: 'Obrigada pelo contato!', timestamp: '14:21' }
    ]
  }
];

export const MOCK_VACANCIES: JobVacancy[] = [
  {
    id: 'v1',
    title: 'Edição de Vídeo para Casamento',
    type: 'Casamento',
    role: 'Editor de Vídeo',
    location: 'São Paulo, SP',
    value: 'R$ 1.200 - R$ 1.500',
    description: 'Procuro editor para realizar o corte e color grading de um casamento de 8 horas. Precisa ter experiência com estilo cinemático.',
    authorId: 'user_123',
    authorName: 'Produtora XYZ',
    createdAt: new Date().toISOString(),
    status: 'Open',
    coordinates: { lat: -23.5615, lng: -46.6560 } // Avenida Paulista, SP
  },
  {
    id: 'v2',
    title: 'Drone para Comercial de Imóvel',
    type: 'Imobiliário',
    role: 'Piloto de Drone',
    location: 'Rio de Janeiro, RJ',
    value: 'R$ 800',
    description: 'Captura de imagens aéreas de uma mansão no Joá. Necessário registro ANAC.',
    authorId: 'user_456',
    authorName: 'Imobiliária Prime',
    createdAt: '2023-12-02',
    status: 'Open'
  },
  {
    id: 'v3',
    title: 'Segundo Fotógrafo - Evento Corporativo',
    type: 'Corporativo',
    role: 'Fotógrafo',
    location: 'Belo Horizonte, MG',
    value: 'R$ 600',
    description: 'Apoio em evento de tecnologia. Entrega das fotos brutas ao final do dia.',
    authorId: 'user_789',
    authorName: 'João Diretor',
    createdAt: new Date().toISOString(),
    status: 'Open',
    coordinates: { lat: -22.9519, lng: -43.2105 } // Cristo Redentor, RJ
  }
];
