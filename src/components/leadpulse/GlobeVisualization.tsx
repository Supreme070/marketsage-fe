'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VisitorLocation } from '@/lib/leadpulse/dataProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  GEO_HIERARCHY, 
  GeoRegion, 
  getGeoRegionById, 
  getChildRegions,
  getCameraPositionForRegion,
  getGeoPath,
  getRegionByName
} from '@/lib/leadpulse/geoHierarchy';

interface GlobeVisualizationProps {
  visitorData: VisitorLocation[];
  onSelectLocation?: (location: string) => void;
  selectedPath?: string[];
  width?: number;
  height?: number;
}

export default function GlobeVisualization({
  visitorData,
  onSelectLocation,
  selectedPath = [],
  width = 800,
  height = 500
}: GlobeVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [focusedRegion, setFocusedRegion] = useState<GeoRegion | null>(null);
  const [highlightedRegions, setHighlightedRegions] = useState<string[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const markersRef = useRef<THREE.Group | null>(null);
  const regionsRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const earthRef = useRef<THREE.Mesh | null>(null);

  // Update focused region when selectedPath changes
  useEffect(() => {
    if (selectedPath && selectedPath.length > 0) {
      const regionId = selectedPath[selectedPath.length - 1];
      const region = getGeoRegionById(regionId);
      if (region) {
        setFocusedRegion(region);
        setHighlightedRegions(selectedPath);
      }
    } else {
      setFocusedRegion(null);
      setHighlightedRegions([]);
    }
  }, [selectedPath]);

  // Initialize the 3D scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 2.6;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // Create earth sphere
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Create simplified earth material with continents
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x3373aa, // Ocean blue color
      shininess: 5
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    earthRef.current = earth;

    // Create a group for regions
    const regions = new THREE.Group();
    earth.add(regions);
    regionsRef.current = regions;

    // Draw continent outlines
    Object.values(GEO_HIERARCHY)
      .filter(region => region.type === 'continent')
      .forEach(continent => {
        const boundaryGeometry = createContinentGeometry(continent.id);
        const color = 0x50ad50; // Default color
        
        const boundaryMaterial = new THREE.LineBasicMaterial({ 
          color,
          transparent: true,
          opacity: 0.6,
          linewidth: 1
        });
        
        const boundary = new THREE.Line(boundaryGeometry, boundaryMaterial);
        boundary.userData = { 
          type: 'region',
          regionId: continent.id,
          regionType: 'continent'
        };
        
        regions.add(boundary);
      });
    
    // Function to create region geometries
    function createContinentGeometry(continentId: string) {
      const geometry = new THREE.BufferGeometry();
      
      // Get region path points (simplified for demo)
      const points = getContinentPath(continentId);
      
      // Convert points to vertices
      const vertices = points.map(p => {
        // Convert to Vector3 - this is a simplification
        return latLongToVector3(p[0], p[1], 2.05);
      });
      
      // Create geometry from vertices
      geometry.setFromPoints(vertices);
      return geometry;
    }
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Add hemisphere light to better illuminate the globe
    const hemisphereLight = new THREE.HemisphereLight(0xfffafa, 0x000000, 0.5);
    scene.add(hemisphereLight);
    
    // Create a group for markers
    const markers = new THREE.Group();
    scene.add(markers);
    markersRef.current = markers;
    
    // Add simple stars in the background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1000;
    const positions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount * 3; i += 3) {
      // Generate random positions on a sphere much larger than our earth
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Slowly rotate the earth unless focused on a region
      if (!focusedRegion && earthRef.current) {
        earthRef.current.rotation.y += 0.0005;
      }
      
      // Render scene
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        const parentWidth = mountRef.current.clientWidth;
        const parentHeight = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = parentWidth / parentHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(parentWidth, parentHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Handle mouse move for raycasting
    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current || !rendererRef.current) return;
      
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update tooltip position
      setHoverPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      
      // Check for intersections with markers and regions
      checkIntersections();
    };
    
    // Handle click for selecting a location
    const handleClick = () => {
      if (hoveredLocation && onSelectLocation) {
        onSelectLocation(hoveredLocation);
      }
    };
    
    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('click', handleClick);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('click', handleClick);
        mountRef.current.innerHTML = '';
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      // Dispose geometries and materials
      earthGeometry.dispose();
      earthMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      
      // Clean up references
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      markersRef.current = null;
      regionsRef.current = null;
      earthRef.current = null;
    };
  }, [width, height, onSelectLocation]);
  
  // Function to check for intersections with markers and regions
  const checkIntersections = () => {
    if (!cameraRef.current || !sceneRef.current) return;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Check markers first
    if (markersRef.current) {
      const markerIntersects = raycasterRef.current.intersectObjects(markersRef.current.children);
      if (markerIntersects.length > 0) {
        const intersection = markerIntersects[0];
        const markerObject = intersection.object as THREE.Mesh & { 
          userData: { city: string } 
        };
        setHoveredLocation(markerObject.userData.city);
        return;
      }
    }
    
    // Then check regions
    if (regionsRef.current) {
      const regionIntersects = raycasterRef.current.intersectObjects(regionsRef.current.children, true);
      if (regionIntersects.length > 0) {
        const intersection = regionIntersects[0];
        const regionObject = intersection.object as THREE.Mesh & { 
          userData: { regionId: string } 
        };
        
        if (regionObject.userData?.regionId) {
          const region = getGeoRegionById(regionObject.userData.regionId);
          if (region) {
            setHoveredLocation(region.name);
            return;
          }
        }
      }
    }
    
    // If no intersection, clear hover state
    setHoveredLocation(null);
  };
  
  // Update camera to focus on selected region
  useEffect(() => {
    if (!focusedRegion || !cameraRef.current || !controlsRef.current) return;
    
    const { position, target, distance } = getCameraPositionForRegion(focusedRegion);
    
    // Animate camera movement
    const startPosition = cameraRef.current.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const duration = 1000; // ms
    const startTime = Date.now();
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease in/out function
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      // Update camera position
      cameraRef.current!.position.lerpVectors(startPosition, position, easeProgress);
      
      // Update controls target
      controlsRef.current!.target.lerpVectors(startTarget, target, easeProgress);
      controlsRef.current!.update();
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
  }, [focusedRegion]);
  
  // Update region highlights
  useEffect(() => {
    if (!regionsRef.current) return;
    
    // Reset all region colors
    regionsRef.current.children.forEach(child => {
      if (child instanceof THREE.Line) {
        const material = child.material as THREE.LineBasicMaterial;
        material.color.set(0x50ad50);
        material.opacity = 0.6;
      }
    });
    
    // Highlight selected regions
    highlightedRegions.forEach(regionId => {
      regionsRef.current!.children.forEach(child => {
        if (child instanceof THREE.Line && 
            child.userData?.regionId === regionId) {
          const material = child.material as THREE.LineBasicMaterial;
          material.color.set(0xffaa00);
          material.opacity = 1;
        }
      });
    });
  }, [highlightedRegions]);
  
  // Update visitor location markers
  useEffect(() => {
    if (!markersRef.current || !sceneRef.current) return;
    
    // Clear existing markers
    while (markersRef.current.children.length > 0) {
      const object = markersRef.current.children[0];
      markersRef.current.remove(object);
      
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material: THREE.Material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    }
    
    // Add new markers for each visitor location
    visitorData.forEach(location => {
      if (!location.latitude || !location.longitude) return;
      
      // Convert lat/long to 3D position on globe
      const position = latLongToVector3(location.latitude, location.longitude, 2.05);
      
      // Create marker
      const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: location.isActive ? 0xff3333 : 0x3388ff,
        transparent: true,
        opacity: 0.8
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(position);
      
      // Store location data for interaction
      marker.userData = { city: location.city };
      
      // Add to markers group
      if (markersRef.current) {
        markersRef.current.add(marker);
      }
      
      // Add pulse effect for active locations
      if (location.isActive) {
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: 0xff3333,
          transparent: true,
          opacity: 0.4
        });
        
        const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), pulseMaterial);
        pulse.position.copy(position);
        
        // Animation for pulse
        const pulseScale = { value: 1 };
        const pulseOpacity = { value: 0.4 };
        
        const animatePulse = () => {
          // Scale up
          pulseScale.value += 0.01;
          pulse.scale.set(pulseScale.value, pulseScale.value, pulseScale.value);
          
          // Fade out
          pulseOpacity.value -= 0.005;
          (pulse.material as THREE.MeshBasicMaterial).opacity = pulseOpacity.value;
          
          // Reset when completely faded
          if (pulseOpacity.value <= 0) {
            pulseScale.value = 1;
            pulseOpacity.value = 0.4;
            (pulse.material as THREE.MeshBasicMaterial).opacity = pulseOpacity.value;
            pulse.scale.set(1, 1, 1);
          }
          
          requestAnimationFrame(animatePulse);
        };
        
        animatePulse();
        
        if (markersRef.current) {
          markersRef.current.add(pulse);
        }
      }
    });
  }, [visitorData]);
  
  // Helper function to convert latitude and longitude to 3D coordinates
  const latLongToVector3 = (lat: number, long: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (long + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  };
  
  // Helper function to get continent path (simplified)
  const getContinentPath = (continentId: string) => {
    const continentPaths: Record<string, number[][]> = {
      'africa': [
        [6, 5, 2], [10, 10, 2], [15, 6, 2], [20, 10, 2], [25, 6, 2], 
        [30, 10, 2], [25, 20, 2], [20, 30, 2], [15, 25, 2], [10, 30, 2], [6, 5, 2]
      ],
      'north-america': [
        [30, 10, 2], [40, 5, 2], [50, 10, 2], [40, 20, 2], [30, 30, 2], 
        [20, 25, 2], [25, 15, 2], [30, 10, 2]
      ],
      'south-america': [
        [35, 30, 2], [45, 25, 2], [50, 35, 2], [45, 45, 2], [35, 50, 2], 
        [25, 45, 2], [30, 35, 2], [35, 30, 2]
      ],
      'europe': [
        [50, 15, 2], [60, 10, 2], [70, 15, 2], [60, 25, 2], [50, 15, 2]
      ],
      'asia': [
        [70, 15, 2], [80, 5, 2], [90, 10, 2], [85, 20, 2], [90, 30, 2], 
        [80, 35, 2], [70, 30, 2], [65, 20, 2], [70, 15, 2]
      ],
      'oceania': [
        [85, 35, 2], [95, 30, 2], [100, 35, 2], [95, 45, 2], [85, 50, 2], 
        [75, 45, 2], [80, 35, 2], [85, 35, 2]
      ]
    };
    
    return continentPaths[continentId] || [];
  };
  
  return (
    <div className="relative w-full h-full" style={{ width, height }}>
      <div ref={mountRef} className="w-full h-full"></div>
      
      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bg-white dark:bg-gray-800 text-xs p-2 rounded shadow-md z-10 pointer-events-none"
            style={{
              left: `${hoverPosition.x}px`,
              top: `${hoverPosition.y - 40}px`,
            }}
          >
            <p className="font-medium">{hoveredLocation}</p>
            <p className="text-[10px] text-muted-foreground">Click to zoom in</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Path Breadcrumb */}
      {selectedPath && selectedPath.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 bg-black/30 backdrop-blur-sm text-white text-xs p-2 rounded flex items-center space-x-1">
          <span>Location:</span>
          {selectedPath.map((regionId, index) => {
            const region = getGeoRegionById(regionId);
            return (
              <React.Fragment key={regionId}>
                {index > 0 && <span>/</span>}
                <button 
                  className="hover:underline"
                  onClick={() => onSelectLocation && onSelectLocation(region?.name || '')}
                >
                  {region?.name || regionId}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
} 