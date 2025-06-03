// Geographic data structures for LeadPulse visualization
export interface GeoCoord {
  lat: number;
  lng: number;
  x: number;
  y: number;
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
}

// Continent definitions
export const CONTINENTS: Record<string, GeoRegion> = {
  'north-america': {
    id: 'north-america',
    name: 'North America',
    code: 'NA',
    type: 'continent',
    coordinates: { lat: 39.8283, lng: -98.5795, x: 25, y: 28 },
    bbox: [-167.5, 7.2, -50.9, 83.1]
  },
  'south-america': {
    id: 'south-america',
    name: 'South America',
    code: 'SA',
    type: 'continent',
    coordinates: { lat: -14.235, lng: -59.5435, x: 30, y: 45 },
    bbox: [-81.4, -55.9, -34.8, 12.5]
  },
  'europe': {
    id: 'europe',
    name: 'Europe',
    code: 'EU',
    type: 'continent',
    coordinates: { lat: 54.5260, lng: 15.2551, x: 50, y: 22 },
    bbox: [-24.0, 34.9, 45.0, 80.7]
  },
  'africa': {
    id: 'africa',
    name: 'Africa',
    code: 'AF',
    type: 'continent',
    coordinates: { lat: 8.7832, lng: 34.5085, x: 51, y: 38 },
    bbox: [-17.3, -34.8, 51.4, 37.3]
  },
  'asia': {
    id: 'asia',
    name: 'Asia',
    code: 'AS',
    type: 'continent',
    coordinates: { lat: 34.0479, lng: 100.6197, x: 70, y: 30 },
    bbox: [25.6, -10.5, 145.5, 81.9]
  },
  'oceania': {
    id: 'oceania',
    name: 'Oceania',
    code: 'OC',
    type: 'continent',
    coordinates: { lat: -22.7359, lng: 140.0188, x: 83, y: 47 },
    bbox: [105.4, -43.6, 179.9, 20.7]
  }
};

// Map city to its continent and country
export const CITY_MAPPINGS: Record<string, { continent: string, country: string, region?: string }> = {
  'New York': { continent: 'north-america', country: 'united-states', region: 'east-coast' },
  'San Francisco': { continent: 'north-america', country: 'united-states', region: 'west-coast' },
  'London': { continent: 'europe', country: 'united-kingdom' },
  'Paris': { continent: 'europe', country: 'france' },
  'Berlin': { continent: 'europe', country: 'germany' },
  'Lagos': { continent: 'africa', country: 'nigeria' },
  'Cairo': { continent: 'africa', country: 'egypt' },
  'Nairobi': { continent: 'africa', country: 'kenya' },
  'Tokyo': { continent: 'asia', country: 'japan' },
  'Beijing': { continent: 'asia', country: 'china' },
  'Delhi': { continent: 'asia', country: 'india' },
  'Sydney': { continent: 'oceania', country: 'australia' },
  'Melbourne': { continent: 'oceania', country: 'australia' },
  'Rio de Janeiro': { continent: 'south-america', country: 'brazil' },
  'Buenos Aires': { continent: 'south-america', country: 'argentina' },
  'Abuja': { continent: 'africa', country: 'nigeria' },
  'Accra': { continent: 'africa', country: 'ghana' },
  'Cape Town': { continent: 'africa', country: 'south-africa' },
};

