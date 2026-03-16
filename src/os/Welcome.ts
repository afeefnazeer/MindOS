// src/os/Welcome.ts — Full-screen welcome card

import { runBootSequence } from './BootSequence';

export function initWelcome(container: HTMLElement): void {
  const card = document.createElement('div');
  card.className = 'welcome-card';
  card.style.cssText = `
    background: rgba(26, 26, 53, 0.85);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: var(--radius-xl);
    padding: 48px;
    width: 420px;
    max-width: 90vw;
    border: 1px solid var(--border);
    animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  `;

  card.innerHTML = `
    <h1 style="font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
      MindOS
    </h1>
    <p style="font-family: 'Inter', sans-serif; font-size: 16px; color: var(--text-secondary); margin-bottom: 32px;">
      A thinking environment, built for developers.
    </p>
    <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px;">
      ${focusRow('🧠', 'Capture raw thoughts instantly')}
      ${focusRow('⚖️', 'Make structured decisions')}
      ${focusRow('🎯', 'Deep focus, tracked & timed')}
    </div>
    <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--text-tertiary); margin-bottom: 32px;">
      <span>ready</span><span class="cursor-blink" style="animation: blink 1s step-end infinite; margin-left: 2px;">|</span>
    </div>
    <button id="boot-btn" style="
      width: 100%;
      padding: 14px 24px;
      background: var(--accent);
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      font-weight: 600;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.3px;
    ">
      Boot MindOS →
    </button>
  `;

  container.appendChild(card);

  // Boot button hover
  const btn = card.querySelector('#boot-btn') as HTMLElement;
  btn.addEventListener('mouseenter', () => {
    btn.style.background = '#5B54E8';
    btn.style.transform = 'translateY(-1px)';
    btn.style.boxShadow = '0 8px 24px rgba(108, 99, 255, 0.3)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'var(--accent)';
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = 'none';
  });

  btn.addEventListener('click', async () => {
    btn.textContent = 'Booting...';
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';

    await runBootSequence();

    // Fade out welcome screen
    container.style.transition = 'opacity 0.4s ease';
    container.style.opacity = '0';
    setTimeout(() => {
      container.style.display = 'none';
    }, 400);
  });
}

function focusRow(icon: string, label: string): string {
  return `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 20px; width: 28px; text-align: center;">${icon}</span>
      <span style="font-size: 14px; color: var(--text-secondary); font-family: 'Inter', sans-serif;">
        ${label}
      </span>
    </div>
  `;
}
