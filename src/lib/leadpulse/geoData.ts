// Load real geographic data from processed files
let geoDataCache: any = null;

export const loadGeoData = async () => {
  if (geoDataCache) return geoDataCache;
  
  try {
    const response = await fetch('/geo-data/processed-africa.json');
    geoDataCache = await response.json();
    return geoDataCache;
  } catch (error) {
    console.error('Failed to load geographic data:', error);
    return null;
  }
};

// Enhanced geographic data structures for LeadPulse drill-down visualization
export interface GeoCoord {
  lat: number;
  lng: number;
}

export interface GeoRegion {
  id: string;
  name: string;
  code: string;
  type: 'continent' | 'country' | 'region' | 'state' | 'city';
  parent?: string;
  coordinates: GeoCoord;
  children?: string[];
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  svgPath?: string; // SVG path for boundaries
  viewBox?: string; // ViewBox for zooming
  clickable?: boolean;
}

// Get continent data
export const getContinent = async (id: string): Promise<GeoRegion | null> => {
  const data = await loadGeoData();
  return data?.africa || null;
};

// Get country data
export const getCountry = async (code: string): Promise<GeoRegion | null> => {
  const data = await loadGeoData();
  return data?.countries?.[code.toUpperCase()] || null;
};

// Get all countries in a continent
export const getCountriesInContinent = async (continentId: string): Promise<GeoRegion[]> => {
  const data = await loadGeoData();
  if (!data?.countries) return [];
  
  return Object.values(data.countries).filter(
    (country: any) => country.parent === continentId
  ) as GeoRegion[];
};

// Fallback static data for immediate rendering (will be replaced by loaded data)
export const CONTINENTS: Record<string, GeoRegion> = {
  'africa': {
    id: 'africa',
    name: 'Africa',
    code: 'AF',
    type: 'continent',
    coordinates: {
      lat: 0,
      lng: 20,
      x: 400,
      y: 300
    },
    bbox: [-20, -35, 50, 37],
    svgPath: "M 320 100 L 380 100 L 400 120 L 420 140 L 450 160 L 470 200 L 480 250 L 470 300 L 450 350 L 420 380 L 380 400 L 340 390 L 300 370 L 280 340 L 270 300 L 280 260 L 300 220 L 320 180 L 330 140 L 320 100 Z",
    viewBox: "0 0 800 600",
    clickable: true,
    children: ['GHA', 'KEN', 'NGA', 'ZAF']
  },
  'north-america': {
    id: 'north-america',
    name: 'North America',
    code: 'NA',
    type: 'continent',
    coordinates: { lat: 39.8283, lng: -98.5795, x: 25, y: 28 },
    bbox: [-167.5, 7.2, -50.9, 83.1],
    viewBox: "200 150 300 200",
    clickable: false,
    svgPath: "M200,150 L300,140 L380,160 L420,180 L450,200 L470,220 L480,240 L470,260 L450,280 L420,300 L380,320 L340,330 L300,320 L260,310 L220,290 L200,270 L190,250 L195,230 L200,210 L205,190 L210,170 Z"
  },
  'europe': {
    id: 'europe',
    name: 'Europe',
    code: 'EU',
    type: 'continent',
    coordinates: { lat: 54.5260, lng: 15.2551, x: 50, y: 22 },
    bbox: [-24.0, 34.9, 45.0, 80.7],
    viewBox: "450 180 120 100",
    clickable: false,
    svgPath: "M450,180 L500,175 L540,180 L560,190 L570,200 L575,210 L570,220 L560,230 L540,240 L520,250 L500,255 L480,250 L460,240 L450,230 L445,220 L440,210 L445,200 L450,190 Z"
  }
};

