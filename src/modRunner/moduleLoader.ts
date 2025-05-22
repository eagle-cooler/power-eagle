// Declare the global type augmentation
declare global {
    var powerEagle: ModContext['powerEagle'];
}

export interface ModContext {
    // Add any global variables you want to expose to the mod
    powerEagle?: {
        version: string;
        api: {
            // Add your API methods here
            log: (message: string) => void;
            // ... other API methods
        };
    };
    // ... other global variables
}

export class ModuleLoader {
    private defaultContext: ModContext = {
        powerEagle: {
            version: "1.0.0",
            api: {
                log: (message: string) => console.log(`[PowerEagle] ${message}`),
            }
        }
    };

    loadModule(entryPath: string, context: ModContext = this.defaultContext): unknown {
        console.log('Loading module', entryPath);

        // Save original require
        const originalRequire = require;
        
        // Create a custom require function that uses our context
        const customRequire = (path: string) => {
            // Temporarily set our context as global
            const originalPowerEagle = global.powerEagle;
            global.powerEagle = context.powerEagle;
            
            try {
                return originalRequire(path);
            } finally {
                // Restore original global
                global.powerEagle = originalPowerEagle;
            }
        };

        // Use the custom require
        return customRequire(entryPath);
    }
} 