// Major cities with coordinates for the map visualization
export const CITY_COORDINATES: Record<string, GeoCoord> = {
  'New York': { lat: 40.7128, lng: -74.0060, x: 350, y: 260 },
  'San Francisco': { lat: 37.7749, lng: -122.4194, x: 250, y: 280 },
  'London': { lat: 51.5074, lng: -0.1278, x: 450, y: 230 },
  'Paris': { lat: 48.8566, lng: 2.3522, x: 460, y: 240 },
  'Berlin': { lat: 52.5200, lng: 13.4050, x: 480, y: 230 },
  'Lagos': { lat: 6.5244, lng: 3.3792, x: 450, y: 410 },
  'Cairo': { lat: 30.0444, lng: 31.2357, x: 530, y: 320 },
  'Nairobi': { lat: -1.2921, lng: 36.8219, x: 570, y: 400 },
  'Tokyo': { lat: 35.6762, lng: 139.6503, x: 830, y: 280 },
  'Beijing': { lat: 39.9042, lng: 116.4074, x: 770, y: 280 },
  'Delhi': { lat: 28.7041, lng: 77.1025, x: 680, y: 320 },
  'Sydney': { lat: -33.8688, lng: 151.2093, x: 850, y: 520 },
  'Melbourne': { lat: -37.8136, lng: 144.9631, x: 830, y: 540 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729, x: 320, y: 470 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816, x: 300, y: 510 },
  'Abuja': { lat: 9.0765, lng: 7.3986, x: 470, y: 400 },
  'Accra': { lat: 5.6037, lng: -0.1870, x: 440, y: 410 },
  'Cape Town': { lat: -33.9249, lng: 18.4241, x: 490, y: 500 },
};

// Simplified paths for continent outlines (SVG paths)
export const CONTINENT_PATHS: Record<string, string> = {
  'north-america': "M3.5,49.8l1.8-0.7l1.8-0.7h2.3l0.8,2.2l2.7,0.9l1.3,0.1l2.5-1l4.8,0.8l1,1.3l-0.9,1.2l-0.3,2.7v2.6l-2.2-1.1l-1.7-2 l-2.7-0.7h-3.4l-3,0.9l-1.4,1.2L3.5,55l-1-1.1L3,51.1L3.5,49.8z M21,46.6l-1.9-1.1l-7.1-0.2l-3.1-2.2l1.6-1.5l-1-4.2l2.2-2.5l2.9-0.7l-0.3-2l2.1-3.1l2-2.8 l2.8-0.4l4.8,0.2l-1.6-3.4l0.4-1.8l2-0.7L29,19l2.6-0.1l0.9-1.5l2.2-1.3l4.8-0.2l4.3,0.6l1.8,1l0.8-0.8l2.9,1.2l0.8,0.7 l-1.6,1.4v1.8l3.7,0.3l2.4,0.9l3-1.6l2.1,0.6",
  'south-america': "M32,47l-2.1,3.6l-2.6,0.2l-2,2.9 l-2.9,0.8l-1.2,1.8l-0.6,2.4l0.9,2.2l1.3-0.6l1.7,1.3l2,3.7l-1.2,1.4l-3.5-1.7l-1.4-2.6h-4.8l-5,0.6l2.3-2.4l0.3-3.3l-0.9-2 l-2,1",
  'europe': "M57.1,27.4l-2,0.6l-0.9,1.6l3.5,2.5l2.5,4.9l3,5l-1.6,0.7 l1.4,1.8v3.2l-1.1,2.9l-2.8,1.1l-4.2,2.7l-3.8,3.3l-2.7-0.9l2.7-3.6l3.3-1.6l-0.3-1.9l-3.7,2.1l-2,3.1",
  'africa': "M45,41l2.1,0.9l0.3,2.2l-2.1,1.1l-0.2,1.3L45,41z M57.1,27.4l-2,0.6l-0.9,1.6l3.5,2.5l2.5,4.9l3,5l-1.6,0.7 l1.4,1.8v3.2l-1.1,2.9l-2.8,1.1l-4.2,2.7l-3.8,3.3l-2.7-0.9l2.7-3.6l3.3-1.6l-0.3-1.9l-3.7,2.1l-2,3.1",
  'asia': "M89.3,13.7l0.2,2.4l-2.2,2.9l-2.1,1.4 l-3.9-0.1l-4.2,3l-4.1-0.1l-3,1.2l-1.8,2.3l-3.7,0.7l-2-1.7l-2.9-1.3l-0.1-1.9l1.5-1.1l2.6-0.2l3.4-2.6l4.6-2l2.1-1.9l2.4-1.2 l3.7-0.8l2.3,0.9l5.1-0.7L89.3,13.7z",
  'oceania': "M85,52l-1,1.3l-0.8,2.2l-2.2,0.5l-1.5,1.4l-0.2,2.6l-0.9,1.1l-0.5,2.4l-2.1,1.2l-1.7-0.8l-2.3-0.1 l-1.5-1.4l-2.4,1.2l-1.9-0.1l-2.3-2l-1.2-2.4l0.2-2.2l-0.5-1.5l0.9-1.9l0.2-2.8l1.1-2.2l2.5-1.2l1.9,2.7l2.5,0.5l1.8-0.9l2.6,0.8 l2.5-1.7l1.8,1.3l2.5,0.3l1.1,1.5L85,52z"
};

