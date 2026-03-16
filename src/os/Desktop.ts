// src/os/Desktop.ts — Particle canvas background

export function initDesktop(container: HTMLElement): void {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  container.prepend(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const particles: Particle[] = [];
  const COUNT = 60;
  const MAX_DIST = 120;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
  }

  function resize(): void {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    });
  }

  function updateParticle(p: Particle): void {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
  }

  function drawParticle(p: Particle): void {
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx!.fillStyle = 'rgba(108,99,255,0.5)';
    ctx!.fill();
  }

  function drawConnection(a: Particle, b: Particle): void {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < MAX_DIST) {
      ctx!.beginPath();
      ctx!.moveTo(a.x, a.y);
      ctx!.lineTo(b.x, b.y);
      ctx!.strokeStyle = `rgba(108,99,255,${0.15 * (1 - dist / MAX_DIST)})`;
      ctx!.lineWidth = 0.5;
      ctx!.stroke();
    }
  }

  function tick(): void {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      updateParticle(p);
      drawParticle(p);
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        drawConnection(particles[i], particles[j]);
      }
    }

    requestAnimationFrame(tick);
  }

  tick();
}