// Countries within continents - will be replaced by loaded data
export const COUNTRIES: Record<string, GeoRegion> = {
  'NGA': {
    id: 'nga',
    name: 'Nigeria',
    code: 'NGA',
    type: 'country',
    parent: 'africa',
    coordinates: {
      lat: 9.0820,
      lng: 8.6753,
      x: 385,
      y: 265
    },
    bbox: [2.7, 4.3, 14.7, 13.9],
    svgPath: "M 360 240 L 380 235 L 400 240 L 420 250 L 430 270 L 425 290 L 410 300 L 390 295 L 370 285 L 355 265 L 360 240 Z",
    viewBox: "300 200 200 150",
    clickable: true,
    children: []
  },
  'GHA': {
    id: 'gha',
    name: 'Ghana',
    code: 'GHA',
    type: 'country',
    parent: 'africa',
    coordinates: {
      lat: 7.9465,
      lng: -1.0232,
      x: 330,
      y: 275
    },
    bbox: [-3.3, 4.7, 1.2, 11.2],
    svgPath: "M 310 250 L 330 245 L 350 255 L 355 275 L 350 295 L 330 305 L 310 295 L 305 275 L 310 250 Z",
    viewBox: "280 220 100 120",
    clickable: true,
    children: []
  },
  'KEN': {
    id: 'ken',
    name: 'Kenya',
    code: 'KEN',
    type: 'country',
    parent: 'africa',
    coordinates: {
      lat: -0.0236,
      lng: 37.9062,
      x: 485,
      y: 300
    },
    bbox: [33.9, -4.7, 41.9, 5.5],
    svgPath: "M 460 280 L 480 275 L 500 285 L 510 305 L 505 325 L 485 335 L 465 325 L 455 305 L 460 280 Z",
    viewBox: "430 250 100 120",
    clickable: true,
    children: []
  },
  'ZAF': {
    id: 'zaf',
    name: 'South Africa',
    code: 'ZAF',
    type: 'country',
    parent: 'africa',
    coordinates: {
      lat: -28.4852,
      lng: 24.6098,
      x: 400,
      y: 380
    },
    bbox: [16.3, -34.8, 32.9, -22.1],
    svgPath: "M 370 360 L 430 355 L 440 375 L 435 395 L 415 410 L 385 405 L 365 385 L 370 360 Z M 390 390 L 410 385 L 415 395 L 405 405 L 390 400 L 385 395 L 390 390 Z",
    viewBox: "340 330 150 120",
    clickable: true,
    children: []
  }
};

// Enhanced city mappings with hierarchical structure
export const CITY_MAPPINGS: Record<string, { continent: string, country: string, state?: string, region?: string }> = {
  'New York': { continent: 'north-america', country: 'united-states', region: 'east-coast' },
  'San Francisco': { continent: 'north-america', country: 'united-states', region: 'west-coast' },
  'London': { continent: 'europe', country: 'united-kingdom' },
  'Paris': { continent: 'europe', country: 'france' },
  'Berlin': { continent: 'europe', country: 'germany' },
  'Lagos': { continent: 'africa', country: 'nigeria', state: 'lagos-state' },
  'Cairo': { continent: 'africa', country: 'egypt', state: 'cairo-governorate' },
  'Nairobi': { continent: 'africa', country: 'kenya', state: 'nairobi-county' },
  'Tokyo': { continent: 'asia', country: 'japan' },
  'Beijing': { continent: 'asia', country: 'china' },
  'Delhi': { continent: 'asia', country: 'india' },
  'Sydney': { continent: 'oceania', country: 'australia' },
  'Melbourne': { continent: 'oceania', country: 'australia' },
  'Rio de Janeiro': { continent: 'south-america', country: 'brazil' },
  'Buenos Aires': { continent: 'south-america', country: 'argentina' },
  'Abuja': { continent: 'africa', country: 'nigeria', state: 'kaduna-state' },
  'Accra': { continent: 'africa', country: 'ghana', state: 'greater-accra' },
  'Cape Town': { continent: 'africa', country: 'south-africa', state: 'western-cape' },
  'Johannesburg': { continent: 'africa', country: 'south-africa', state: 'gauteng' },
  'Durban': { continent: 'africa', country: 'south-africa', state: 'kwazulu-natal' },
  'Kano': { continent: 'africa', country: 'nigeria', state: 'kano-state' },
  'Port Harcourt': { continent: 'africa', country: 'nigeria', state: 'rivers-state' },
  'Kumasi': { continent: 'africa', country: 'ghana', state: 'ashanti' },
  'Mombasa': { continent: 'africa', country: 'kenya', state: 'mombasa-county' },
  'Kisumu': { continent: 'africa', country: 'kenya', state: 'kisumu-county' },
  'Alexandria': { continent: 'africa', country: 'egypt', state: 'alexandria-governorate' }
};

