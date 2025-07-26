import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ 
  from = 0, 
  to, 
  duration = 2000, 
  className, 
  suffix = '',
  prefix = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (from === to) return;

    const startTime = Date.now();
    const difference = to - from;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.round(from + difference * easedProgress);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

interface DigitalCounterProps {
  value: number;
  className?: string;
  digits?: number;
}

export function DigitalCounter({ value, className, digits = 4 }: DigitalCounterProps) {
  const formattedValue = value.toString().padStart(digits, '0');

  return (
    <div className={cn("flex space-x-1 font-mono text-2xl", className)}>
      {formattedValue.split('').map((digit, index) => (
        <div
          key={index}
          className="bg-primary text-primary-foreground px-2 py-1 rounded shadow-inner relative overflow-hidden"
          style={{
            animation: `digitFlip 0.6s ease-in-out ${index * 0.1}s`
          }}
        >
          {digit}
        </div>
      ))}
    </div>
  );
}