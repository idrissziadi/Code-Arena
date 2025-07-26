import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function Card3D({ children, className, intensity = 15 }: Card3DProps) {
  const [transform, setTransform] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateX = (mouseY / rect.height) * intensity;
    const rotateY = -(mouseX / rect.width) * intensity;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "transition-transform duration-200 ease-out",
        className
      )}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({ children, className, glowColor = "rgba(59, 130, 246, 0.3)" }: GlowCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative transition-all duration-300",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered 
          ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor}` 
          : 'none'
      }}
    >
      {children}
    </div>
  );
}

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  speed?: number;
}

export function FloatingCard({ children, className, amplitude = 10, speed = 3 }: FloatingCardProps) {
  return (
    <div
      className={cn(
        "animate-bounce",
        className
      )}
      style={{
        animation: `float ${speed}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 2}s`
      }}
    >
      {children}
    </div>
  );
}