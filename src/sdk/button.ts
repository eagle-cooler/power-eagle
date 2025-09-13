// Button utilities for Power Eagle SDK

import { ButtonConfig } from './types';

export class ButtonManager {
  private buttons: Map<string, ButtonConfig> = new Map();
  private container: HTMLElement | null = null;

  constructor(container?: HTMLElement) {
    this.container = container || document.getElementById('plugin-buttons') || this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'plugin-buttons';
    container.className = 'plugin-buttons-container';
    document.body.appendChild(container);
    return container;
  }

  registerButton(config: ButtonConfig): void {
    this.buttons.set(config.id, config);
    this.renderButton(config);
  }

  private renderButton(config: ButtonConfig): void {
    if (!this.container) return;

    const button = document.createElement('button');
    button.textContent = config.text;
    button.className = 'btn btn-primary';
    button.setAttribute('data-button-id', config.id);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      config.onClick();
    });

    this.container.appendChild(button);
  }
}
