// src/apps/DecisionMatrix/index.ts — Weighted decision-making tool

import * as store from '../../storage/store';
import './styles.css';

interface Decision {
  id: string;
  question: string;
  options: string[];
  criteria: { name: string; weight: number }[];
  scores: Record<string, Record<string, number>>;
  createdAt: number;
}

export function mount(container: HTMLElement): void {
  container.style.padding = '16px';

  const decision: Decision = {
    id: crypto.randomUUID(),
    question: '',
    options: [],
    criteria: [],
    scores: {},
    createdAt: Date.now(),
  };

  let currentStep = 1;

  const root = document.createElement('div');
  root.className = 'decision-matrix';
  container.appendChild(root);

  renderStep(root, decision, currentStep, (step: number) => {
    currentStep = step;
    renderStep(root, decision, currentStep, arguments[3] as StepCallback);
  });
}

type StepCallback = (step: number) => void;

function renderStep(
  root: HTMLElement,
  decision: Decision,
  step: number,
  goTo: StepCallback
): void {
  root.innerHTML = `
    <div class="dm-steps">
      <span class="dm-step-indicator ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}">1. Question</span>
      <span class="dm-step-indicator ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}">2. Options & Criteria</span>
      <span class="dm-step-indicator ${step === 3 ? 'active' : ''}">3. Score</span>
    </div>
    <div class="dm-step-content" id="dm-content"></div>
    <div class="dm-nav" id="dm-nav"></div>
  `;

  const content = root.querySelector('#dm-content') as HTMLElement;
  const nav = root.querySelector('#dm-nav') as HTMLElement;

  if (step === 1) {
    renderStep1(content, nav, decision, goTo);
  } else if (step === 2) {
    renderStep2(content, nav, decision, goTo);
  } else {
    renderStep3(content, nav, decision, goTo);
  }
}

function renderStep1(
  content: HTMLElement,
  nav: HTMLElement,
  decision: Decision,
  goTo: StepCallback
): void {
  content.innerHTML = `
    <div style="margin-bottom: 16px;">
      <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 8px;">
        What decision are you trying to make?
      </label>
      <input class="dm-question-input" id="dm-question" type="text"
        placeholder="e.g. Which framework should I use for the project?"
        value="${escapeHtml(decision.question)}" />
    </div>
  `;

  nav.innerHTML = `
    <div></div>
    <button class="dm-nav-btn primary" id="dm-next1">Next →</button>
  `;

  const input = content.querySelector('#dm-question') as HTMLInputElement;
  const nextBtn = nav.querySelector('#dm-next1') as HTMLButtonElement;

  nextBtn.addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) return;
    decision.question = q;
    saveDec(decision);
    goTo(2);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') nextBtn.click();
  });

  input.focus();
}

