import { POWER_EAGLE_PKGS_PATH, localLinksJson } from "./utils";
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

type EventCallback = (...args: unknown[]) => void;

interface EventMap {
    'tabHistoryChanged': TabHistoryItem[];
    'localPackagesChanged': { [key: string]: string };
    'storageChanged': { key: string; value: unknown };
    'storageCleared': void;
}

class EventEmitter {
    private events: { [K in keyof EventMap]?: EventCallback[] } = {};

    on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event]?.push(callback as EventCallback);
    }

    off<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
        if (!this.events[event]) return;
        this.events[event] = this.events[event]?.filter(cb => cb !== callback) || [];
    }

    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
        if (!this.events[event]) return;
        this.events[event]?.forEach(callback => callback(data));
    }
}

export interface TabHistoryItem {
    id: string;
    title: string;
    timestamp: number;
}

class LocalStorageManager extends EventEmitter {
    private static instance: LocalStorageManager;
    private storage: Storage;
    private readonly STORAGE_KEYS = {
        TAB_HISTORY: 'power_eagle_tab_history',
    } as const;
    private readonly MAX_HISTORY = 10;

    private constructor() {
        super();
        this.storage = window.localStorage;
        this.cleanupTabHistory();
    }

    static getInstance(): LocalStorageManager {
        if (!LocalStorageManager.instance) {
            LocalStorageManager.instance = new LocalStorageManager();
        }
        return LocalStorageManager.instance;
    }

    // Tab History Management
    private cleanupTabHistory(): void {
        const history = this.getTabHistory();
        const cleanedHistory = history.filter(item => {
            // Check if the tab still exists in the filesystem or is a built-in tab
            return item.id === 'search' || item.id === 'packages' || 
                   this.checkTabExists(item.id);
        });

        if (cleanedHistory.length !== history.length) {
            this.storage.setItem(this.STORAGE_KEYS.TAB_HISTORY, JSON.stringify(cleanedHistory));
            this.emit('tabHistoryChanged', cleanedHistory);
        }
    }

    private checkTabExists(tabId: string): boolean {
        // Check if the tab ID corresponds to a local package
        if (tabId in localLinksJson.data) {
            return fs.existsSync(localLinksJson.data[tabId]);
        }

        // Check if the tab ID corresponds to an installed package
        const pkgPath = path.join(POWER_EAGLE_PKGS_PATH, tabId);
        return fs.existsSync(pkgPath);
    }

    getTabHistory(): TabHistoryItem[] {
        try {
            const history = this.storage.getItem(this.STORAGE_KEYS.TAB_HISTORY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error reading tab history:', error);
            return [];
        }
    }

    addToTabHistory(tab: { id: string; title: string }) {
        try {
            const history = this.getTabHistory();
            const existingIndex = history.findIndex(item => item.id === tab.id);
            
            if (existingIndex !== -1) {
                history.splice(existingIndex, 1);
            }

            const newItem: TabHistoryItem = {
                ...tab,
                timestamp: Date.now()
            };

            history.unshift(newItem);
            
            // Keep only the most recent items
            if (history.length > this.MAX_HISTORY) {
                history.pop();
            }

            this.storage.setItem(this.STORAGE_KEYS.TAB_HISTORY, JSON.stringify(history));
            this.emit('tabHistoryChanged', history);
        } catch (error) {
            console.error('Error updating tab history:', error);
        }
    }

    removeFromTabHistory(tabId: string) {
        try {
            const history = this.getTabHistory();
            const newHistory = history.filter(item => item.id !== tabId);
            this.storage.setItem(this.STORAGE_KEYS.TAB_HISTORY, JSON.stringify(newHistory));
            this.emit('tabHistoryChanged', newHistory);
        } catch (error) {
            console.error('Error removing from tab history:', error);
        }
    }

    clearTabHistory() {
        try {
            this.storage.removeItem(this.STORAGE_KEYS.TAB_HISTORY);
            this.emit('tabHistoryChanged', []);
        } catch (error) {
            console.error('Error clearing tab history:', error);
        }
    }

    // Local Package Management
    getLocalPackages(): { [key: string]: string } {
        return localLinksJson.data;
    }

    addLocalPackage(name: string, path: string): boolean {
        if (!fs.existsSync(path)) {
            return false;
        }
        localLinksJson.setValue(name, path);
        this.emit('localPackagesChanged', localLinksJson.data);
        return true;
    }

    removeLocalPackage(name: string): void {
        localLinksJson.deleteValue(name);
        this.emit('localPackagesChanged', localLinksJson.data);
    }

    getLocalPackagePath(name: string): string | undefined {
        return localLinksJson.getValue(name);
    }

    // Generic storage methods
    getItem<T>(key: string): T | null {
        const item = this.storage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    setItem<T>(key: string, value: T): void {
        this.storage.setItem(key, JSON.stringify(value));
        this.emit('storageChanged', { key, value });
    }

    removeItem(key: string): void {
        this.storage.removeItem(key);
        this.emit('storageChanged', { key, value: null });
    }

    clear(): void {
        try {
            this.storage.clear();
            this.emit('storageCleared', undefined);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
}

export const localMgr = LocalStorageManager.getInstance();
