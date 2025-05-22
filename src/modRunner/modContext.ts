export interface ModContext {
    powerEagle: {
        version: string;
        api: {
            log: (message: string) => void;
            // ... other API methods
        };
    };
}

export const defaultContext: ModContext = {
    powerEagle: {
        version: "1.0.0",
        api: {
            log: (message: string) => console.log(`[PowerEagle] ${message}`),
        }
    }
}; 