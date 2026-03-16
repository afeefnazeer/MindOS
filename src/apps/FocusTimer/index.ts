// src/apps/FocusTimer/index.ts — Pomodoro-style focus timer with SVG circle

import * as store from '../../storage/store';
import './styles.css';

type TimerState = 'IDLE' | 'FOCUS' | 'BREAK' | 'PAUSED';

interface FocusSession {
  id: string;
  workItem: string;
  startedAt: number;
  completedAt: number | null;
  durationMinutes: number;
  interrupted: boolean;
}

const CIRCUMFERENCE = 339.3;
const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export function mount(container: HTMLElement): void {
  container.style.position = 'relative';

  let state: TimerState = 'IDLE';
  let workItem = '';
  let totalSeconds = FOCUS_MINUTES * 60;
  let elapsedSeconds = 0;
  let intervalId: number | null = null;
  let pausedState: 'FOCUS' | 'BREAK' = 'FOCUS';

  const root = document.createElement('div');
  root.className = 'focus-timer';
  container.appendChild(root);

  render();

  function render(): void {
    root.innerHTML = `
      <div class="ft-circle-container">
        <svg class="ft-circle-svg" viewBox="0 0 120 120">
          <circle class="ft-circle-bg" cx="60" cy="60" r="54" />
          <circle class="ft-circle-progress ${state === 'BREAK' ? 'break' : ''}"
            cx="60" cy="60" r="54"
            stroke-dasharray="${CIRCUMFERENCE} ${CIRCUMFERENCE}"
            stroke-dashoffset="${calculateOffset()}" />
        </svg>
        <div class="ft-time-display">
          <span class="ft-time-text">${formatTime(getRemainingSeconds())}</span>
          <span class="ft-state-text ${state.toLowerCase()}">${getStateLabel()}</span>
        </div>
      </div>

      ${state === 'IDLE' ? `
        <input class="ft-work-input" id="ft-work" type="text"
          placeholder="What will you focus on?" value="${escapeHtml(workItem)}" />
      ` : `
        <div style="font-size: 13px; color: var(--text-secondary); text-align: center;">
          ${escapeHtml(workItem)}
        </div>
      `}

      <div class="ft-controls" id="ft-controls">
        ${renderControls()}
      </div>

      <div class="ft-history">
        <div class="ft-history-title">Recent Sessions</div>
        <div class="ft-history-chips" id="ft-chips">
          ${renderHistoryChips()}
        </div>
      </div>
    `;

    attachHandlers();
  }

  function renderControls(): string {
    switch (state) {
      case 'IDLE':
        return '<button class="ft-btn start" id="ft-start">Start Focus</button>';
      case 'FOCUS':
      case 'BREAK':
        return `
          <button class="ft-btn pause" id="ft-pause">Pause</button>
          <button class="ft-btn stop" id="ft-stop">Stop</button>
        `;
      case 'PAUSED':
        return `
          <button class="ft-btn resume" id="ft-resume">Resume</button>
          <button class="ft-btn stop" id="ft-stop">Stop</button>
        `;
      default:
        return '';
    }
  }

  function attachHandlers(): void {
    const startBtn = root.querySelector('#ft-start');
    const pauseBtn = root.querySelector('#ft-pause');
    const resumeBtn = root.querySelector('#ft-resume');
    const stopBtn = root.querySelector('#ft-stop');
    const workInput = root.querySelector('#ft-work') as HTMLInputElement | null;

    if (workInput) {
      workInput.addEventListener('input', () => {
        workItem = workInput.value;
      });
      workInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && workItem.trim()) {
          startTimer();
        }
      });
    }

    startBtn?.addEventListener('click', () => startTimer());
    pauseBtn?.addEventListener('click', () => pauseTimer());
    resumeBtn?.addEventListener('click', () => resumeTimer());
    stopBtn?.addEventListener('click', () => stopTimer(true));
  }

  function startTimer(): void {
    if (!workItem.trim()) return;
    requestNotificationPermission();

    state = 'FOCUS';
    totalSeconds = FOCUS_MINUTES * 60;
    elapsedSeconds = 0;
    startInterval();
    render();
  }

  function pauseTimer(): void {
    pausedState = state as 'FOCUS' | 'BREAK';
    state = 'PAUSED';
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    render();
  }

  function resumeTimer(): void {
    state = pausedState;
    startInterval();
    render();
  }

  function stopTimer(interrupted: boolean): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    const session: FocusSession = {
      id: crypto.randomUUID(),
      workItem,
      startedAt: Date.now() - elapsedSeconds * 1000,
      completedAt: interrupted ? null : Date.now(),
      durationMinutes: Math.round(elapsedSeconds / 60),
      interrupted,
    };

    store.update<FocusSession[]>('focusSessions', (prev) =>
      [...(prev ?? []), session]
    );

    state = 'IDLE';
    elapsedSeconds = 0;
    totalSeconds = FOCUS_MINUTES * 60;
    render();
  }

  function startInterval(): void {
    if (intervalId !== null) clearInterval(intervalId);
    intervalId = window.setInterval(() => {
      elapsedSeconds++;
      if (elapsedSeconds >= totalSeconds) {
        onTimerComplete();
      }
      updateCircle();
    }, 1000);
  }

  function onTimerComplete(): void {
    if (state === 'FOCUS') {
      sendNotification(`Finished: "${workItem}"`);
      state = 'BREAK';
      totalSeconds = BREAK_MINUTES * 60;
      elapsedSeconds = 0;
      render();
    } else if (state === 'BREAK') {
      sendNotification('Break complete! Ready for another round?');
      stopTimer(false);
    }
  }

  function updateCircle(): void {
    const circle = root.querySelector('.ft-circle-progress') as SVGCircleElement | null;
    const timeText = root.querySelector('.ft-time-text');
    const stateText = root.querySelector('.ft-state-text');

    if (circle) {
      circle.style.strokeDashoffset = String(calculateOffset());
      circle.classList.toggle('break', state === 'BREAK');
    }
    if (timeText) {
      timeText.textContent = formatTime(getRemainingSeconds());
    }
    if (stateText) {
      stateText.textContent = getStateLabel();
      stateText.className = `ft-state-text ${state.toLowerCase()}`;
    }
  }

  function calculateOffset(): number {
    if (totalSeconds === 0) return 0;
    return CIRCUMFERENCE * (1 - elapsedSeconds / totalSeconds);
  }

  function getRemainingSeconds(): number {
    return Math.max(0, totalSeconds - elapsedSeconds);
  }

  function getStateLabel(): string {
    switch (state) {
      case 'IDLE': return 'Ready';
      case 'FOCUS': return 'Focus';
      case 'BREAK': return 'Break';
      case 'PAUSED': return 'Paused';
      default: return '';
    }
  }

  function renderHistoryChips(): string {
    const sessions = store.get<FocusSession[]>('focusSessions') ?? [];
    const recent = sessions.slice(-8).reverse();
    if (recent.length === 0) {
      return '<span style="font-size: 11px; color: var(--text-tertiary);">No sessions yet</span>';
    }
    return recent.map(s => `
      <div class="ft-session-chip ${s.interrupted ? 'interrupted' : 'completed'}">
        <span>${s.interrupted ? '✕' : '✓'}</span>
        <span>${escapeHtml(truncate(s.workItem, 20))}</span>
        <span>${s.durationMinutes}m</span>
      </div>
    `).join('');
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function requestNotificationPermission(): void {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } catch {
    // Silently ignore
  }
}

function sendNotification(body: string): void {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MindOS — Session complete', { body });
    }
  } catch {
    // Silently ignore
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
