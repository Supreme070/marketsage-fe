const fs = require('fs');
const path = require('path');

// Simple GeoJSON to SVG path converter
function coordinatesToPath(coordinates, type = 'Polygon') {
  if (type === 'Polygon') {
    return coordinates.map(ring => {
      return ring.map((coord, index) => {
        const [lng, lat] = coord;
        // Simple projection (you might want to use a proper map projection)
        const x = (lng + 180) * (800 / 360);
        const y = (90 - lat) * (600 / 180);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ') + ' Z';
    }).join(' ');
  } else if (type === 'MultiPolygon') {
    return coordinates.map(polygon => 
      coordinatesToPath(polygon, 'Polygon')
    ).join(' ');
  }
  return '';
}

// Calculate bounding box for coordinates
function calculateBounds(coordinates, type = 'Polygon') {
  let allCoords = [];
  
  if (type === 'Polygon') {
    allCoords = coordinates.flat();
  } else if (type === 'MultiPolygon') {
    allCoords = coordinates.flat(2);
  }
  
  const lngs = allCoords.map(coord => coord[0]);
  const lats = allCoords.map(coord => coord[1]);
  
  return [
    Math.min(...lngs), // minLng
    Math.min(...lats), // minLat  
    Math.max(...lngs), // maxLng
    Math.max(...lats)  // maxLat
  ];
}

// Read the GeoJSON file
const geoJsonPath = path.join(__dirname, '../public/geo-data/africa-geojson.json');
const geoData = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

// Countries we want to extract
const targetCountries = {
  'Ghana': 'GHA',
  'Nigeria': 'NGA', 
  'Kenya': 'KEN',
  'South Africa': 'ZAF'
};

// Process each country
const processedCountries = {};

geoData.features.forEach(feature => {
  const countryName = feature.properties.name;
  
  if (targetCountries[countryName]) {
    const geometry = feature.geometry;
    const bounds = calculateBounds(geometry.coordinates, geometry.type);
    const svgPath = coordinatesToPath(geometry.coordinates, geometry.type);
    
    // Calculate center point
    const centerLng = (bounds[0] + bounds[2]) / 2;
    const centerLat = (bounds[1] + bounds[3]) / 2;
    
    processedCountries[targetCountries[countryName]] = {
      id: targetCountries[countryName].toLowerCase(),
      name: countryName,
      code: targetCountries[countryName],
      type: 'country',
      parent: 'africa',
      coordinates: {
        lat: centerLat,
        lng: centerLng,
        x: (centerLng + 180) * (800 / 360),
        y: (90 - centerLat) * (600 / 180)
      },
      bbox: bounds,
      svgPath: svgPath,
      viewBox: `${(bounds[0] + 180) * (800 / 360) - 50} ${(90 - bounds[3]) * (600 / 180) - 50} ${((bounds[2] - bounds[0]) * (800 / 360)) + 100} ${((bounds[3] - bounds[1]) * (600 / 180)) + 100}`,
      clickable: true,
      children: [] // Will be populated with states/provinces
    };
  }
});

// Enhanced Africa continent data
const africaData = {
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
  svgPath: generateAfricaSVG(), // We'll create this
  viewBox: calculateAfricaViewBox(), // Fix this to actually zoom to Africa
  clickable: true,
  children: Object.keys(processedCountries)
};

function calculateAfricaViewBox() {
  // Africa's approximate geographic bounds
  const africaBounds = [-20, -35, 50, 37]; // [minLng, minLat, maxLng, maxLat]
  
  // Convert to SVG coordinates using the same projection as countries
  const minX = (africaBounds[0] + 180) * (800 / 360) - 50; // Add padding
  const maxX = (africaBounds[2] + 180) * (800 / 360) + 50; // Add padding
  const minY = (90 - africaBounds[3]) * (600 / 180) - 50; // Add padding  
  const maxY = (90 - africaBounds[1]) * (600 / 180) + 50; // Add padding
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  return `${minX} ${minY} ${width} ${height}`;
}

function generateAfricaSVG() {
  // Extract all African countries from the GeoJSON and create a combined path
  const africanCountryIsoCodes = [
    'DZA', 'AGO', 'BEN', 'BWA', 'BFA', 'BDI', 'CMR', 'CPV', 'CAF', 'TCD', 
    'COM', 'COG', 'COD', 'CIV', 'DJI', 'EGY', 'GNQ', 'ERI', 'ETH', 'GAB', 
    'GMB', 'GHA', 'GIN', 'GNB', 'KEN', 'LSO', 'LBR', 'LBY', 'MDG', 'MWI', 
    'MLI', 'MRT', 'MUS', 'MAR', 'MOZ', 'NAM', 'NER', 'NGA', 'RWA', 'STP', 
    'SEN', 'SYC', 'SLE', 'SOM', 'ZAF', 'SSD', 'SDN', 'SWZ', 'TZA', 'TGO', 
    'TUN', 'UGA', 'ZMB', 'ZWE'
  ];
  
  let combinedPath = '';
  
  geoData.features.forEach(feature => {
    if (africanCountryIsoCodes.includes(feature.id)) {
      const svgPath = coordinatesToPath(feature.geometry.coordinates, feature.geometry.type);
      combinedPath += svgPath + ' ';
    }
  });
  
  return combinedPath.trim();
}

// Save the processed data
const outputData = {
  africa: africaData,
  countries: processedCountries
};

const outputPath = path.join(__dirname, '../public/geo-data/processed-africa.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

console.log('✅ Processed geographic data saved to:', outputPath);
console.log('📍 Countries processed:', Object.keys(processedCountries));

// Also create individual country files for easier loading
Object.entries(processedCountries).forEach(([code, data]) => {
  const countryPath = path.join(__dirname, `../public/geo-data/${code.toLowerCase()}.json`);
  fs.writeFileSync(countryPath, JSON.stringify(data, null, 2));
  console.log(`📄 Saved ${data.name} data to: ${countryPath}`);
});

console.log('🎯 Geographic data processing complete!'); 