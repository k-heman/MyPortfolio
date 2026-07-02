import { useEffect, useRef } from 'react';

import './Starfield.scss';

interface StarfieldProps {
  theme: 'dark' | 'light';
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  baseOpacity: number;
  opacity: number;
  twinkleSpeed: number;
  colorType: 'neutral' | 'accent' | 'mid';
}

export default function Starfield({ theme }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cache the CSS color variable values once per theme change
    const styles = getComputedStyle(canvas);
    const starNeutralColor = styles.getPropertyValue('--star-color-neutral').trim() || '255, 255, 255';
    const starAccentColor = styles.getPropertyValue('--star-color-accent').trim() || '167, 139, 250';
    const starMidColor = styles.getPropertyValue('--star-color-mid').trim() || '96, 165, 250';

    // Check accessibility media query for reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReducedMotion = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (isReducedMotion) {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        draw();
      } else {
        if (!animationFrameId.current) {
          tick();
        }
      }
    };
    motionQuery.addEventListener('change', handleMotionChange);

    const initStars = (width: number, height: number) => {
      const area = width * height;
      // Target around 120 stars for a standard desktop (1920x1080)
      const starDensity = 0.000084;
      const starCount = Math.min(Math.floor(area * starDensity), 252);

      const newStars: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        const rand = Math.random();
        let size = 0.5;
        let speed = 0.1;
        let baseOpacity = 0.3;

        if (rand < 0.6) {
          // Deep/Background layer: 60% of stars (small, slow, faint)
          size = (Math.random() * 0.6 + 0.4) * 1.2;
          speed = (Math.random() * 0.08 + 0.04) * 1.5;
          baseOpacity = Math.random() * 0.2 + 0.15;
        } else if (rand < 0.9) {
          // Middle layer: 30% of stars (medium size, medium speed, moderate opacity)
          size = (Math.random() * 0.8 + 1.0) * 1.2;
          speed = (Math.random() * 0.15 + 0.12) * 1.5;
          baseOpacity = Math.random() * 0.3 + 0.35;
        } else {
          // Foreground layer: 10% of stars (larger, faster, brighter)
          size = (Math.random() * 1.0 + 1.8) * 1.2;
          speed = (Math.random() * 0.25 + 0.28) * 1.5;
          baseOpacity = Math.random() * 0.3 + 0.65;
        }

        const colorRand = Math.random();
        let colorType: 'neutral' | 'accent' | 'mid' = 'neutral';
        if (colorRand > 0.88) {
          colorType = 'accent';
        } else if (colorRand > 0.76) {
          colorType = 'mid';
        }

        newStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          speed,
          baseOpacity,
          opacity: baseOpacity,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          colorType,
        });
      }
      starsRef.current = newStars;
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      if (starsRef.current.length === 0) {
        initStars(width, height);
      } else {
        // Relocate stars if they are off the new screen dimensions
        starsRef.current.forEach((star) => {
          if (star.x > width) star.x = Math.random() * width;
          if (star.y > height) star.y = Math.random() * height;
        });
      }

      if (isReducedMotion) {
        draw();
      }
    };

    const getStarColor = (star: Star) => {
      const alpha = star.opacity;
      let rgb = starNeutralColor;
      if (star.colorType === 'accent') {
        rgb = starAccentColor;
      } else if (star.colorType === 'mid') {
        rgb = starMidColor;
      }
      return `rgba(${rgb}, ${alpha})`;
    };

    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      starsRef.current.forEach((star) => {
        // Floating upward effect
        star.y -= star.speed;

        // Reset to bottom once off-screen
        if (star.y < -star.size) {
          star.y = height + star.size;
          star.x = Math.random() * width;
        }

        // Sinusoidal opacity oscillation to simulate twinkling
        const time = Date.now() * star.twinkleSpeed * 0.05;
        star.opacity = star.baseOpacity + Math.sin(time) * (star.baseOpacity * 0.35);
        star.opacity = Math.max(0.05, Math.min(1, star.opacity));
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      starsRef.current.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = getStarColor(star);
        ctx.fill();
      });
    };

    const tick = () => {
      if (isReducedMotion) return;
      update();
      draw();
      animationFrameId.current = requestAnimationFrame(tick);
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (!isReducedMotion) {
      tick();
    } else {
      draw();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      motionQuery.removeEventListener('change', handleMotionChange);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="starfield"
      data-theme={theme}
      aria-hidden="true"
    />
  );
}
