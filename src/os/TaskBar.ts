// src/os/TaskBar.ts — Fixed bottom bar with clock, chips, launcher

import { WindowManager } from './WindowManager';

interface ChipInfo {
  id: string;
  appId: string;
  title: string;
  icon: string;
}

let chipContainer: HTMLElement;
const chips: Map<string, ChipInfo> = new Map();

export function initTaskBar(container: HTMLElement): void {
  container.innerHTML = `
    <div class="taskbar-left">
      <div class="launcher-btn" id="launcher-btn">
        <div class="launcher-dot"></div>
        <div class="launcher-dot"></div>
        <div class="launcher-dot"></div>
        <div class="launcher-dot"></div>
        <div class="launcher-dot"></div>
        <div class="launcher-dot"></div>
      </div>
    </div>
    <div class="taskbar-center" id="taskbar-chips"></div>
    <div class="taskbar-right">
      <span class="taskbar-clock" id="taskbar-clock"></span>
      <div class="taskbar-settings" id="taskbar-settings" title="Settings">⚙</div>
    </div>
  `;

  chipContainer = document.getElementById('taskbar-chips')!;
  initClock();
  attachLauncherButton();
  listenForWindowEvents();
}

function initClock(): void {
  const clockEl = document.getElementById('taskbar-clock')!;

  function updateClock(): void {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

function attachLauncherButton(): void {
  const btn = document.getElementById('launcher-btn')!;
  btn.addEventListener('click', () => {
    const overlay = document.getElementById('app-launcher-overlay')!;
    overlay.classList.toggle('visible');
  });
}

function listenForWindowEvents(): void {
  window.addEventListener('window:opened', ((e: CustomEvent) => {
    const { id, appId, title, icon } = e.detail;
    addChip(id, appId, title, icon ?? '');
  }) as EventListener);

  window.addEventListener('window:closed', ((e: CustomEvent) => {
    removeChip(e.detail.id);
  }) as EventListener);

  window.addEventListener('window:minimised', ((e: CustomEvent) => {
    updateChipState(e.detail.id, true);
  }) as EventListener);

  window.addEventListener('window:restored', ((e: CustomEvent) => {
    updateChipState(e.detail.id, false);
  }) as EventListener);

  window.addEventListener('window:focused', ((e: CustomEvent) => {
    setActiveChip(e.detail.id);
  }) as EventListener);
}

function addChip(id: string, appId: string, title: string, icon: string): void {
  const info: ChipInfo = { id, appId, title, icon };
  chips.set(id, info);

  const chipEl = document.createElement('div');
  chipEl.className = 'app-chip active';
  chipEl.dataset.windowId = id;
  chipEl.innerHTML = `
    <span class="app-chip-icon">${icon}</span>
    <span>${escapeHtml(title)}</span>
  `;

  chipEl.addEventListener('click', () => {
    if (WindowManager.isMinimised(id)) {
      WindowManager.focusWindow(id);
    } else {
      WindowManager.focusWindow(id);
    }
  });

  chipContainer.appendChild(chipEl);
}

function removeChip(id: string): void {
  chips.delete(id);
  const chipEl = chipContainer.querySelector(`[data-window-id="${id}"]`);
  if (chipEl) {
    chipEl.remove();
  }
}

function updateChipState(id: string, minimised: boolean): void {
  const chipEl = chipContainer.querySelector(`[data-window-id="${id}"]`);
  if (chipEl) {
    chipEl.classList.toggle('minimised', minimised);
    chipEl.classList.remove('active');
  }
}

function setActiveChip(id: string): void {
  chipContainer.querySelectorAll('.app-chip').forEach((el) => {
    el.classList.remove('active');
  });
  const chipEl = chipContainer.querySelector(`[data-window-id="${id}"]`);
  if (chipEl) {
    chipEl.classList.add('active');
    chipEl.classList.remove('minimised');
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