function renderStep2(
  content: HTMLElement,
  nav: HTMLElement,
  decision: Decision,
  goTo: StepCallback
): void {
  content.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px;">
        Options
      </h3>
      <div class="dm-add-row">
        <input class="dm-add-input" id="dm-opt-input" placeholder="Add an option..." />
        <button class="dm-add-btn" id="dm-add-opt">Add</button>
      </div>
      <div class="dm-list" id="dm-opt-list"></div>
    </div>
    <div>
      <h3 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px;">
        Criteria (with weight 1–10)
      </h3>
      <div class="dm-add-row">
        <input class="dm-add-input" id="dm-crit-input" placeholder="Add a criterion..." />
        <button class="dm-add-btn" id="dm-add-crit">Add</button>
      </div>
      <div class="dm-list" id="dm-crit-list"></div>
    </div>
  `;

  nav.innerHTML = `
    <button class="dm-nav-btn secondary" id="dm-back2">← Back</button>
    <button class="dm-nav-btn primary" id="dm-next2">Next →</button>
  `;

  const optInput = content.querySelector('#dm-opt-input') as HTMLInputElement;
  const addOptBtn = content.querySelector('#dm-add-opt') as HTMLButtonElement;
  const optList = content.querySelector('#dm-opt-list') as HTMLElement;
  const critInput = content.querySelector('#dm-crit-input') as HTMLInputElement;
  const addCritBtn = content.querySelector('#dm-add-crit') as HTMLButtonElement;
  const critList = content.querySelector('#dm-crit-list') as HTMLElement;

  function renderOptions(): void {
    optList.innerHTML = '';
    decision.options.forEach((opt, i) => {
      const item = createListItem(opt, () => {
        decision.options.splice(i, 1);
        delete decision.scores[opt];
        saveDec(decision);
        renderOptions();
      });
      optList.appendChild(item);
    });
  }

  function renderCriteria(): void {
    critList.innerHTML = '';
    decision.criteria.forEach((crit, i) => {
      const item = createCriteriaItem(crit, (newWeight) => {
        decision.criteria[i].weight = newWeight;
        saveDec(decision);
      }, () => {
        decision.criteria.splice(i, 1);
        saveDec(decision);
        renderCriteria();
      });
      critList.appendChild(item);
    });
  }

  addOptBtn.addEventListener('click', () => {
    const val = optInput.value.trim();
    if (!val || decision.options.includes(val)) return;
    decision.options.push(val);
    decision.scores[val] = {};
    optInput.value = '';
    saveDec(decision);
    renderOptions();
    optInput.focus();
  });

  optInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addOptBtn.click();
  });

  addCritBtn.addEventListener('click', () => {
    const val = critInput.value.trim();
    if (!val || decision.criteria.find(c => c.name === val)) return;
    decision.criteria.push({ name: val, weight: 5 });
    critInput.value = '';
    saveDec(decision);
    renderCriteria();
    critInput.focus();
  });

  critInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addCritBtn.click();
  });

  nav.querySelector('#dm-back2')!.addEventListener('click', () => goTo(1));
  nav.querySelector('#dm-next2')!.addEventListener('click', () => {
    if (decision.options.length < 2 || decision.criteria.length < 1) return;
    goTo(3);
  });

  renderOptions();
  renderCriteria();
}

function renderStep3(
  content: HTMLElement,
  nav: HTMLElement,
  decision: Decision,
  goTo: StepCallback
): void {
  content.innerHTML = `
    <div style="margin-bottom: 8px; font-size: 14px; font-weight: 500; color: var(--text-secondary);">
      ${escapeHtml(decision.question)}
    </div>
    <div class="dm-grid-container">
      <table class="dm-grid" id="dm-grid"></table>
    </div>
    <div id="dm-recommendation"></div>
  `;

  nav.innerHTML = `
    <button class="dm-nav-btn secondary" id="dm-back3">← Back</button>
    <div></div>
  `;

  nav.querySelector('#dm-back3')!.addEventListener('click', () => goTo(2));

  buildGrid(content, decision);
}

function buildGrid(content: HTMLElement, decision: Decision): void {
  const table = content.querySelector('#dm-grid') as HTMLTableElement;
  const recDiv = content.querySelector('#dm-recommendation') as HTMLElement;

  // Header row
  let headerHtml = '<thead><tr><th>Option</th>';
  for (const c of decision.criteria) {
    headerHtml += `<th>${escapeHtml(c.name)} (×${c.weight})</th>`;
  }
  headerHtml += '<th>Total</th></tr></thead>';

  // Body rows
  let bodyHtml = '<tbody>';
  for (const opt of decision.options) {
    bodyHtml += `<tr><td>${escapeHtml(opt)}</td>`;
    for (const c of decision.criteria) {
      const val = decision.scores[opt]?.[c.name] ?? 0;
      bodyHtml += `<td><input class="dm-score-input" type="number" min="1" max="10" value="${val}" data-opt="${escapeAttr(opt)}" data-crit="${escapeAttr(c.name)}" /></td>`;
    }
    bodyHtml += `<td class="dm-total-cell" data-total-opt="${escapeAttr(opt)}">0%</td>`;
    bodyHtml += '</tr>';
  }
  bodyHtml += '</tbody>';

  table.innerHTML = headerHtml + bodyHtml;

  // Score input handlers
  table.querySelectorAll('.dm-score-input').forEach((input) => {
    const el = input as HTMLInputElement;
    el.addEventListener('input', () => {
      const opt = el.dataset.opt ?? '';
      const crit = el.dataset.crit ?? '';
      let val = parseInt(el.value, 10);
      if (isNaN(val)) val = 0;
      val = Math.max(0, Math.min(10, val));

      if (!decision.scores[opt]) decision.scores[opt] = {};
      decision.scores[opt][crit] = val;
      saveDec(decision);
      updateTotals(table, recDiv, decision);
    });
  });

  updateTotals(table, recDiv, decision);
}

function updateTotals(
  table: HTMLTableElement,
  recDiv: HTMLElement,
  decision: Decision
): void {
  let bestOpt = '';
  let bestScore = -1;

  const maxPossible = decision.criteria.reduce(
    (s, c) => s + 10 * c.weight, 0
  );

  for (const opt of decision.options) {
    const total = decision.criteria.reduce(
      (sum, c) => sum + (decision.scores[opt]?.[c.name] ?? 0) * c.weight, 0
    );
    const pct = maxPossible > 0
      ? Math.round((total / maxPossible) * 100)
      : 0;

    const cell = table.querySelector(
      `[data-total-opt="${escapeAttr(opt)}"]`
    );
    if (cell) cell.textContent = `${pct}%`;

    if (total > bestScore) {
      bestScore = total;
      bestOpt = opt;
    }
  }

  if (bestOpt && bestScore > 0) {
    recDiv.innerHTML = `
      <div class="dm-recommendation">
        🏆 Recommendation: <strong>${escapeHtml(bestOpt)}</strong>
      </div>
    `;
  } else {
    recDiv.innerHTML = '';
  }
}

function createListItem(
  name: string,
  onRemove: () => void
): HTMLElement {
  const item = document.createElement('div');
  item.className = 'dm-list-item';
  item.innerHTML = `
    <span class="dm-list-item-name">${escapeHtml(name)}</span>
    <span class="dm-remove-btn">✕</span>
  `;
  item.querySelector('.dm-remove-btn')!.addEventListener('click', onRemove);
  return item;
}

function createCriteriaItem(
  crit: { name: string; weight: number },
  onWeightChange: (w: number) => void,
  onRemove: () => void
): HTMLElement {
  const item = document.createElement('div');
  item.className = 'dm-list-item';
  item.innerHTML = `
    <span class="dm-list-item-name">${escapeHtml(crit.name)}</span>
    <input type="range" class="dm-weight-slider" min="1" max="10" value="${crit.weight}" />
    <span class="dm-weight-label">${crit.weight}</span>
    <span class="dm-remove-btn">✕</span>
  `;

  const slider = item.querySelector('.dm-weight-slider') as HTMLInputElement;
  const label = item.querySelector('.dm-weight-label') as HTMLElement;

  slider.addEventListener('input', () => {
    const w = parseInt(slider.value, 10);
    label.textContent = String(w);
    onWeightChange(w);
  });

  item.querySelector('.dm-remove-btn')!.addEventListener('click', onRemove);
  return item;
}

function saveDec(decision: Decision): void {
  store.update<Decision[]>('decisions', (prev) => {
    const arr = prev ?? [];
    const idx = arr.findIndex(d => d.id === decision.id);
    if (idx >= 0) {
      arr[idx] = decision;
    } else {
      arr.push(decision);
    }
    return arr;
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