// World map simplified path
export const WORLD_MAP_PATH = "M3.5,49.8l1.8-0.7l1.8-0.7h2.3l0.8,2.2l2.7,0.9l1.3,0.1l2.5-1l4.8,0.8l1,1.3l-0.9,1.2l-0.3,2.7v2.6l-2.2-1.1l-1.7-2 l-2.7-0.7h-3.4l-3,0.9l-1.4,1.2L3.5,55l-1-1.1L3,51.1L3.5,49.8z M57.1,27.4l-2,0.6l-0.9,1.6l3.5,2.5l2.5,4.9l3,5l-1.6,0.7 l1.4,1.8v3.2l-1.1,2.9l-2.8,1.1l-4.2,2.7l-3.8,3.3l-2.7-0.9l2.7-3.6l3.3-1.6l-0.3-1.9l-3.7,2.1l-2,3.1l-2.1,3.6l-2.6,0.2l-2,2.9 l-2.9,0.8l-1.2,1.8l-0.6,2.4l0.9,2.2l1.3-0.6l1.7,1.3l2,3.7l-1.2,1.4l-3.5-1.7l-1.4-2.6h-4.8l-5,0.6l2.3-2.4l0.3-3.3l-0.9-2 l-2,1l-3.7-4.8L24,54.8l-0.4-3.5L21,46.6l-1.9-1.1l-7.1-0.2l-3.1-2.2l1.6-1.5l-1-4.2l2.2-2.5l2.9-0.7l-0.3-2l2.1-3.1l2-2.8 l2.8-0.4l4.8,0.2l-1.6-3.4l0.4-1.8l2-0.7L29,19l2.6-0.1l0.9-1.5l2.2-1.3l4.8-0.2l4.3,0.6l1.8,1l0.8-0.8l2.9,1.2l0.8,0.7 l-1.6,1.4v1.8l3.7,0.3l2.4,0.9l3-1.6l2.1,0.6l0.3,2.2l-2.1,1.1l-0.2,1.3L57.1,27.4z M89.3,13.7l0.2,2.4l-2.2,2.9l-2.1,1.4 l-3.9-0.1l-4.2,3l-4.1-0.1l-3,1.2l-1.8,2.3l-3.7,0.7l-2-1.7l-2.9-1.3l-0.1-1.9l1.5-1.1l2.6-0.2l3.4-2.6l4.6-2l2.1-1.9l2.4-1.2 l3.7-0.8l2.3,0.9l5.1-0.7L89.3,13.7z";

// Helper function to translate lat/lng to SVG coordinates
export function latLngToSvgCoords(lat: number, lng: number): { x: number, y: number } {
  // Simple linear mapping from lat/lng to SVG coordinates
  // This is a simplified version - a proper implementation would use projection
  const x = (lng + 180) * (100 / 360);
  const y = (90 - lat) * (60 / 180);
  return { x, y };
}

// Helper to get the geo hierarchy for a location
export function getGeoHierarchy(city: string): string[] {
  const mapping = CITY_MAPPINGS[city];
  if (!mapping) return [];
  
  const hierarchy = [mapping.continent];
  if (mapping.country) hierarchy.push(mapping.country);
  if (mapping.region) hierarchy.push(mapping.region);
  hierarchy.push(city);
  
  return hierarchy;
} 