// Plugin management utilities for Power Eagle SDK

import { PluginManifest, PluginAPI, EagleAPI } from './types';
import { ButtonManager } from './visual/button';

export class PluginManager {
  private plugins: Map<string, PluginManifest> = new Map();
  private buttonManager: ButtonManager;
  private eagleAPI: EagleAPI;

  constructor(eagleAPI: EagleAPI) {
    this.eagleAPI = eagleAPI;
    this.buttonManager = new ButtonManager();
  }

  async loadPlugin(manifest: PluginManifest, pluginFunction: Function): Promise<void> {
    try {
      this.plugins.set(manifest.id, manifest);

      // Create plugin API
      const pluginAPI: PluginAPI = {
        registerButton: (config) => {
          this.buttonManager.registerButton({
            ...config,
            id: `${manifest.id}-${config.id}`,
          });
        },
      };

      // Execute the plugin function with global eagle object
      pluginFunction(pluginAPI, eagle);

      console.log(`Plugin ${manifest.name} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load plugin ${manifest.name}:`, error);
      throw error;
    }
  }

  unloadPlugin(pluginId: string): void {
    this.plugins.delete(pluginId);
    console.log(`Plugin ${pluginId} unloaded`);
  }

  getLoadedPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }
}
