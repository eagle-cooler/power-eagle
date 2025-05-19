import React, { useEffect, useRef } from "react";
import ModMgr from "../modMgr";
import { localLinksJson, POWER_EAGLE_PKGS_PATH } from "../modMgr/utils";
import { createModRunner, createModRunnerByPath, ModType, IModRunner } from "../modRunner";

// Node modules polyfill pattern (works in electron / node-web)
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

// Store runners by tab name
const runners = new Map<string, IModRunner>();

interface ModHostProps {
  name: string; // package name (tab id)
}

const ModHost: React.FC<ModHostProps> = ({ name }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // If we already have a runner for this tab, just remount it
      const existingRunner = runners.get(name);
      if (existingRunner && containerRef.current && !cancelled) {
        await existingRunner.mount(containerRef.current);
        return;
      }

      // Otherwise create a new runner
      let runner: IModRunner | null = null;

      // 1. installed package?
      const pkg = ModMgr.pkgs.get(name);
      if (pkg) {
        runner = await createModRunner(pkg);
      } else {
        // 2. linked local package
        const linkPath = localLinksJson.getValue(name);
        if (linkPath) {
          let type: ModType = "v1";
          let entry = "main.js";
          try {
            const modJsonPath = path.join(linkPath, "mod.json");
            if (fs.existsSync(modJsonPath)) {
              const modJson = JSON.parse(fs.readFileSync(modJsonPath, "utf8"));
              type = modJson.type ?? "v1";
              entry = modJson.entryPoint ?? "main.js";
            }
          } catch (_) {
            // ignore parse errors, fall back to defaults
          }
          const entryPath = path.isAbsolute(linkPath)
            ? path.join(linkPath, entry)
            : path.join(POWER_EAGLE_PKGS_PATH, linkPath, entry);
          runner = await createModRunnerByPath(type, entryPath, name);
        }
      }

      if (runner && containerRef.current && !cancelled) {
        runners.set(name, runner);
        await runner.mount(containerRef.current);
      }
    };

    load();

    // cleanup on unmount / tab switch
    return () => {
      cancelled = true;
      const runner = runners.get(name);
      if (runner) {
        runner.unmount();
        runners.delete(name);
      }
    };
  }, [name]);

  return <div ref={containerRef} className="w-full h-full overflow-auto" />;
};

export default ModHost; 