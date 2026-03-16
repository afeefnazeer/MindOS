// src/os/BootSequence.ts — Terminal-style startup animation

const LINES = [
  'MindOS v1.0.0',
  'initialising cognitive engine...',
  'loading thought dump...            OK',
  'mounting decision matrix...        OK',
  'calibrating focus timer...         OK',
  'mood sensors online...             OK',
  '',
  'Welcome back, Afeef.',
];

const delay = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export async function runBootSequence(): Promise<void> {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; background: #0D0D1A; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
  `;

  const pre = document.createElement('pre');
  pre.style.cssText = `
    font-family: 'JetBrains Mono', monospace; font-size: 14px;
    color: #6C63FF; line-height: 1.8; padding: 40px;
    max-width: 600px; width: 100%;
  `;

  overlay.appendChild(pre);
  document.body.appendChild(overlay);

  for (const line of LINES) {
    await delay(line === '' ? 400 : 250);
    const div = document.createElement('div');
    pre.appendChild(div);
    for (const char of line) {
      div.textContent += char;
      await delay(18 + Math.random() * 30);
    }
  }

  await delay(900);

  try {
    const anim = overlay.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 500, fill: 'forwards' }
    );
    await anim.finished;
  } catch {
    overlay.style.opacity = '0';
    await delay(500);
  }

  overlay.remove();
}
