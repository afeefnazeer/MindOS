// src/os/AppLauncher.ts — App grid overlay

import { appRegistry } from '../apps/registry';
import { WindowManager } from './WindowManager';

export function initAppLauncher(container: HTMLElement): void {
  const grid = document.createElement('div');
  grid.className = 'app-launcher-grid';
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 40px;
    max-width: 480px;
    width: 100%;
  `;

  for (const app of appRegistry) {
    const card = createAppCard(app);
    grid.appendChild(card);
  }

  container.appendChild(grid);

  // Close overlay on background click
  container.addEventListener('click', (e) => {
    if (e.target === container) {
      container.classList.remove('visible');
    }
  });
}

interface AppDef {
  id: string;
  title: string;
  icon: string;
  description: string;
  factory: () => HTMLElement;
  width?: number;
  height?: number;
}

function createAppCard(app: AppDef): HTMLElement {
  const card = document.createElement('div');
  card.className = 'app-launcher-card';
  card.style.cssText = `
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  card.innerHTML = `
    <div style="font-size: 32px; line-height: 1;">${app.icon}</div>
    <div>
      <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
        ${escapeHtml(app.title)}
      </div>
      <div style="font-size: 12px; color: var(--text-tertiary); line-height: 1.4;">
        ${escapeHtml(app.description)}
      </div>
    </div>
  `;

  card.addEventListener('mouseenter', () => {
    card.style.borderColor = 'var(--accent-soft)';
    card.style.background = 'var(--accent-glow)';
    card.style.transform = 'translateY(-2px)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.borderColor = 'var(--border)';
    card.style.background = 'var(--bg-surface)';
    card.style.transform = 'translateY(0)';
  });

  card.addEventListener('click', () => {
    launchApp(app);
  });

  return card;
}

function launchApp(app: AppDef): void {
  const content = app.factory();
  WindowManager.createWindow({
    title: app.title,
    appId: app.id,
    icon: app.icon,
    content,
    width: app.width,
    height: app.height,
  });

  // Close the launcher overlay
  const overlay = document.getElementById('app-launcher-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
