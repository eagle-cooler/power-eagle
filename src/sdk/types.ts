// Core types for Power Eagle SDK

export interface PluginManifest {
  id: string;
  name: string;
  description?: string;
}

export interface ExtensionInfo {
  id: string;
  name: string;
  description?: string;
  path: string;
  manifest: PluginManifest;
  isBuiltin: boolean;
}

export interface LegacyButtonConfig {
  id: string;
  text: string;
  onClick: () => void;
}

export interface EagleAPI {
  showNotification: (message: string) => void;
}

export interface PluginAPI {
  registerButton: (config: LegacyButtonConfig) => void;
}
