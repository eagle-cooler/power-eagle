// Plugin discovery and scanning functionality

import { ExtensionInfo } from '../sdk/types';
import { getExtensionsPath } from '../sdk/utils/paths';
import { BUILT_IN_PLUGINS } from '../sdk/utils/constants';

// Use require for Node.js modules in Eagle environment
const fs = require('fs');
const path = require('path');

export class PluginDiscovery {
  private extensionsPath: Promise<string>;

  constructor() {
    this.extensionsPath = getExtensionsPath();
  }

  /**
   * Gets display name for a plugin ID
   * @param pluginId - Plugin ID
   * @returns string - Display name
   */
  private getPluginDisplayName(pluginId: string): string {
    const nameMap: Record<string, string> = {
      'example-plugin': 'Example Plugin',
      'recent-libraries': 'Recent Libraries',
      'file-creator': 'File Creator'
    };
    return nameMap[pluginId] || pluginId;
  }

  /**
   * Discovers all available plugins (built-in examples and installed plugins)
   * @returns Promise<ExtensionInfo[]> - Array of discovered plugin information
   */
  async discoverExtensions(): Promise<ExtensionInfo[]> {
    // Discover built-in example plugins and installed extensions
    const extensions: ExtensionInfo[] = [];
    
    // Add built-in example plugins using constants
    const examplePlugins = BUILT_IN_PLUGINS.map(pluginId => ({
      id: pluginId,
      name: this.getPluginDisplayName(pluginId),
      manifest: {
        id: pluginId,
        name: this.getPluginDisplayName(pluginId),
      },
    }));

    // Add built-in plugins
    for (const plugin of examplePlugins) {
      extensions.push({
        ...plugin,
        path: `src/sdk/examples/${plugin.id}`, // File system path for examples
        isBuiltin: true,
      });
    }

    // Scan for installed plugins in ~user/.powereagle/extensions/{name}
    try {
      const installedPlugins = await this.scanInstalledPlugins();
      extensions.push(...installedPlugins);
    } catch (error) {
      console.error('Failed to scan installed plugins:', error);
    }

    return extensions;
  }

  /**
   * Scans the user's extensions directory for installed plugins
   * @returns Promise<ExtensionInfo[]> - Array of installed plugin information
   */
  private async scanInstalledPlugins(): Promise<ExtensionInfo[]> {
    const installedPlugins: ExtensionInfo[] = [];
    
    try {
      // Get the extensions directory path
      const extensionsDir = await this.extensionsPath;
      
      // Check if extensions directory exists
      if (!fs.existsSync(extensionsDir)) {
        console.log(`Extensions directory does not exist: ${extensionsDir}`);
        return installedPlugins;
      }

      // Read the extensions directory
      const entries = fs.readdirSync(extensionsDir, { withFileTypes: true });
      
      // Filter for directories only
      const pluginDirs = entries.filter((entry: { isDirectory: () => any; }) => entry.isDirectory());
      
      for (const pluginDir of pluginDirs) {
        try {
          const pluginPath = path.join(extensionsDir, pluginDir.name);
          const manifestPath = path.join(pluginPath, 'plugin.json');
          
          // Check if plugin.json exists
          if (!fs.existsSync(manifestPath)) {
            console.warn(`No plugin.json found in ${pluginDir.name}`);
            continue;
          }
          
          // Read plugin.json
          const manifestContent = fs.readFileSync(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestContent);
          
          // Validate manifest has required fields
          if (manifest.id && manifest.name) {
            installedPlugins.push({
              id: manifest.id,
              name: manifest.name,
              path: pluginPath,
              manifest,
              isBuiltin: false,
            });
            
            console.log(`Found installed plugin: ${manifest.name} (${manifest.id})`);
          } else {
            console.warn(`Invalid manifest in ${pluginPath}: missing id or name`);
          }
        } catch (error) {
          console.warn(`Failed to load plugin from ${pluginDir.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to scan extensions directory:', error);
    }
    
    return installedPlugins;
  }

  /**
   * Downloads a plugin from a URL (currently mocked)
   * @param url - URL to download the plugin from
   * @returns Promise<ExtensionInfo> - Downloaded plugin information
   */
  async downloadExtension(url: string): Promise<ExtensionInfo> {
    try {
      // In a real implementation, this would:
      // 1. Fetch the extension from URL
      // 2. Parse plugin.json and main.js
      // 3. Save to ~user/.powereagle/extensions/{name}/
      console.log(`Downloading extension from: ${url}`);
      
      // Mock download - in reality you'd fetch and save files
      const extensionsDir = await this.extensionsPath;
      const mockExtension: ExtensionInfo = {
        id: 'downloaded-plugin',
        name: 'Downloaded Plugin',
        path: `${extensionsDir}/downloaded-plugin`,
        manifest: {
          id: 'downloaded-plugin',
          name: 'Downloaded Plugin',
        },
        isBuiltin: false,
      };
      
      console.log(`Extension downloaded successfully`);
      return mockExtension;
    } catch (error) {
      console.error(`Failed to download extension from ${url}:`, error);
      throw error;
    }
  }
}
