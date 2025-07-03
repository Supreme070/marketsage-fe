'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  GEO_HIERARCHY, 
  type GeoRegion, 
  getGeoRegionById, 
  getChildRegions,
  getCameraPositionForRegion,
  getGeoPath,
  getRegionByName
} from '@/lib/leadpulse/geoHierarchy';

// Debounce helper
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface ExtendedOrbitControls extends OrbitControls {
  target: THREE.Vector3;
  autoRotate: boolean;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

interface GlobeVisualizationProps {
  visitorData: VisitorLocation[];
  onSelectLocation?: (location: string) => void;
  selectedPath?: string[];
  onRegionClick?: (regionId: string) => void;
  displayRegions?: any[];
  width?: number;
  height?: number;
}

export default function GlobeVisualization({
  visitorData,
  onSelectLocation,
  selectedPath = [],
  onRegionClick,
  displayRegions = [],
  width = 800,
  height = 500
}: GlobeVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [focusedRegion, setFocusedRegion] = useState<GeoRegion | null>(null);
  const [highlightedRegions, setHighlightedRegions] = useState<string[]>([]);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<ExtendedOrbitControls | null>(null);
  const markersRef = useRef<THREE.Group | null>(null);
  const regionsRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const earthRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUserInteractionRef = useRef<number>(0);

  // Update focused region when selectedPath changes
  useEffect(() => {
    // Skip if selectedPath is undefined or null
    if (!selectedPath || !Array.isArray(selectedPath)) return;
    
    // Use a single state update to prevent multiple re-renders
    const updateStates = () => {
      if (selectedPath.length > 0) {
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
    };

    // Schedule the state update for the next frame to prevent immediate re-renders
    const timeoutId = setTimeout(updateStates, 0);
    
    return () => clearTimeout(timeoutId);
  }, [selectedPath]);

  // Debounced hover position update
  const updateHoverPosition = useCallback(
    debounce((x: number, y: number) => {
      setHoverPosition({ x, y });
    }, 16), // ~60fps
    []
  );

  // Check intersections with raycaster
  const checkIntersections = useCallback(() => {
    if (!cameraRef.current || !sceneRef.current || !markersRef.current || !regionsRef.current) return;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Check marker intersections
    const markerIntersects = raycasterRef.current.intersectObjects(markersRef.current.children, true);
    const regionIntersects = raycasterRef.current.intersectObjects(regionsRef.current.children, true);

    let newHoveredLocation = null;

    if (markerIntersects.length > 0) {
      const marker = markerIntersects[0].object;
      newHoveredLocation = marker.userData?.location || null;
    } else if (regionIntersects.length > 0) {
      const region = regionIntersects[0].object;
      newHoveredLocation = region.userData?.regionId || null;
    }

    if (newHoveredLocation !== hoveredLocation) {
      setHoveredLocation(newHoveredLocation);
    }
  }, [hoveredLocation]);

  // Handle mouse move
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!mountRef.current || !rendererRef.current) return;
    
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update tooltip position with debounce
    updateHoverPosition(event.clientX - rect.left, event.clientY - rect.top);
    
    // Check for intersections
    checkIntersections();
  }, [checkIntersections, updateHoverPosition]);

  // Handle click
  const handleClick = useCallback(() => {
    if (hoveredLocation) {
      // Check if it's a region click (for drill-down) or a city click
      const isRegion = displayRegions.some(region => region.id === hoveredLocation);
      
      if (isRegion && onRegionClick) {
        onRegionClick(hoveredLocation);
      } else if (onSelectLocation) {
        onSelectLocation(hoveredLocation);
      }
    }
  }, [hoveredLocation, onSelectLocation, onRegionClick, displayRegions]);

  // Initialize the 3D scene ONCE (camera, earth, lights, controls)
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
    const controls = new OrbitControls(camera, renderer.domElement) as ExtendedOrbitControls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 2.6;
    controls.maxDistance = 10;
    controls.autoRotate = false; // Disable built-in auto-rotate
    
    // Add event listeners for user interaction detection
    const onControlsStart = () => {
      setIsUserInteracting(true);
      lastUserInteractionRef.current = Date.now();
    };
    
    const onControlsEnd = () => {
      setIsUserInteracting(false);
      lastUserInteractionRef.current = Date.now();
    };
    
    const onControlsChange = () => {
      lastUserInteractionRef.current = Date.now();
    };
    
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('end', onControlsEnd);
    controls.addEventListener('change', onControlsChange);
    
    controlsRef.current = controls;

    // Create earth sphere
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/textures/earth_texture.jpg', 
      (texture) => {
        console.log('Earth texture loaded successfully');
        // The texture is loaded, re-render if needed
      },
      (progress) => {
        console.log('Loading earth texture...', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading earth texture:', error);
      }
    );
    
    // Create earth material with texture
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 0.5,
      transparent: false
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    earthRef.current = earth;

    // Create a group for regions (keeping for potential future region overlays)
    const regions = new THREE.Group();
    earth.add(regions);
    regionsRef.current = regions;

    // Note: Continent outlines are now provided by the Earth texture
    // The previous manual continent drawing has been removed
    
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
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Auto-rotate only when user is not interacting and hasn't interacted recently
      const timeSinceLastInteraction = Date.now() - lastUserInteractionRef.current;
      const shouldAutoRotate = !isUserInteracting && 
                              timeSinceLastInteraction > 3000; // 3 second delay after interaction
      
      if (shouldAutoRotate && earthRef.current) {
        earthRef.current.rotation.y += 0.0003; // Slower rotation
      }
      
      // Animate pulse effects for live visitors
      if (markersRef.current && (markersRef.current as any).animatePulses) {
        (markersRef.current as any).animatePulses();
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
    
    // Event listeners
    window.addEventListener('resize', handleResize);
    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('click', handleClick);
    
    // Cleanup
    return () => {
      // Remove event listeners
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('start', onControlsStart);
        controlsRef.current.removeEventListener('end', onControlsEnd);
        controlsRef.current.removeEventListener('change', onControlsChange);
      }
      
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('click', handleClick);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
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
  }, [handleMouseMove, handleClick]); // Only depends on handlers, not on data
  
  // Helper function to convert latitude and longitude to 3D coordinates
  const latLongToVector3 = (lat: number, long: number, radius: number) => {
    // Convert degrees to radians
    // Latitude: 0° at equator, +90° North Pole, -90° South Pole
    // Longitude: 0° at Prime Meridian, +180° East, -180° West
    
    // Phi: angle from North Pole (0 to PI)
    const phi = (90 - lat) * (Math.PI / 180);
    
    // Theta: angle around the equator (0 to 2*PI)
    // Normalize longitude to 0-360 range for consistent mapping
    const normalizedLong = ((long + 180) % 360 + 360) % 360;
    const theta = normalizedLong * (Math.PI / 180);
    
    // Convert spherical to Cartesian coordinates
    // X-axis points to 0° longitude, 0° latitude
    // Y-axis points to North Pole
    // Z-axis points to 90° East longitude
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
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
    let animationFrame: number;
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease in/out function
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      // Update camera position
      if (cameraRef.current) {
        cameraRef.current.position.lerpVectors(startPosition, position, easeProgress);
      }
      
      // Update controls target
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startTarget, target, easeProgress);
        controlsRef.current.update();
      }
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
    
    // Cleanup animation frame on unmount or when dependencies change
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
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
  
  // Update visitor location markers ONLY (preserves camera position)
  useEffect(() => {
    if (!markersRef.current || !sceneRef.current) return;
    
    // Clear existing markers and cleanup
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
    
    // Track all pulse objects for animation in the main loop
    const pulseObjects: Array<{
      mesh: THREE.Mesh;
      startTime: number;
      baseScale: number;
      maxScale: number;
      duration: number;
    }> = [];
    
    // Add new markers for each visitor location
    visitorData.forEach(location => {
      if (!location.latitude || !location.longitude || !markersRef.current) return;
      
      // Convert lat/long to 3D position on globe
      const position = latLongToVector3(location.latitude, location.longitude, 2.05);
      
      // Create marker
      const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: location.isActive ? 0xff4444 : 0x4488ff,
        transparent: true,
        opacity: 0.9
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(position);
      
      // Store location data for interaction
      marker.userData = { 
        location: location.city,
        city: location.city 
      };
      
      markersRef.current.add(marker);
      
      // Add enhanced pulse effect for active locations
      if (location.isActive) {
        // Create multiple pulse spheres for better visual effect
        for (let i = 0; i < 3; i++) {
          const pulseMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000, // Bright red for visibility
            transparent: true,
            opacity: 0.8 - (i * 0.2),
          });
          
          const pulse = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 + (i * 0.02), 16, 16), // Larger spheres
            pulseMaterial
          );
          pulse.position.copy(position);
          
          // Store pulse animation data
          pulseObjects.push({
            mesh: pulse,
            startTime: Date.now() + (i * 400), // Stagger the pulses
            baseScale: 1,
            maxScale: 4 + (i * 0.5), // Even larger scaling
            duration: 2000 // 2 second pulse cycle
          });
          
          markersRef.current.add(pulse);
        }
        
        // Add a brighter core for active visitors
        const coreGeometry = new THREE.SphereGeometry(0.04, 16, 16); // Larger core
        const coreMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1.0 // Full opacity
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.copy(position);
        
        // Animate the core with a gentle glow
        pulseObjects.push({
          mesh: core,
          startTime: Date.now(),
          baseScale: 1,
          maxScale: 2,
          duration: 1000 // Faster core pulse
        });
        
        markersRef.current.add(core);
      }
    });
    
    // Animation function for pulses (to be called from main render loop)
    const animatePulses = () => {
      const currentTime = Date.now();
      
      pulseObjects.forEach(pulseObj => {
        const { mesh, startTime, baseScale, maxScale, duration } = pulseObj;
        const elapsed = currentTime - startTime;
        
        if (elapsed >= 0) {
          // Calculate pulse progress (0 to 1 and back)
          const cycle = (elapsed % duration) / duration;
          const pulseProgress = Math.sin(cycle * Math.PI * 2) * 0.5 + 0.5;
          
          // Scale animation
          const scale = baseScale + (maxScale - baseScale) * pulseProgress;
          mesh.scale.set(scale, scale, scale);
          
          // Opacity animation (more visible - don't fade out as much)
          if (mesh.material instanceof THREE.MeshBasicMaterial) {
            const originalOpacity = 0.8; // Fixed base opacity
            mesh.material.opacity = originalOpacity * (1 - pulseProgress * 0.4); // Less fade out
          }
        }
      });
    };
    
    // Store animation function for cleanup
    (markersRef.current as any).animatePulses = animatePulses;
    
    // Cleanup function
    return () => {
      // Clear animation function
      if (markersRef.current) {
        (markersRef.current as any).animatePulses = null;
      }
      
      // Dispose of pulse geometries and materials
      pulseObjects.forEach(({ mesh }) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      });
    };
  }, [visitorData]); // Only depends on visitor data
  
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