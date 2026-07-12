// @vitest-environment jsdom
import { expect } from 'vitest';
import React from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { App } from '../src/app/App';
import type { HostService, PluginSummary } from '../src/app/host-service';
import { getBuiltin, type AnyPluginModule } from '../src/plugins/builtins';
import { definePlugin } from '../src/sdui/activate';
import type { EagleHost } from '../src/plugins/eagle';

const feature = await loadFeature('features/shell-redesign.feature');

// jsdom under Node 22 ships no localStorage; the real Eagle renderer has it.
class MemStorage {
  private store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.has(key) ? (this.store.get(key) as string) : null; }
  key(index: number): string | null { return [...this.store.keys()][index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}
Object.defineProperty(window, 'localStorage', { value: new MemStorage(), configurable: true });

const greeter = definePlugin({
  manifest: { id: 'greeter', name: 'Greeter', version: '1.2.0', service: true },
  provides: () => ({ hello: (name: string) => `hi ${name}` }),
}) as unknown as AnyPluginModule;

const BUILTINS: PluginSummary[] = [
  { id: 'file-creator', name: 'File Creator', version: '3.0.0', source: 'builtin', kind: 'visual', launchable: true },
  { id: 'clipboard', name: 'Clipboard', version: '1.0.0', source: 'builtin', kind: 'service', launchable: false },
];

function fakeService(extra: PluginSummary[] = [], failing: Record<string, string> = {}): HostService {
  return {
    listAvailable: () => [...BUILTINS, ...extra],
    listBuckets: () => ['file:///D:/dev/my-bucket'],
    install: () => {},
    addBucket: () => {},
    loadModule: async (id) => {
      if (failing[id]) throw new Error(failing[id]);
      if (id === 'greeter') return greeter;
      return getBuiltin(id);
    },
  };
}

function fakeEagle(): EagleHost {
  return {
    createFile: async () => true,
    getRecentLibraries: async () => [],
    switchLibrary: async () => {},
    notify: async () => {},
  };
}

const GREETER_SUMMARY: PluginSummary = {
  id: 'greeter', name: 'Greeter', version: '1.2.0', source: 'github', kind: 'service', launchable: false,
};
const NEON_SUMMARY: PluginSummary = {
  id: 'neon', name: 'Neon', version: '0.3.1', source: 'github', kind: 'styling', launchable: false,
};

function mountDefault(): void {
  render(React.createElement(App, { service: fakeService([GREETER_SUMMARY]), eagle: fakeEagle() }));
}

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
    window.localStorage.clear();
  });

  Scenario('The shell offers exactly three sections', ({ Given, Then }) => {
    Given('the shell is rendered with builtin and installed extensions', () => {
      mountDefault();
    });
    Then('the tabs are exactly "installed", "install" and "ai"', () => {
      const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
      expect(tabs).toEqual(['installed', 'install', 'ai']);
    });
  });

  Scenario('The installed tab lists every kind and source together', ({ Given, Then }) => {
    Given('the shell is rendered with builtin and installed extensions', () => {
      mountDefault();
    });
    Then('the builtin visual "File Creator" and the installed service "Greeter" are listed together', () => {
      const list = screen.getByRole('listbox', { name: /extensions/i });
      expect(within(list).getByText('File Creator')).toBeTruthy();
      expect(within(list).getByText('Greeter')).toBeTruthy();
    });
  });

  Scenario('A kind chip narrows the list to that kind', ({ Given, When, Then }) => {
    Given('the shell is rendered with builtin and installed extensions', () => {
      mountDefault();
    });
    When('the user picks the "service" kind chip', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'service' }));
    });
    Then('only service extensions remain listed', () => {
      const list = screen.getByRole('listbox', { name: /extensions/i });
      expect(within(list).getByText('Clipboard')).toBeTruthy();
      expect(within(list).getByText('Greeter')).toBeTruthy();
      expect(within(list).queryByText('File Creator')).toBeNull();
    });
  });

  Scenario('A source chip narrows the list to installed extensions', ({ Given, When, Then }) => {
    Given('the shell is rendered with builtin and installed extensions', () => {
      mountDefault();
    });
    When('the user picks the "installed" source chip', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'installed' }));
    });
    Then('only extensions installed from disk remain listed', () => {
      const list = screen.getByRole('listbox', { name: /extensions/i });
      expect(within(list).getByText('Greeter')).toBeTruthy();
      expect(within(list).queryByText('File Creator')).toBeNull();
      expect(within(list).queryByText('Clipboard')).toBeNull();
    });
  });

  Scenario('Search narrows the list by name', ({ Given, When, Then }) => {
    Given('the shell is rendered with builtin and installed extensions', () => {
      mountDefault();
    });
    When('the user searches for "clip"', async () => {
      await userEvent.type(screen.getByPlaceholderText(/search extensions/i), 'clip');
    });
    Then('only "Clipboard" remains listed', () => {
      const list = screen.getByRole('listbox', { name: /extensions/i });
      expect(within(list).getByText('Clipboard')).toBeTruthy();
      expect(within(list).queryByText('File Creator')).toBeNull();
      expect(within(list).queryByText('Greeter')).toBeNull();
    });
  });

  Scenario('The status light is the enable toggle', ({ Given, When, Then }) => {
    Given('the shell is rendered with builtin and installed extensions', () => {
      mountDefault();
    });
    When("the user clicks Clipboard's status light", async () => {
      await userEvent.click(screen.getByRole('switch', { name: 'Disable Clipboard' }));
    });
    Then('Clipboard is off and its light offers to enable it', () => {
      const light = screen.getByRole('switch', { name: 'Enable Clipboard' });
      expect(light.getAttribute('aria-checked')).toBe('false');
    });
  });

  Scenario('A failed extension says why it is unavailable', ({ Given, When, Then }) => {
    Given('the shell is rendered with an installed extension that fails to load', () => {
      render(React.createElement(App, {
        service: fakeService([NEON_SUMMARY], { neon: 'unexpected token in index.mjs' }),
        eagle: fakeEagle(),
      }));
    });
    When('the user opens the failed extension from the list', async () => {
      await screen.findByText('failed to load');
      await userEvent.click(screen.getByText('Neon'));
    });
    Then('the detail explains the failure and how to recover', async () => {
      expect(await screen.findByText(/unexpected token in index\.mjs/)).toBeTruthy();
      expect(screen.getByText(/reinstall/i)).toBeTruthy();
    });
  });

  Scenario('The install tab combines install-by-name with the sources list', ({ Given, When, Then }) => {
    Given('the shell is rendered with builtin and installed extensions', () => {
      mountDefault();
    });
    When('the user opens the "install" tab', async () => {
      await userEvent.click(screen.getByRole('tab', { name: 'install' }));
    });
    Then('the install-by-name field and the registered sources are shown together', () => {
      expect(screen.getByPlaceholderText('owner/repo or name')).toBeTruthy();
      expect(screen.getByText('file:///D:/dev/my-bucket')).toBeTruthy();
      expect(screen.getByText('Add source')).toBeTruthy();
    });
  });
});