// Enhanced city coordinates with accurate African cities (lat/lng only - x,y calculated via projection)
export const CITY_COORDINATES: Record<string, GeoCoord> = {
  // Global cities
  'New York': { lat: 40.7128, lng: -74.0060 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Beijing': { lat: 39.9042, lng: 116.4074 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Melbourne': { lat: -37.8136, lng: 144.9631 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  
  // Enhanced African cities with verified coordinates
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Cairo': { lat: 30.0444, lng: 31.2357 },
  'Nairobi': { lat: -1.2921, lng: 36.8219 },
  'Abuja': { lat: 9.0765, lng: 7.3986 },
  'Accra': { lat: 5.6037, lng: -0.1870 },
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
  'Johannesburg': { lat: -26.2041, lng: 28.0473 },
  'Durban': { lat: -29.8587, lng: 31.0218 },
  'Kano': { lat: 11.5004, lng: 8.5200 },
  'Port Harcourt': { lat: 4.7719, lng: 6.7593 },
  'Kumasi': { lat: 6.6885, lng: -1.6244 },
  'Mombasa': { lat: -4.0435, lng: 39.6682 },
  'Kisumu': { lat: -0.1022, lng: 34.7617 },
  'Alexandria': { lat: 31.2001, lng: 29.9187 }
};

// All regions combined for easy lookup - will be enhanced with loaded data
export const ALL_REGIONS: Record<string, GeoRegion> = {
  ...CONTINENTS,
  ...COUNTRIES
};

// World map SVG path (existing)
export const WORLD_MAP_PATH = "M3.5,49.8l1.8-0.7l1.8-0.7h2.3l0.8,2.2l2.7,0.9l1.3,0.1l2.5-1l4.8,0.8l1,1.3l-0.9,1.2l-0.3,2.7v2.6l-2.2-1.1l-1.7-2 l-2.7-0.7h-3.4l-3,0.9l-1.4,1.2L3.5,55l-1-1.1L3,51.1L3.5,49.8z M57.1,27.4l-2,0.6l-0.9,1.6l3.5,2.5l2.5,4.9l3,5l-1.6,0.7 l1.4,1.8v3.2l-1.1,2.9l-2.8,1.1l-4.2,2.7l-3.8,3.3l-2.7-0.9l2.7-3.6l3.3-1.6l-0.3-1.9l-3.7,2.1l-2,3.1l-2.1,3.6l-2.6,0.2l-2,2.9 l-2.9,0.8l-1.2,1.8l-0.6,2.4l0.9,2.2l1.3-0.6l1.7,1.3l2,3.7l-1.2,1.4l-3.5-1.7l-1.4-2.6h-4.8l-5,0.6l2.3-2.4l0.3-3.3l-0.9-2 l-2,1l-3.7-4.8L24,54.8l-0.4-3.5L21,46.6l-1.9-1.1l-7.1-0.2l-3.1-2.2l1.6-1.5l-1-4.2l2.2-2.5l2.9-0.7l-0.3-2l2.1-3.1l2-2.8 l2.8-0.4l4.8,0.2l-1.6-3.4l0.4-1.8l2-0.7L29,19l2.6-0.1l0.9-1.5l2.2-1.3l4.8-0.2l4.3,0.6l1.8,1l0.8-0.8l2.9,1.2l0.8,0.7 l-1.6,1.4v1.8l3.7,0.3l2.4,0.9l3-1.6l2.1,0.6l0.3,2.2l-2.1,1.1l-0.2,1.3L57.1,27.4z M89.3,13.7l0.2,2.4l-2.2,2.9l-2.1,1.4 l-3.9-0.1l-4.2,3l-4.1-0.1l-3,1.2l-1.8,2.3l-3.7,0.7l-2-1.7l-2.9-1.3l-0.1-1.9l1.5-1.1l2.6-0.2l3.4-2.6l4.6-2l2.1-1.9l2.4-1.2 l3.7-0.8l2.3,0.9l5.1-0.7L89.3,13.7z";

// Legacy continent paths (simplified, keeping for backward compatibility)
export const CONTINENT_PATHS: Record<string, string> = {
  'africa': CONTINENTS.africa.svgPath || '',
  'north-america': CONTINENTS['north-america'].svgPath || '',
  'europe': CONTINENTS.europe.svgPath || ''
};

// Helper function to get region by ID (with real data support)
export async function getRegionById(id: string): Promise<GeoRegion | undefined> {
  // Try to get from loaded data first
  const geoData = await loadGeoData();
  if (geoData) {
    if (id === 'africa') return geoData.africa;
    if (geoData.countries[id.toUpperCase()]) return geoData.countries[id.toUpperCase()];
  }
  
  // Fallback to static data
  return ALL_REGIONS[id];
}

// Helper function to get children of a region
export async function getRegionChildren(regionId: string): Promise<GeoRegion[]> {
  const region = await getRegionById(regionId);
  if (!region?.children) return [];
  
  const children = [];
  for (const childId of region.children) {
    const child = await getRegionById(childId);
    if (child) children.push(child);
  }
  
  return children;
}

// Helper function to get the geo hierarchy for a location with enhanced lookup
export function getGeoHierarchy(city: string): string[] {
  const mapping = CITY_MAPPINGS[city];
  if (!mapping) return [];
  
  const hierarchy = [mapping.continent];
  if (mapping.country) hierarchy.push(mapping.country);
  if (mapping.state) hierarchy.push(mapping.state);
  if (mapping.region) hierarchy.push(mapping.region);
  hierarchy.push(city);
  
  return hierarchy;
}

// Helper function to get appropriate viewBox for zoom level
export async function getViewBoxForPath(path: string[]): Promise<string> {
  if (path.length === 0) return "0 0 800 600"; // World view
  
  const regionId = path[path.length - 1];
  const region = await getRegionById(regionId);
  
  return region?.viewBox || "0 0 800 600";
}

// Helper function to check if a region is clickable
export async function isRegionClickable(regionId: string): Promise<boolean> {
  const region = await getRegionById(regionId);
  return region?.clickable === true;
}

// Enhanced coordinate conversion with zoom support and proper projection
export function latLngToSvgCoords(lat: number, lng: number, viewBox?: string): { x: number, y: number } {
  // Web Mercator projection for accurate positioning
  // This prevents locations from appearing in the ocean
  
  // Convert latitude to Mercator Y coordinate
  const latRad = lat * (Math.PI / 180);
  const mercatorY = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
  
  // Normalize Mercator Y to 0-1 range (clamped to reasonable bounds)
  const maxMercatorY = Math.log(Math.tan((Math.PI / 4) + (85 * Math.PI / 360))); // Cap at 85° to avoid infinity
  const normalizedY = 0.5 - (mercatorY / (2 * maxMercatorY));
  
  // Normalize longitude to 0-1 range
  const normalizedX = (lng + 180) / 360;
  
  if (viewBox) {
    // Parse viewBox for zoomed coordinates
    const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
    const x = vx + (normalizedX * vw);
    const y = vy + (normalizedY * vh);
    return { x, y };
  }
  
  // Default world coordinates with standard map dimensions
  const mapWidth = 1000;  // Standard width for world map
  const mapHeight = 500;  // Standard height for world map
  
  const x = normalizedX * mapWidth;
  const y = normalizedY * mapHeight;
  
  return { x, y };
} 