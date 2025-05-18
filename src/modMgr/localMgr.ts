import { POWER_EAGLE_PKGS_PATH, localLinksJson } from "./utils";
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

type EventCallback = (...args: unknown[]) => void;

class EventEmitter {
    private events: { [key: string]: EventCallback[] } = {};

    on(event: string, callback: EventCallback): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event: string, callback: EventCallback): void {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event: string, ...args: unknown[]): void {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(...args));
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
        const history = this.storage.getItem(this.STORAGE_KEYS.TAB_HISTORY);
        return history ? JSON.parse(history) : [];
    }

    addToTabHistory(tab: { id: string; title: string }) {
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
    }

    removeFromTabHistory(tabId: string) {
        const history = this.getTabHistory();
        const newHistory = history.filter(item => item.id !== tabId);
        this.storage.setItem(this.STORAGE_KEYS.TAB_HISTORY, JSON.stringify(newHistory));
        this.emit('tabHistoryChanged', newHistory);
    }

    clearTabHistory() {
        this.storage.removeItem(this.STORAGE_KEYS.TAB_HISTORY);
        this.emit('tabHistoryChanged', []);
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
        this.storage.clear();
        this.emit('storageCleared');
    }
}

export const localMgr = LocalStorageManager.getInstance();
