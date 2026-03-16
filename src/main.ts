// src/main.ts — Entry point: mounts OS, runs boot sequence on user click

import './styles/global.css';
import { initDesktop } from './os/Desktop';
import { initTaskBar } from './os/TaskBar';
import { initWelcome } from './os/Welcome';
import { initAppLauncher } from './os/AppLauncher';
import { WindowManager } from './os/WindowManager';

document.addEventListener('DOMContentLoaded', () => {
  const desktop = document.getElementById('desktop')!;
  const desktopLayer = document.getElementById('desktop-layer')!;
  const taskbar = document.getElementById('taskbar')!;
  const welcome = document.getElementById('welcome')!;
  const launcherOverlay = document.getElementById('app-launcher-overlay')!;

  // Initialise OS components
  WindowManager.init(desktopLayer);
  initDesktop(desktop);
  initTaskBar(taskbar);
  initAppLauncher(launcherOverlay);
  initWelcome(welcome);
});
