import * as THREE from 'three';

// Define types for geographic hierarchy
export interface GeoRegionCoordinates {
  lat: number;
  lng: number;
}

export interface GeoRegion {
  id: string;
  name: string;
  type: 'continent' | 'country' | 'state' | 'city';
  parent?: string;
  center: GeoRegionCoordinates;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  // Simplified boundary points for rendering
  boundary?: GeoRegionCoordinates[];
  children?: string[];
}

// Geographic data structure
export const GEO_HIERARCHY: Record<string, GeoRegion> = {
  // Continents
  'africa': {
    id: 'africa',
    name: 'Africa',
    type: 'continent',
    center: { lat: 8.7832, lng: 34.5085 },
    boundingBox: {
      north: 37.3,
      south: -34.8,
      east: 51.4,
      west: -17.3
    },
    children: ['nigeria', 'egypt', 'kenya', 'south-africa', 'ghana']
  },
  'asia': {
    id: 'asia',
    name: 'Asia',
    type: 'continent',
    center: { lat: 34.0479, lng: 100.6197 },
    boundingBox: {
      north: 81.9,
      south: -10.5,
      east: 145.5,
      west: 25.6
    },
    children: ['japan', 'china', 'india']
  },
  'europe': {
    id: 'europe',
    name: 'Europe',
    type: 'continent',
    center: { lat: 54.5260, lng: 15.2551 },
    boundingBox: {
      north: 80.7,
      south: 34.9,
      east: 45.0,
      west: -24.0
    },
    children: ['united-kingdom', 'france', 'germany']
  },
  'north-america': {
    id: 'north-america',
    name: 'North America',
    type: 'continent',
    center: { lat: 39.8283, lng: -98.5795 },
    boundingBox: {
      north: 83.1,
      south: 7.2,
      east: -50.9,
      west: -167.5
    },
    children: ['united-states', 'canada', 'mexico']
  },
  'south-america': {
    id: 'south-america',
    name: 'South America',
    type: 'continent',
    center: { lat: -14.235, lng: -59.5435 },
    boundingBox: {
      north: 12.5,
      south: -55.9,
      east: -34.8,
      west: -81.4
    },
    children: ['brazil', 'argentina']
  },
  'oceania': {
    id: 'oceania',
    name: 'Oceania',
    type: 'continent',
    center: { lat: -22.7359, lng: 140.0188 },
    boundingBox: {
      north: 20.7,
      south: -43.6,
      east: 179.9,
      west: 105.4
    },
    children: ['australia']
  },
  
  // Countries
  'nigeria': {
    id: 'nigeria',
    name: 'Nigeria',
    type: 'country',
    parent: 'africa',
    center: { lat: 9.0820, lng: 8.6753 },
    boundingBox: {
      north: 13.9,
      south: 4.2,
      east: 14.7,
      west: 2.7
    },
    children: ['lagos', 'abuja']
  },
  'ghana': {
    id: 'ghana',
    name: 'Ghana',
    type: 'country',
    parent: 'africa',
    center: { lat: 7.9465, lng: -1.0232 },
    boundingBox: {
      north: 11.2,
      south: 4.7,
      east: 1.2,
      west: -3.3
    },
    children: ['accra']
  },
  'united-kingdom': {
    id: 'united-kingdom',
    name: 'United Kingdom',
    type: 'country',
    parent: 'europe',
    center: { lat: 55.3781, lng: -3.4360 },
    boundingBox: {
      north: 60.9,
      south: 49.9,
      east: 1.8,
      west: -8.6
    },
    children: ['london']
  },
  'united-states': {
    id: 'united-states',
    name: 'United States',
    type: 'country',
    parent: 'north-america',
    center: { lat: 37.0902, lng: -95.7129 },
    boundingBox: {
      north: 49.4,
      south: 24.5,
      east: -66.9,
      west: -125.0
    },
    children: ['new-york', 'san-francisco']
  },
  'japan': {
    id: 'japan',
    name: 'Japan',
    type: 'country',
    parent: 'asia',
    center: { lat: 36.2048, lng: 138.2529 },
    boundingBox: {
      north: 45.6,
      south: 24.2,
      east: 146.0,
      west: 122.9
    },
    children: ['tokyo']
  },
  'india': {
    id: 'india',
    name: 'India',
    type: 'country',
    parent: 'asia',
    center: { lat: 20.5937, lng: 78.9629 },
    boundingBox: {
      north: 35.5,
      south: 6.7,
      east: 97.4,
      west: 68.1
    },
    children: ['delhi']
  },
  'australia': {
    id: 'australia',
    name: 'Australia',
    type: 'country',
    parent: 'oceania',
    center: { lat: -25.2744, lng: 133.7751 },
    boundingBox: {
      north: -10.1,
      south: -43.6,
      east: 153.6,
      west: 113.1
    },
    children: ['sydney', 'melbourne']
  },
  'brazil': {
    id: 'brazil',
    name: 'Brazil',
    type: 'country',
    parent: 'south-america',
    center: { lat: -14.235, lng: -51.9253 },
    boundingBox: {
      north: 5.3,
      south: -33.8,
      east: -34.8,
      west: -73.9
    },
    children: ['rio-de-janeiro']
  },
  
  // Cities
  'lagos': {
    id: 'lagos',
    name: 'Lagos',
    type: 'city',
    parent: 'nigeria',
    center: { lat: 6.5244, lng: 3.3792 }
  },
  'abuja': {
    id: 'abuja',
    name: 'Abuja',
    type: 'city',
    parent: 'nigeria',
    center: { lat: 9.0765, lng: 7.3986 }
  },
  'accra': {
    id: 'accra',
    name: 'Accra',
    type: 'city',
    parent: 'ghana',
    center: { lat: 5.6037, lng: -0.1870 }
  },
  'london': {
    id: 'london',
    name: 'London',
    type: 'city',
    parent: 'united-kingdom',
    center: { lat: 51.5074, lng: -0.1278 }
  },
  'new-york': {
    id: 'new-york',
    name: 'New York',
    type: 'city',
    parent: 'united-states',
    center: { lat: 40.7128, lng: -74.0060 }
  },
  'san-francisco': {
    id: 'san-francisco',
    name: 'San Francisco',
    type: 'city',
    parent: 'united-states',
    center: { lat: 37.7749, lng: -122.4194 }
  },
  'tokyo': {
    id: 'tokyo',
    name: 'Tokyo',
    type: 'city',
    parent: 'japan',
    center: { lat: 35.6762, lng: 139.6503 }
  },
  'delhi': {
    id: 'delhi',
    name: 'Delhi',
    type: 'city',
    parent: 'india',
    center: { lat: 28.7041, lng: 77.1025 }
  },
  'sydney': {
    id: 'sydney',
    name: 'Sydney',
    type: 'city',
    parent: 'australia',
    center: { lat: -33.8688, lng: 151.2093 }
  },
  'melbourne': {
    id: 'melbourne',
    name: 'Melbourne',
    type: 'city',
    parent: 'australia',
    center: { lat: -37.8136, lng: 144.9631 }
  },
  'rio-de-janeiro': {
    id: 'rio-de-janeiro',
    name: 'Rio de Janeiro',
    type: 'city',
    parent: 'brazil',
    center: { lat: -22.9068, lng: -43.1729 }
  }
};

