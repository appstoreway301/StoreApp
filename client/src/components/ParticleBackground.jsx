import { useRef, useEffect } from 'react';

export default function ParticleBackground({ variant = 'hero' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let stars = [];
    let particles = [];
    let mouse = { x: -1000, y: -1000 };

    const isSubtle = variant === 'subtle';
    let logicalW = 0;
    let logicalH = 0;

    function isDark() {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      logicalW = canvas.parentElement.offsetWidth;
      logicalH = canvas.parentElement.offsetHeight;
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      canvas.style.width = logicalW + 'px';
      canvas.style.height = logicalH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars();
      initParticles();
    }

    function initStars() {
      stars = [];
      const density = isSubtle ? 8000 : 3000;
      const count = Math.floor((logicalW * logicalH) / density);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * logicalW,
          y: Math.random() * logicalH,
          size: Math.random() * (isSubtle ? 1 : 1.5) + 0.3,
          speed: Math.random() * (isSubtle ? 0.2 : 0.4) + 0.05,
          opacity: Math.random() * (isSubtle ? 0.3 : 0.6) + 0.1,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    function initParticles() {
      particles = [];
      const density = isSubtle ? 25000 : 12000;
      const min = isSubtle ? 8 : 15;
      const count = Math.floor((logicalW * logicalH) / density);
      for (let i = 0; i < Math.max(count, min); i++) {
        particles.push(createParticle());
      }
    }

    function createParticle(fromEdge) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (fromEdge) {
        if (side === 0) { x = Math.random() * logicalW; y = -10; }
        else if (side === 1) { x = logicalW + 10; y = Math.random() * logicalH; }
        else if (side === 2) { x = Math.random() * logicalW; y = logicalH + 10; }
        else { x = -10; y = Math.random() * logicalH; }
      } else {
        x = Math.random() * logicalW;
        y = Math.random() * logicalH;
      }

      const hueShift = Math.random() * 30 - 10;
      const r = Math.min(255, 232 + hueShift);
      const g = Math.floor(60 + Math.random() * 60);
      const b = Math.floor(Math.random() * 20);

      const opacityMul = isSubtle ? 0.5 : 1;
      const sizeMul = isSubtle ? 0.7 : 1;

      return {
        x, y,
        vx: (Math.random() - 0.5) * (isSubtle ? 0.4 : 0.8),
        vy: (Math.random() - 0.5) * (isSubtle ? 0.4 : 0.8) - (isSubtle ? 0.1 : 0.2),
        size: (Math.random() * 3 + 1.5) * sizeMul,
        opacity: (Math.random() * 0.6 + 0.3) * opacityMul,
        life: 0,
        maxLife: Math.random() * 500 + 300,
        color: `${r},${g},${b}`,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.008,
        trail: [],
      };
    }

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    let time = 0;

    function draw() {
      time++;
      ctx.clearRect(0, 0, logicalW, logicalH);

      const dark = !isSubtle || isDark();
      const starColor = dark ? '255,255,255' : '0,0,0';

      // Stars - space effect
      for (const star of stars) {
        star.y += star.speed;
        if (star.y > logicalH) {
          star.y = 0;
          star.x = Math.random() * logicalW;
        }

        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const opacity = star.opacity * (0.6 + twinkle * 0.4) * (isSubtle && !dark ? 0.15 : 1);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starColor},${opacity})`;
        ctx.fill();
      }

      // Orange particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        // Mouse interaction
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120 * (isSubtle ? 0.3 : 0.5);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.vx *= 0.998;
        p.vy *= 0.998;
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > (isSubtle ? 5 : 8)) p.trail.shift();

        // Fade in/out
        let lifeOpacity = 1;
        if (p.life < 30) lifeOpacity = p.life / 30;
        else if (p.life > p.maxLife - 40) lifeOpacity = (p.maxLife - p.life) / 40;

        const pulseFactor = 0.7 + Math.sin(p.pulse) * 0.3;
        const finalOpacity = p.opacity * lifeOpacity * pulseFactor;
        const finalSize = p.size * pulseFactor;

        // Draw trail
        for (let t = 0; t < p.trail.length - 1; t++) {
          const trailOpacity = (t / p.trail.length) * finalOpacity * 0.3;
          const trailSize = finalSize * (t / p.trail.length) * 0.5;
          ctx.beginPath();
          ctx.arc(p.trail[t].x, p.trail[t].y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${trailOpacity})`;
          ctx.fill();
        }

        // Draw glow
        const glowSize = finalSize * (isSubtle ? 3 : 4);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        gradient.addColorStop(0, `rgba(${p.color},${finalOpacity * (isSubtle ? 0.25 : 0.4)})`);
        gradient.addColorStop(1, `rgba(${p.color},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(p.x, p.y, finalSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${finalOpacity})`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(p.x, p.y, finalSize * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,150,${finalOpacity * 0.8})`;
        ctx.fill();

        // Replace dead or out-of-bounds particles
        if (p.life > p.maxLife || p.x < -50 || p.x > logicalW + 50 || p.y < -50 || p.y > logicalH + 50) {
          particles[i] = createParticle(true);
        }
      }

      // Connecting lines
      const lineDist = isSubtle ? 120 : 150;
      const lineOpacityMul = isSubtle ? 0.05 : 0.08;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < lineDist) {
            const opacity = (1 - dist / lineDist) * lineOpacityMul;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(232,93,4,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    // Watch theme changes for subtle variant
    let observer;
    if (isSubtle) {
      observer = new MutationObserver(() => {});
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    window.addEventListener('resize', resize);
    const target = isSubtle ? canvas.parentElement : canvas;
    target.addEventListener('mousemove', handleMouseMove);
    target.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      target.removeEventListener('mousemove', handleMouseMove);
      target.removeEventListener('mouseleave', handleMouseLeave);
      if (observer) observer.disconnect();
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className={`particle-canvas ${variant === 'subtle' ? 'particle-canvas-subtle' : ''}`}
    />
  );
}
