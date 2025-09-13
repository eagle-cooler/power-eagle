// Extension manager for Power Eagle SDK - Main orchestrator

import { ExtensionInfo } from '../sdk/types';
import { PluginDiscovery } from './plugin-discovery';
import { PluginLoader } from './plugin-loader';
import { PluginExecutor } from './plugin-executor';
import { PluginManagement } from './plugin-management';

export class ExtensionManager {
  private extensions: Map<string, ExtensionInfo> = new Map();
  private discovery: PluginDiscovery;
  private loader: PluginLoader;
  private executor: PluginExecutor;
  private management: PluginManagement;


  constructor() {
    this.discovery = new PluginDiscovery();
    this.loader = new PluginLoader();
    this.executor = new PluginExecutor();
    this.management = new PluginManagement();
  }

  /**
   * Scans for and discovers all available plugins
   * Delegates to PluginDiscovery component
   */
  async scanExtensions(): Promise<void> {
    try {
      const extensions = await this.discovery.discoverExtensions();
      
      for (const extension of extensions) {
        this.extensions.set(extension.id, extension);
      }
      
      console.log(`Found ${extensions.length} extensions`);
    } catch (error) {
      console.error('Failed to scan extensions:', error);
    }
  }

  /**
   * Downloads a plugin from a URL
   * Delegates to PluginDiscovery component
   * @param url - URL to download the plugin from
   */
  async downloadExtension(url: string): Promise<void> {
    try {
      const extension = await this.discovery.downloadExtension(url);
      this.extensions.set(extension.id, extension);
    } catch (error) {
      console.error(`Failed to download extension from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Opens a plugin page by clearing content and loading the plugin
   * @param extensionId - ID of the extension to open
   */
  async openPluginPage(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    // Clear all existing content
    this.executor.clearHomeContent();
    
    // Navigate to plugin page with isolated context
    const pluginUrl = `plugin://${extensionId}`;
    
    if (typeof window !== 'undefined' && (window as any).eagle?.window) {
      const eagle = (window as any).eagle;
      
      // Use Eagle's window API to navigate to plugin page
      await eagle.window.show();
        // In a real implementation, this would navigate to the plugin page
        // For now, we'll simulate navigation
        console.log(`Navigating to plugin page: ${pluginUrl}`);
      await this.loadPluginInCurrentContext(extension);
    } else {
      // Fallback for development
      console.log(`Would navigate to: ${pluginUrl}`);
      await this.loadPluginInCurrentContext(extension);
    }
  }

  /**
   * Loads and executes a plugin in the current context
   * Coordinates PluginLoader and PluginExecutor components
   * @param extension - Extension info for the plugin
   */
  private async loadPluginInCurrentContext(extension: ExtensionInfo): Promise<void> {
    try {
      // Create isolated context for this plugin
      const isolatedContext = await this.executor.createIsolatedContext(extension);
      
      // Load plugin code
      const pluginCode = await this.loader.getPluginCode(extension);
      
      // Execute plugin in isolated context
      await this.executor.executePluginInIsolation(extension, isolatedContext, pluginCode);
      
      console.log(`Plugin loaded in isolated context: ${extension.name}`);
    } catch (error) {
      console.error(`Failed to load plugin in context for ${extension.name}:`, error);
    }
  }


  /**
   * Gets all discovered extensions
   * @returns ExtensionInfo[] - Array of all extensions
   */
  getExtensions(): ExtensionInfo[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Gets a specific extension by ID
   * @param id - Extension ID to look up
   * @returns ExtensionInfo | undefined - Extension info or undefined if not found
   */
  getExtension(id: string): ExtensionInfo | undefined {
    return this.extensions.get(id);
  }

  /**
   * Removes an extension (hides built-in or deletes installed)
   * Delegates to PluginManagement component
   * @param extensionId - ID of the extension to remove
   */
  async removeExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    try {
      await this.management.removeExtension(extensionId, extension);
      // Remove from extensions list
      this.extensions.delete(extensionId);
    } catch (error) {
      console.error(`Failed to remove extension ${extensionId}:`, error);
      throw error;
    }
  }

  /**
   * Checks if a plugin is currently hidden
   * Delegates to PluginManagement component
   * @param pluginId - Plugin ID to check
   * @returns boolean - True if the plugin is hidden
   */
  isPluginHidden(pluginId: string): boolean {
    return this.management.isPluginHidden(pluginId);
  }

  /**
   * Restores all hidden built-in plugins
   * Delegates to PluginManagement component
   */
  async showHiddenPlugins(): Promise<void> {
    await this.management.showHiddenPlugins();
    // Re-scan extensions to show hidden ones
    await this.scanExtensions();
  }
}