// Map from normalized names to IDs
export const GEO_NAME_TO_ID: Record<string, string> = Object.values(GEO_HIERARCHY).reduce((acc, region) => {
  acc[region.name.toLowerCase()] = region.id;
  return acc;
}, {} as Record<string, string>);

// Utility functions
export function getGeoRegionById(id: string): GeoRegion | undefined {
  return GEO_HIERARCHY[id];
}

export function getParentRegion(regionId: string): GeoRegion | undefined {
  const region = GEO_HIERARCHY[regionId];
  if (!region || !region.parent) return undefined;
  return GEO_HIERARCHY[region.parent];
}

export function getChildRegions(regionId: string): GeoRegion[] {
  const region = GEO_HIERARCHY[regionId];
  if (!region || !region.children) return [];
  return region.children.map(id => GEO_HIERARCHY[id]).filter(Boolean);
}

export function getGeoPath(regionId: string): string[] {
  const path: string[] = [];
  let currentRegion = GEO_HIERARCHY[regionId];
  
  while (currentRegion) {
    path.unshift(currentRegion.id);
    if (!currentRegion.parent) break;
    currentRegion = GEO_HIERARCHY[currentRegion.parent];
  }
  
  return path;
}

export function getRegionByName(name: string): GeoRegion | undefined {
  const normalizedName = name.toLowerCase();
  const id = GEO_NAME_TO_ID[normalizedName];
  return id ? GEO_HIERARCHY[id] : undefined;
}

// Calculate camera position for a region
export function getCameraPositionForRegion(region: GeoRegion): { 
  position: THREE.Vector3, 
  target: THREE.Vector3,
  distance: number 
} {
  const { center } = region;
  
  // Convert center to 3D position
  const phi = (90 - center.lat) * (Math.PI / 180);
  const theta = (center.lng + 180) * (Math.PI / 180);
  const radius = 2; // Globe radius
  
  // Target is the point on the globe
  const target = new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  
  // Calculate appropriate distance based on region type
  let distance = 10; // Default distance
  
  switch(region.type) {
    case 'continent':
      distance = 6;
      break;
    case 'country':
      distance = 4;
      break;
    case 'state':
      distance = 3;
      break;
    case 'city':
      distance = 2.8;
      break;
  }
  
  // Position camera at appropriate distance from target
  const position = target.clone().normalize().multiplyScalar(radius + distance);
  
  return { position, target, distance };
} 