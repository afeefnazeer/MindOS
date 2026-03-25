// src/os/WindowManager.ts — Singleton window lifecycle management

interface WindowConfig {
  title: string;
  appId: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  content: HTMLElement;
  icon?: string;
}

interface WindowInstance {
  id: string;
  appId: string;
  element: HTMLElement;
  config: WindowConfig;
  isMinimised: boolean;
  zIndex: number;
}

class WindowManagerClass {
  private windows: Map<string, WindowInstance> = new Map();
  private zCounter = 100;
  private desktopLayer: HTMLElement | null = null;

  init(desktopLayer: HTMLElement): void {
    this.desktopLayer = desktopLayer;
  }

  createWindow(config: WindowConfig): string {
    if (!this.desktopLayer) {
      throw new Error('WindowManager not initialised — call init() first');
    }

    const id = `win-${crypto.randomUUID()}`;
    const w = config.width ?? 600;
    const h = config.height ?? 420;
    const x = Math.max(40, (window.innerWidth - w) / 2 + (Math.random() - 0.5) * 40);
    const y = Math.max(20, (window.innerHeight - 48 - h) / 2 + (Math.random() - 0.5) * 40);
    const z = ++this.zCounter;

    const el = this.buildWindowElement(id, config, w, h, x, y, z);
    this.desktopLayer.appendChild(el);

    const instance: WindowInstance = {
      id,
      appId: config.appId,
      element: el,
      config,
      isMinimised: false,
      zIndex: z,
    };

    this.windows.set(id, instance);
    this.attachDragHandlers(el, id);
    this.attachResizeHandlers(el, id, config.minWidth ?? 320, config.minHeight ?? 240);
    this.attachTrafficLightHandlers(el, id);
    this.focusWindow(id);

    window.dispatchEvent(new CustomEvent('window:opened', {
      detail: { id, appId: config.appId, title: config.title, icon: config.icon },
    }));

    return id;
  }

  focusWindow(id: string): void {
    const instance = this.windows.get(id);
    if (!instance) return;

    this.windows.forEach((_inst, _id) => {
      _inst.element.classList.remove('focused');
    });

    instance.zIndex = ++this.zCounter;
    instance.element.style.zIndex = String(instance.zIndex);
    instance.element.classList.add('focused');

    if (instance.isMinimised) {
      instance.isMinimised = false;
      instance.element.style.display = 'flex';
      window.dispatchEvent(new CustomEvent('window:restored', {
        detail: { id },
      }));
    }

    window.dispatchEvent(new CustomEvent('window:focused', {
      detail: { id },
    }));
  }

  minimiseWindow(id: string): void {
    const instance = this.windows.get(id);
    if (!instance) return;

    instance.isMinimised = true;
    instance.element.style.display = 'none';

    window.dispatchEvent(new CustomEvent('window:minimised', {
      detail: { id },
    }));
  }

  closeWindow(id: string): void {
    const instance = this.windows.get(id);
    if (!instance) return;

    const el = instance.element;
    el.animate(
      [
        { transform: 'scale(1)', opacity: '1' },
        { transform: 'scale(0.95)', opacity: '0' },
      ],
      { duration: 150, fill: 'forwards' }
    ).onfinish = () => {
      el.remove();
      this.windows.delete(id);

      window.dispatchEvent(new CustomEvent('window:closed', {
        detail: { id, appId: instance.appId },
      }));
    };
  }

  getWindows(): WindowInstance[] {
    return Array.from(this.windows.values());
  }

  isMinimised(id: string): boolean {
    return this.windows.get(id)?.isMinimised ?? false;
  }

