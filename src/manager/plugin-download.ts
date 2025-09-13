// Plugin download functionality

import { extractZip, listZipContents } from '../sdk/utils';

export class PluginDownload {
  private debugMode: boolean = true;

  /**
   * Logs debug messages when debug mode is enabled
   * @param message - Debug message to log
   * @param args - Additional arguments to log
   */
  private debugLog(message: string, ...args: any[]): void {
    if (this.debugMode) {
      console.log(`[PluginDownload DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Downloads a plugin from URL and validates it
   * @param url - Download URL
   * @param eagle - Eagle API object
   * @param onRescan - Callback to trigger rescan after successful download
   * @returns Promise<boolean> - Success status
   */
  async downloadPlugin(url: string, eagle: any, onRescan: () => void): Promise<boolean> {
    try {
      this.debugLog(`Starting plugin download from: ${url}`);

      // Validate URL ends with .zip
      if (!url.toLowerCase().endsWith('.zip')) {
        await eagle.notification.show({
          title: 'Invalid URL',
          description: 'Plugin URL must end with .zip'
        });
        return false;
      }

      // Download the plugin
      const success = await this.downloadAndExtractPlugin(url, eagle, onRescan);
      
      if (success) {
        await eagle.notification.show({
          title: 'Plugin Downloaded',
          description: 'Plugin has been successfully downloaded and installed'
        });
      }

      return success;
    } catch (error) {
      this.debugLog(`Download failed:`, error);
      await eagle.notification.show({
        title: 'Download Failed',
        description: `Failed to download plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return false;
    }
  }

  /**
   * Downloads and extracts plugin from URL
   * @param url - Download URL
   * @param eagle - Eagle API object
   * @param onRescan - Callback to trigger rescan
   * @returns Promise<boolean> - Success status
   */
  private async downloadAndExtractPlugin(url: string, eagle: any, onRescan: () => void): Promise<boolean> {
    try {
      // Get user home directory
      const userHome = await this.getUserHomeDirectory();
      const downloadPath = `${userHome}/.powereagle/download/new.zip`;
      const extensionsPath = `${userHome}/.powereagle/extensions`;

      this.debugLog(`Downloading to: ${downloadPath}`);

      // Ensure directories exist
      await this.ensureDirectoriesExist(userHome);

      // Download the file
      await this.downloadFile(url, downloadPath);

      // Extract and validate
      const isValid = await this.validateAndExtractPlugin(downloadPath, extensionsPath);

      if (isValid) {
        // Clean up zip file
        await this.deleteFile(downloadPath);
        
        // Trigger rescan
        onRescan();
        
        this.debugLog('Plugin successfully downloaded and extracted');
        return true;
      } else {
        // Remove invalid zip file
        await this.deleteFile(downloadPath);
        
        await eagle.notification.show({
          title: 'Invalid Plugin',
          description: 'Plugin must contain plugin.json and main.js files'
        });
        
        return false;
      }
    } catch (error) {
      this.debugLog(`Download and extract failed:`, error);
      throw error;
    }
  }

  /**
   * Gets user home directory using Eagle API
   * @returns Promise<string> - Home directory path
   */
  private async getUserHomeDirectory(): Promise<string> {
    try {
      // Try Eagle API first
      if (eagle && eagle.os && eagle.os.homedir) {
        return await eagle.os.homedir();
      }
      
      // Fallback to Node.js
      const os = require('os');
      return os.homedir();
    } catch (error) {
      this.debugLog('Failed to get home directory:', error);
      throw new Error(`Could not determine user home directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensures required directories exist
   * @param userHome - User home directory
   */
  private async ensureDirectoriesExist(userHome: string): Promise<void> {
    const fs = require('fs');

    const directories = [
      `${userHome}/.powereagle`,
      `${userHome}/.powereagle/download`,
      `${userHome}/.powereagle/extensions`
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.debugLog(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Downloads file from URL to local path
   * @param url - Download URL
   * @param filePath - Local file path
   */
  private async downloadFile(url: string, filePath: string): Promise<void> {
    const fs = require('fs');
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      fs.writeFileSync(filePath, buffer);
      this.debugLog(`File downloaded successfully to: ${filePath}`);
    } catch (error) {
      this.debugLog(`Download failed:`, error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates and extracts plugin from zip file
   * @param zipPath - Path to zip file
   * @param extensionsPath - Extensions directory path
   * @returns Promise<boolean> - Whether plugin is valid
   */
  private async validateAndExtractPlugin(zipPath: string, extensionsPath: string): Promise<boolean> {
    try {
      const fs = require('fs');
      const path = require('path');

      // List zip contents to validate required files
      const zipContents = await listZipContents(zipPath);
      this.debugLog(`Zip contains files:`, zipContents);

      // Check for required files
      const hasPluginJson = zipContents.some(file => file === 'plugin.json' || file.endsWith('/plugin.json'));
      const hasMainJs = zipContents.some(file => file === 'main.js' || file.endsWith('/main.js'));

      if (!hasPluginJson || !hasMainJs) {
        this.debugLog(`Missing required files. Has plugin.json: ${hasPluginJson}, Has main.js: ${hasMainJs}`);
        return false;
      }

      // Extract to temporary directory first to read plugin.json
      const tempDir = path.join(extensionsPath, 'temp');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempDir, { recursive: true });

      // Extract zip
      const extractSuccess = await extractZip(zipPath, tempDir);
      if (!extractSuccess) {
        this.debugLog('Failed to extract zip file');
        return false;
      }

      // Read plugin.json to get plugin ID
      const pluginJsonPath = path.join(tempDir, 'plugin.json');
      if (!fs.existsSync(pluginJsonPath)) {
        this.debugLog('plugin.json not found after extraction');
        return false;
      }

      const pluginJsonContent = fs.readFileSync(pluginJsonPath, 'utf8');
      const pluginManifest = JSON.parse(pluginJsonContent);
      
      if (!pluginManifest.id) {
        this.debugLog('Plugin manifest missing ID');
        return false;
      }

      // Create final plugin directory
      const pluginDir = path.join(extensionsPath, pluginManifest.id);
      if (fs.existsSync(pluginDir)) {
        // Remove existing plugin
        fs.rmSync(pluginDir, { recursive: true, force: true });
      }

      // Move files from temp to final directory
      fs.renameSync(tempDir, pluginDir);
      
      this.debugLog(`Plugin extracted to: ${pluginDir}`);
      return true;
    } catch (error) {
      this.debugLog(`Validation and extraction failed:`, error);
      return false;
    }
  }

  /**
   * Deletes a file
   * @param filePath - Path to file to delete
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.debugLog(`Deleted file: ${filePath}`);
      }
    } catch (error) {
      this.debugLog(`Failed to delete file ${filePath}:`, error);
    }
  }
}
