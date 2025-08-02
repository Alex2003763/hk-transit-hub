interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export const updatePageSEO = (data: SEOData) => {
  // Update document title
  document.title = data.title;

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', data.description);
  }

  // Update keywords if provided
  if (data.keywords) {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', data.keywords);
    }
  }

  // Update Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', data.ogTitle || data.title);
  }

  // Update Open Graph description
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', data.ogDescription || data.description);
  }

  // Update Twitter title
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', data.ogTitle || data.title);
  }

  // Update Twitter description
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', data.ogDescription || data.description);
  }
};

export const SEO_TEMPLATES = {
  home: {
    title: 'HK Transit Hub - Smart Journey Planner for Hong Kong Public Transport',
    description: 'Plan your Hong Kong journey with real-time KMB bus ETAs, MTR schedules, interactive maps, and AI trip planning. Free PWA for efficient commuting.',
    keywords: 'Hong Kong transport, HK public transport, KMB bus, MTR subway, Hong Kong commute, bus ETA, journey planner, trip planner'
  },
  
  planner: {
    title: 'AI Trip Planner - HK Transit Hub',
    description: 'Plan your Hong Kong journey with AI assistance. Get smart multi-modal travel suggestions combining KMB buses and MTR trains for optimal routes.',
    keywords: 'AI trip planner, Hong Kong journey planner, smart travel, multi-modal transport, HK commute planning'
  },
  
  kmb: {
    title: 'KMB Bus Routes & Real-time ETAs - HK Transit Hub',
    description: 'Browse KMB bus routes, view stops on interactive maps, and get real-time arrival times. Complete Hong Kong bus information at your fingertips.',
    keywords: 'KMB bus, Hong Kong bus routes, bus ETA, real-time bus arrival, HK bus stops, 九巴'
  },
  
  mtr: {
    title: 'MTR Train Schedules & Station Info - HK Transit Hub',
    description: 'Access MTR train schedules, station information, and line details. Complete Hong Kong subway information for efficient travel planning.',
    keywords: 'MTR train, Hong Kong subway, MTR schedule, train times, HK metro, 港鐵'
  },
  
  settings: {
    title: 'Settings - HK Transit Hub',
    description: 'Customize your HK Transit Hub experience. Configure API keys, theme preferences, and app settings for optimal performance.',
    keywords: 'HK Transit Hub settings, app configuration, theme settings, API configuration'
  },
  
  routeDetails: (routeNumber: string, origin: string, destination: string) => ({
    title: `Route ${routeNumber}: ${origin} to ${destination} - HK Transit Hub`,
    description: `View real-time ETAs, stops, and route map for KMB bus route ${routeNumber} from ${origin} to ${destination}. Plan your Hong Kong bus journey efficiently.`,
    keywords: `KMB route ${routeNumber}, ${origin} to ${destination}, bus route map, real-time ETA, Hong Kong bus`
  })
} as const;

export const resetToDefaultSEO = () => {
  updatePageSEO(SEO_TEMPLATES.home);
};
