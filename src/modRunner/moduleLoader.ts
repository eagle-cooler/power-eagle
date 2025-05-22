// Declare the global type augmentation
declare global {
    interface Window {
        powerEagle?: ModContext['powerEagle'];
    }
}

// Use existing modules if available (for browser bundlers) otherwise require them on Node.
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

import { ModContext } from './modContext';

export class ModuleLoader {
    private cache: Map<string, unknown> = new Map();

    loadModule(entryPath: string, context?: ModContext): unknown {
        // Check cache first
        if (this.cache.has(entryPath)) {
            return this.cache.get(entryPath);
        }

        try {
            // Always convert to .cjs to force CommonJS loading
            const cjsPath = entryPath.replace(/\.js$/, '.cjs');
            
            // If the .cjs file doesn't exist or is older than the source, copy it
            if (!fs.existsSync(cjsPath) || 
                fs.statSync(cjsPath).mtime < fs.statSync(entryPath).mtime) {
                fs.copyFileSync(entryPath, cjsPath);
            }

            // Load the module
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const module = require(cjsPath);
            
            // If the module is a function, call it with context
            if (typeof module === 'function') {
                const result = module(context);
                this.cache.set(entryPath, result);
                return result;
            }
            
            // If the module has a default export that's a function, call it with context
            if (module.default && typeof module.default === 'function') {
                const result = module.default(context);
                this.cache.set(entryPath, result);
                return result;
            }

            // Otherwise just return the module
            this.cache.set(entryPath, module);
            return module;
        } catch (err) {
            console.error(`[ModuleLoader] Failed to load module ${entryPath}:`, err);
            throw err;
        }
    }

    clearCache() {
        this.cache.clear();
    }
} 