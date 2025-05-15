import { useEffect, useRef, useState } from 'react';

interface ParticlesProps {
  className?: string;
  quantity?: number;
  color?: string;
  linkColor?: string;
}

const ParticlesBackground = ({
  className = "",
  quantity = 30,
  color = "#6E59A5",
  linkColor = "#F97316"
}: ParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Setup canvas and start animation when component mounts
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Handle resize
    const handleResize = () => {
      if (!canvas.parentElement) return;
      const { width, height } = canvas.parentElement.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      setDimensions({ width, height });
    };
    
    // Initial sizing
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Create particles
    const particlesArray: Particle[] = [];
    for (let i = 0; i < quantity; i++) {
      particlesArray.push(new Particle(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        (Math.random() * 1.5) + 0.5,
        color,
        canvas
      ));
    }
    
    // Animation function
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw(ctx);
      }
      
      // Draw connections
      drawConnections(particlesArray, ctx, linkColor, 150);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [quantity, color, linkColor]);
  
  return (
    <div className={`${className} absolute inset-0 overflow-hidden`}>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
};

// Particle class
class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  canvas: HTMLCanvasElement;
  
  constructor(x: number, y: number, size: number, color: string, canvas: HTMLCanvasElement) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.color = color;
    this.canvas = canvas;
  }
  
  update() {
    // Move particles
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Bounce off edges
    if (this.x > this.canvas.width || this.x < 0) {
      this.speedX = -this.speedX;
    }
    if (this.y > this.canvas.height || this.y < 0) {
      this.speedY = -this.speedY;
    }
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw connections between particles that are close to each other
function drawConnections(particles: Particle[], ctx: CanvasRenderingContext2D, color: string, maxDistance: number) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < maxDistance) {
        // Opacity based on distance
        const opacity = 1 - (distance / maxDistance);
        ctx.strokeStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

export default ParticlesBackground; 