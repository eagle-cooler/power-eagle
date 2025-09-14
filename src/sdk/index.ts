// Power Eagle SDK - Main exports and context builder

import { Button, CardManager, Dialog } from './visual';

export { Button, ButtonManager } from './visual/button';
export { CardManager } from './visual/card';
export { Dialog } from './visual/dialog';

// Utils exports
export * from './utils';

// WebAPI export
export { default as webapi } from './webapi';

/**
 * Creates the organized powersdk context for plugins
 * @param storage - Plugin storage object
 * @param container - Plugin DOM container
 * @param pluginId - Plugin identifier
 * @returns Organized powersdk context object
 */
export async function createPowerSDKContext(
  storage: any,
  container: HTMLElement,
  pluginId: string
) {
  // Import all SDK components
  const EagleApi = await import('./webapi');
  
  // Import utils by module
  const filesModule = await import('./utils/files');
  const pathsModule = await import('./utils/paths');
  const domModule = await import('./utils/dom');
  const commonModule = await import('./utils/common');

  return {
    // Storage functionality
    storage,
    // DOM container
    container,
    // Plugin info
    pluginId,
    
    // Organized namespaces
    visual: {
      Button,
      CardManager,
      Dialog
    },
    
    utils: {
      // File utilities
      files: {
        createFile: filesModule.createFile,
        extractZip: filesModule.extractZip,
        listZipContents: filesModule.listZipContents,
        formatBytes: filesModule.formatBytes
      },
      
      // Path utilities
      paths: {
        getUserHomeDirectory: pathsModule.getUserHomeDirectory,
        getExtensionsPath: pathsModule.getExtensionsPath,
        getDownloadPath: pathsModule.getDownloadPath,
        getPowerEagleBasePath: pathsModule.getPowerEagleBasePath,
        ensurePowerEagleDirectories: pathsModule.ensurePowerEagleDirectories
      },
      
      // DOM utilities
      dom: {
        createElement: domModule.createElement,
        addStylesheet: domModule.addStylesheet,
        removeStylesheet: domModule.removeStylesheet,
        waitForElement: domModule.waitForElement,
        injectScript: domModule.injectScript,
        copyToClipboard: domModule.copyToClipboard,
        sanitizeHtml: domModule.sanitizeHtml
      },
      
      // Common utilities
      common: {
        debounce: commonModule.debounce,
        throttle: commonModule.throttle,
        generateId: commonModule.generateId,
        isValidUrl: commonModule.isValidUrl
      }
    },
    
    // Eagle API
    webapi: EagleApi.default
  };
}