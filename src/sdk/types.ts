// Core types for Power Eagle SDK

export interface PluginManifest {
  id: string;
  name: string;
}

export interface ExtensionInfo {
  id: string;
  name: string;
  path: string;
  manifest: PluginManifest;
  isBuiltin: boolean;
}

export interface ButtonConfig {
  id: string;
  text: string;
  onClick: () => void;
}

export interface EagleAPI {
  showNotification: (message: string) => void;
}

export interface PluginAPI {
  registerButton: (config: ButtonConfig) => void;
}
