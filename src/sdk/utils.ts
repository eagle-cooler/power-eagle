// Utility functions for Power Eagle SDK

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function createElement(tag: string, className?: string, textContent?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
}

export function addStylesheet(css: string, id?: string): void {
  const style = document.createElement('style');
  if (id) style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

export function removeStylesheet(id: string): void {
  const style = document.getElementById(id);
  if (style) style.remove();
}

export function waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

export function injectScript(code: string): void {
  const script = document.createElement('script');
  script.textContent = code;
  document.head.appendChild(script);
  script.remove();
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function generateId(prefix = 'plugin'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Extracts a zip file using system APIs (Windows/Mac)
 * @param zipPath - Path to the zip file
 * @param extractPath - Path to extract to
 * @returns Promise<boolean> - Success status
 */
export async function extractZip(zipPath: string, extractPath: string): Promise<boolean> {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const fs = require('fs');

    // Ensure extract directory exists
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    // Detect platform and use appropriate command
    const platform = process.platform;
    let command: string;

    if (platform === 'win32') {
      // Windows: Use PowerShell Expand-Archive
      const zipPathEscaped = zipPath.replace(/\\/g, '\\\\');
      const extractPathEscaped = extractPath.replace(/\\/g, '\\\\');
      command = `powershell -Command "Expand-Archive -Path '${zipPathEscaped}' -DestinationPath '${extractPathEscaped}' -Force"`;
    } else if (platform === 'darwin') {
      // macOS: Use unzip command
      command = `unzip -o "${zipPath}" -d "${extractPath}"`;
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`Extracting zip: ${command}`);
    await execAsync(command);
    
    return true;
  } catch (error) {
    console.error('Zip extraction failed:', error);
    return false;
  }
}

/**
 * Lists contents of a zip file using system APIs
 * @param zipPath - Path to the zip file
 * @returns Promise<string[]> - Array of file paths in the zip
 */
export async function listZipContents(zipPath: string): Promise<string[]> {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const platform = process.platform;
    let command: string;

    if (platform === 'win32') {
      // Windows: Use PowerShell
      const zipPathEscaped = zipPath.replace(/\\/g, '\\\\');
      command = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${zipPathEscaped}').Entries | Select-Object -ExpandProperty FullName"`;
    } else if (platform === 'darwin') {
      // macOS: Use unzip -l
      command = `unzip -l "${zipPath}" | grep -E '^[[:space:]]*[0-9]+' | awk '{print $NF}'`;
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const { stdout } = await execAsync(command);
    
    if (platform === 'win32') {
      // PowerShell returns each file on a new line
      return stdout.trim().split('\n').filter((line: string) => line.trim());
    } else {
      // unzip -l returns file paths
      return stdout.trim().split('\n').filter((line: string) => line.trim());
    }
  } catch (error) {
    console.error('Failed to list zip contents:', error);
    return [];
  }
}
