// src/apps/registry.ts — App definitions

import { mount as mountThoughtDump } from './ThoughtDump/index';
import { mount as mountDecisionMatrix } from './DecisionMatrix/index';
import { mount as mountFocusTimer } from './FocusTimer/index';
import { mount as mountMoodLog } from './MoodLog/index';

export interface AppDefinition {
  id: string;
  title: string;
  icon: string;
  description: string;
  factory: () => HTMLElement;
  width?: number;
  height?: number;
}

export const appRegistry: AppDefinition[] = [
  {
    id: 'thought-dump',
    title: 'Thought Dump',
    icon: '🧠',
    description: 'Dump raw thoughts — AI auto-categorises them into tasks, ideas, questions, and observations.',
    factory: () => createContainer(mountThoughtDump),
    width: 800,
    height: 500,
  },
  {
    id: 'decision-matrix',
    title: 'Decision Matrix',
    icon: '⚖️',
    description: 'Structure complex decisions with weighted criteria and scoring for clear recommendations.',
    factory: () => createContainer(mountDecisionMatrix),
    width: 700,
    height: 520,
  },
  {
    id: 'focus-timer',
    title: 'Focus Timer',
    icon: '🎯',
    description: 'Pomodoro-style focus sessions with progress tracking and notifications.',
    factory: () => createContainer(mountFocusTimer),
    width: 380,
    height: 540,
  },
  {
    id: 'mood-log',
    title: 'Mood Log',
    icon: '💜',
    description: 'Track your daily mood, spot patterns, and visualise your emotional trends.',
    factory: () => createContainer(mountMoodLog),
    width: 440,
    height: 580,
  },
];

function createContainer(
  mountFn: (container: HTMLElement) => void
): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:100%;height:100%;';
  // Use requestAnimationFrame to ensure the element is in the DOM before mounting
  requestAnimationFrame(() => {
    mountFn(el);
  });
  return el;
}
