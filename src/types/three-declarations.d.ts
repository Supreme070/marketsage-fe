declare module 'three/examples/jsm/controls/OrbitControls' {
  import { type Camera, Object3D } from 'three';
  
  export class OrbitControls {
    constructor(camera: Camera, domElement?: HTMLElement);
    
    enableDamping: boolean;
    dampingFactor: number;
    rotateSpeed: number;
    minDistance: number;
    maxDistance: number;
    
    update(): void;
    dispose(): void;
  }
} 