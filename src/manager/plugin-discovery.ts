// Plugin discovery and scanning functionality

import { ExtensionInfo } from '../sdk/types';

// Use require for Node.js modules in Eagle environment
const fs = require('fs');
const path = require('path');

export class PluginDiscovery {
  private extensionsPath: string;

  constructor() {
    this.extensionsPath = this.getExtensionsPath();
  }

  /**
   * Gets the user's extensions directory path
   * @returns string - Path to ~user/.powereagle/extensions
   */
  private getExtensionsPath(): string {
    // Get user's home directory and construct extensions path
    const homeDir = typeof window !== 'undefined' && (window as any).eagle?.os?.homedir ? 
      (window as any).eagle.os.homedir() : '~';
    return `${homeDir}/.powereagle/extensions`;
  }

  /**
   * Discovers all available plugins (built-in examples and installed plugins)
   * @returns Promise<ExtensionInfo[]> - Array of discovered plugin information
   */
  async discoverExtensions(): Promise<ExtensionInfo[]> {
    // Discover built-in example plugins and installed extensions
    const extensions: ExtensionInfo[] = [];
    
    // Add built-in example plugins
    const examplePlugins = [
      {
        id: 'example-plugin',
        name: 'Example Plugin',
        manifest: {
          id: 'example-plugin',
          name: 'Example Plugin',
        },
      },
      {
        id: 'recent-libraries',
        name: 'Recent Libraries',
        manifest: {
          id: 'recent-libraries',
          name: 'Recent Libraries',
        },
      },
      {
        id: 'file-creator',
        name: 'File Creator',
        manifest: {
          id: 'file-creator',
          name: 'File Creator',
        },
      },
    ];

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
      // Get the actual extensions directory path
      const extensionsDir = this.getActualExtensionsPath();
      
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
   * Gets the actual file system path for the extensions directory
   * @returns string - Actual path to extensions directory
   */
  private getActualExtensionsPath(): string {
    // Get user's home directory
    const homeDir = typeof window !== 'undefined' && (window as any).eagle?.os?.homedir ? 
      (window as any).eagle.os.homedir() : 
      process.env.HOME || process.env.USERPROFILE || '~';
    
    return path.join(homeDir, '.powereagle', 'extensions');
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
      const mockExtension: ExtensionInfo = {
        id: 'downloaded-plugin',
        name: 'Downloaded Plugin',
        path: `${this.extensionsPath}/downloaded-plugin`,
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