  private buildWindowElement(
    id: string, config: WindowConfig,
    w: number, h: number, x: number, y: number, z: number
  ): HTMLElement {
    const win = document.createElement('div');
    win.className = 'window';
    win.id = id;
    win.style.cssText = `width:${w}px;height:${h}px;left:${x}px;top:${y}px;z-index:${z}`;

    win.innerHTML = `
      <div class="window-titlebar">
        <div class="window-traffic-lights">
          <div class="traffic-light close" data-action="close"></div>
          <div class="traffic-light minimise" data-action="minimise"></div>
          <div class="traffic-light maximise" data-action="maximise"></div>
        </div>
        <span class="window-title">${this.escapeHtml(config.title)}</span>
        <span class="window-icon">${config.icon ?? ''}</span>
      </div>
      <div class="window-content"></div>
      <div class="resize-handle resize-n"></div>
      <div class="resize-handle resize-s"></div>
      <div class="resize-handle resize-e"></div>
      <div class="resize-handle resize-w"></div>
      <div class="resize-handle resize-ne"></div>
      <div class="resize-handle resize-nw"></div>
      <div class="resize-handle resize-se"></div>
      <div class="resize-handle resize-sw"></div>
    `;

    const contentEl = win.querySelector('.window-content') as HTMLElement;
    contentEl.appendChild(config.content);

    // Click to focus
    win.addEventListener('mousedown', () => {
      this.focusWindow(id);
    });

    return win;
  }

  private attachTrafficLightHandlers(el: HTMLElement, id: string): void {
    el.querySelectorAll('.traffic-light').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (btn as HTMLElement).dataset.action;
        if (action === 'close') this.closeWindow(id);
        else if (action === 'minimise') this.minimiseWindow(id);
        else if (action === 'maximise') this.toggleMaximise(id);
      });
    });
  }

  private toggleMaximise(id: string): void {
    const instance = this.windows.get(id);
    if (!instance) return;

    const el = instance.element;
    const isMax = el.dataset.maximised === 'true';

    if (isMax) {
      el.style.left = el.dataset.prevLeft ?? '100px';
      el.style.top = el.dataset.prevTop ?? '50px';
      el.style.width = el.dataset.prevWidth ?? '600px';
      el.style.height = el.dataset.prevHeight ?? '420px';
      el.dataset.maximised = 'false';
    } else {
      el.dataset.prevLeft = el.style.left;
      el.dataset.prevTop = el.style.top;
      el.dataset.prevWidth = el.style.width;
      el.dataset.prevHeight = el.style.height;
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.width = '100%';
      el.style.height = `${window.innerHeight - 48}px`;
      el.dataset.maximised = 'true';
    }
  }

  private attachDragHandlers(el: HTMLElement, id: string): void {
    const titlebar = el.querySelector('.window-titlebar') as HTMLElement;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      requestAnimationFrame(() => {
        const newLeft = e.clientX - offsetX;
        const newTop = Math.max(0, e.clientY - offsetY);
        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
      });
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    titlebar.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('traffic-light')) return;

      isDragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;

      this.focusWindow(id);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  private attachResizeHandlers(
    el: HTMLElement, id: string,
    minW: number, minH: number
  ): void {
    const handles = el.querySelectorAll('.resize-handle');

    handles.forEach((handle) => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.focusWindow(id);

        const mouseEvent = e as MouseEvent;
        const direction = this.getResizeDirection(handle as HTMLElement);
        const startX = mouseEvent.clientX;
        const startY = mouseEvent.clientY;
        const startRect = {
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
        };

        const onMouseMove = (ev: MouseEvent) => {
          requestAnimationFrame(() => {
            this.applyResize(el, direction, ev, startX, startY, startRect, minW, minH);
          });
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  private getResizeDirection(handle: HTMLElement): string {
    const classes = handle.className;
    const dirs = ['ne', 'nw', 'se', 'sw', 'n', 's', 'e', 'w'];
    for (const d of dirs) {
      if (classes.includes(`resize-${d}`)) return d;
    }
    return 'se';
  }

  private applyResize(
    el: HTMLElement, dir: string, ev: MouseEvent,
    startX: number, startY: number,
    start: { left: number; top: number; width: number; height: number },
    minW: number, minH: number
  ): void {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    let newW = start.width;
    let newH = start.height;
    let newL = start.left;
    let newT = start.top;

    if (dir.includes('e')) newW = Math.max(minW, start.width + dx);
    if (dir.includes('w')) {
      newW = Math.max(minW, start.width - dx);
      newL = start.left + (start.width - newW);
    }
    if (dir.includes('s')) newH = Math.max(minH, start.height + dy);
    if (dir.includes('n')) {
      newH = Math.max(minH, start.height - dy);
      newT = Math.max(0, start.top + (start.height - newH));
    }

    el.style.width = `${newW}px`;
    el.style.height = `${newH}px`;
    el.style.left = `${newL}px`;
    el.style.top = `${newT}px`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export const WindowManager = new WindowManagerClass();
