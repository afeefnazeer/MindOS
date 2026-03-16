// src/apps/ThoughtDump/index.ts — Brain dump with AI categorisation

import { callGroq } from '../../api/groq';
import * as store from '../../storage/store';
import './styles.css';

interface Thought {
  id: string;
  raw: string;
  category: 'task' | 'idea' | 'question' | 'observation';
  createdAt: number;
  tags: string[];
}

const CATEGORIES: Thought['category'][] = ['task', 'idea', 'question', 'observation'];
const CATEGORY_ICONS: Record<string, string> = {
  task: '✅',
  idea: '💡',
  question: '❓',
  observation: '👁️',
};

export function mount(container: HTMLElement): void {
  container.style.padding = '0';
  container.innerHTML = `<div class="thought-dump"></div>`;

  const root = container.querySelector('.thought-dump') as HTMLElement;
  root.innerHTML = `
    <div class="thought-input-panel">
      <textarea class="thought-textarea" placeholder="Dump your thoughts here... Press Enter or click Submit." rows="8"></textarea>
      <button class="thought-submit-btn" id="td-submit">Submit Thought</button>
      <button class="thought-export-btn" id="td-export">Export as Markdown</button>
    </div>
    <div class="thought-columns-panel" id="td-columns">
      ${CATEGORIES.map(cat => `
        <div class="thought-column" data-category="${cat}">
          <div class="thought-column-header">${CATEGORY_ICONS[cat]} ${cat}</div>
          <div class="thought-column-cards" data-cat="${cat}"></div>
        </div>
      `).join('')}
    </div>
  `;

  const textarea = root.querySelector('.thought-textarea') as HTMLTextAreaElement;
  const submitBtn = root.querySelector('#td-submit') as HTMLButtonElement;
  const exportBtn = root.querySelector('#td-export') as HTMLButtonElement;

  // Load existing thoughts
  renderExistingThoughts(root);

  // Submit on button
  submitBtn.addEventListener('click', () => {
    submitThought(textarea, root, submitBtn);
  });

  // Submit on Enter (Shift+Enter for newline)
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitThought(textarea, root, submitBtn);
    }
  });

  // Export
  exportBtn.addEventListener('click', () => {
    exportThoughts();
  });
}

async function submitThought(
  textarea: HTMLTextAreaElement,
  root: HTMLElement,
  submitBtn: HTMLButtonElement
): Promise<void> {
  const raw = textarea.value.trim();
  if (!raw) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Classifying...';

  let category: Thought['category'] = 'observation';
  let tags: string[] = [];

  try {
    const prompt = `Classify this developer note. Return {"category":"task"|"idea"|"question"|"observation","tags":["tag1","tag2"]}. No markdown, no explanation. Note: "${raw}"`;

    const response = await callGroq(prompt, {
      maxTokens: 80,
      temperature: 0.1,
    });

    const parsed = JSON.parse(response);
    if (CATEGORIES.includes(parsed.category)) {
      category = parsed.category;
    }
    if (Array.isArray(parsed.tags)) {
      tags = parsed.tags.slice(0, 5).map((t: unknown) => String(t));
    }
  } catch {
    // Default to observation on failure
    category = 'observation';
    tags = [];
  }

  const thought: Thought = {
    id: crypto.randomUUID(),
    raw,
    category,
    createdAt: Date.now(),
    tags,
  };

  // Save
  store.update<Thought[]>('thoughts', (prev) => [...(prev ?? []), thought]);

  // Render card
  renderThoughtCard(root, thought);

  // Reset
  textarea.value = '';
  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit Thought';
}

function renderExistingThoughts(root: HTMLElement): void {
  const thoughts = store.get<Thought[]>('thoughts') ?? [];
  for (const thought of thoughts) {
    renderThoughtCard(root, thought);
  }
}

function renderThoughtCard(root: HTMLElement, thought: Thought): void {
  const columnCards = root.querySelector(
    `.thought-column-cards[data-cat="${thought.category}"]`
  );
  if (!columnCards) return;

  const card = document.createElement('div');
  card.className = 'thought-card';

  const time = new Date(thought.createdAt);
  const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

  card.innerHTML = `
    <div class="thought-card-text">${escapeHtml(thought.raw)}</div>
    ${thought.tags.length > 0 ? `
      <div class="thought-card-tags">
        ${thought.tags.map(t => `<span class="thought-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    ` : ''}
    <div class="thought-card-time">${timeStr}</div>
  `;

  // Prepend so newest are at top
  columnCards.prepend(card);
}

function exportThoughts(): void {
  const thoughts = store.get<Thought[]>('thoughts') ?? [];
  if (thoughts.length === 0) return;

  const sorted = [...thoughts].sort((a, b) => a.createdAt - b.createdAt);
  const grouped: Record<string, Thought[]> = {};

  for (const t of sorted) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }

  let md = '# MindOS — Thought Dump Export\n\n';
  md += `_Exported on ${new Date().toLocaleDateString()}_\n\n`;

  for (const cat of CATEGORIES) {
    if (!grouped[cat] || grouped[cat].length === 0) continue;
    md += `## ${CATEGORY_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}s\n\n`;
    for (const t of grouped[cat]) {
      const dateStr = new Date(t.createdAt).toLocaleString();
      md += `- ${t.raw}`;
      if (t.tags.length > 0) {
        md += ` _(${t.tags.join(', ')})_`;
      }
      md += ` — ${dateStr}\n`;
    }
    md += '\n';
  }

  downloadFile('mindos-thoughts.md', md);
}

function downloadFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
