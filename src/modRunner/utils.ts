// Use existing modules if available (for browser bundlers) otherwise require them on Node.
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");
import { ModContext } from './i';

// Cache for loaded modules
const moduleCache = new Map<string, unknown>();

/**
 * Converts a .js file path to .cjs for CommonJS loading
 */
export function getCjsPath(entryPath: string): string {
    return entryPath.replace(/\.js$/, '.cjs');
}

/**
 * Ensures the .cjs file is up to date with the source file
 */
export function ensureCjsFile(entryPath: string): void {
    const cjsPath = getCjsPath(entryPath);
    if (!fs.existsSync(cjsPath) || 
        fs.statSync(cjsPath).mtime < fs.statSync(entryPath).mtime) {
        fs.copyFileSync(entryPath, cjsPath);
    }
}

/**
 * Loads a module and handles different export types
 */
export function loadModule(entryPath: string, context?: ModContext): unknown {
    // Check cache first
    if (moduleCache.has(entryPath)) {
        return moduleCache.get(entryPath);
    }

    try {
        // Ensure .cjs file is up to date
        ensureCjsFile(entryPath);
        const cjsPath = getCjsPath(entryPath);

        // Load the module
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(cjsPath);
        
        // Handle different export types
        const result = handleModuleExport(module, context);
        
        // Cache the result
        moduleCache.set(entryPath, result);
        return result;
    } catch (err) {
        console.error(`[ModuleLoader] Failed to load module ${entryPath}:`, err);
        throw err;
    }
}

/**
 * Handles different types of module exports
 */
function handleModuleExport(module: unknown, context?: ModContext): unknown {
    // If the module is a function, call it with context
    if (typeof module === 'function') {
        return module(context);
    }
    
    // If the module has a default export that's a function, call it with context
    if (module && typeof module === 'object' && 'default' in module && 
        typeof (module as { default: unknown }).default === 'function') {
        return (module as { default: (context?: ModContext) => unknown }).default(context);
    }

    // Otherwise just return the module
    return module;
}

/**
 * Clears the module cache
 */
export function clearModuleCache(): void {
    moduleCache.clear();
} 