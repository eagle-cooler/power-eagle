import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PluginRuntimeView } from './plugin-runtime-view';
import { initHostService, resolveHostContext, type HostService, type HostContext, type PluginSummary } from './host-service';
import type { AnyPluginModule } from '../plugins/builtins';
import { AiTab } from '../ai/ai-tab';
import { runTurn, type TurnInput } from '../ai/converse';
import type { PromptOptions } from '../ai/prompt';
import {
  listConversations,
  versionDir,
  deleteTurn as deleteConversationTurn,
  powereagleHome,
  type Conversation,
} from '../ai/conversation-store';
import { resolveAiModule, type AiModule } from '../ai/ai-bridge';
import { loadDiskPlugin, nativeImport } from '../host/install/disk-plugin';
import { createEagleHost, defaultEagleHostDeps } from './eagle-host';
import { loadTheme } from './theme-store';
import { ThemeContext } from '../sdui/render/render';
import { EMPTY_THEME, mergeThemes } from '../sdui/theme';
import type { EagleHost } from '../plugins/eagle';
import type { Theme } from '../sdui/types';
import { ExtensionDetail } from './extension-detail';
import { ExtensionList } from './extension-list';
import { InstallView } from './install-view';

const EMPTY_CONTEXT: HostContext = { services: {}, widgets: {}, theme: EMPTY_THEME, contributions: {}, failures: {} };

const DISABLED_KEY = 'peagle.disabled.v1';

/** Load the set of disabled plugin ids from localStorage (empty on any failure). */
function loadDisabled(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const ids = JSON.parse(window.localStorage.getItem(DISABLED_KEY) ?? '[]') as unknown;
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Read AI conversations from disk, tolerating an unavailable filesystem bridge. */
function readConversationsSafely(): Conversation[] {
  try {
    return listConversations(powereagleHome());
  } catch {
    return [];
  }
}

/** Persist the set of disabled plugin ids to localStorage. */
function saveDisabled(ids: ReadonlySet<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISABLED_KEY, JSON.stringify([...ids]));
  } catch {
    // persistence is best-effort
  }
}

// Three sections: installed (everything on the machine, one filterable list),
// install (get new extensions: by name + sources), ai (generate one).
type HostTab = 'installed' | 'install' | 'ai';
const TABS: HostTab[] = ['installed', 'install', 'ai'];

interface HostEvent {
  id: number;
  title: string;
  body?: string;
}

/** Lazy-load state for the launched plugin: loaded only when a visual plugin is opened. */
type Launch =
  | { id: string; status: 'loading' }
  | { id: string; status: 'ready'; module: AnyPluginModule }
  | { id: string; status: 'error'; message: string };

/**
 * The v3 host shell. The installed tab lists every extension — bundled and
 * disk-installed, all kinds — in one filterable list whose status light is the
 * enable toggle; install gets new extensions; ai generates one.
 */
export function App(props: { service?: HostService; eagle?: EagleHost; theme?: Theme; ai?: AiModule }): JSX.Element {
  const [events, setEvents] = useState<HostEvent[]>([]);
  const [theme, setTheme] = useState<Theme>(props.theme ?? EMPTY_THEME);
  const eagle = useMemo<EagleHost>(
    () =>
      props.eagle ??
      createEagleHost(
        defaultEagleHostDeps((message) =>
          setEvents((current) => [{ id: current.length, ...message }, ...current].slice(0, 20)),
        ),
      ),
    [props.eagle],
  );

  const [context, setContext] = useState<HostContext>(EMPTY_CONTEXT);
  const [service, setService] = useState<HostService | null>(props.service ?? null);
  const [tab, setTab] = useState<HostTab>('installed');
  const [available, setAvailable] = useState<PluginSummary[]>([]);
  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Enable state persists across reloads via localStorage (disabled plugin ids).
  const [disabled, setDisabled] = useState<ReadonlySet<string>>(loadDisabled);
  const [launch, setLaunch] = useState<Launch | null>(null);

  useEffect(() => {
    if (props.service) return;
    let active = true;
    void initHostService().then((resolved) => {
      if (active) setService(resolved);
    });
    return () => {
      active = false;
    };
  }, [props.service]);

  useEffect(() => {
    if (service) {
      setAvailable(service.listAvailable());
      setBuckets(service.listBuckets());
    }
  }, [service]);

  useEffect(() => {
    if (!props.theme) setTheme(loadTheme());
  }, [props.theme]);

  useEffect(() => {
    saveDisabled(disabled);
  }, [disabled]);

  // Activate the enabled service + styling plugins — bundled and installed from
  // disk — into the shared context every launched visual plugin runs against.
  // Disabled plugins are excluded, so the context rebuilds when a toggle flips;
  // a new install changes `available`, which re-resolves the context.
  useEffect(() => {
    if (!service) return;
    let active = true;
    void resolveHostContext(service, disabled, eagle as unknown as Record<string, unknown>).then((built) => {
      if (active) setContext(built);
    });
    return () => {
      active = false;
    };
  }, [service, available, eagle, disabled]);

  // Lazy-load the launched plugin's module only when an enabled visual plugin is
  // selected: built-ins resolve instantly, installed ones import from disk.
  useEffect(() => {
    const sel = available.find((plugin) => plugin.id === selectedId) ?? null;
    if (!service || !sel || sel.kind !== 'visual' || !sel.launchable || disabled.has(sel.id)) {
      setLaunch(null);
      return;
    }
    let active = true;
    const id = sel.id;
    setLaunch({ id, status: 'loading' });
    service.loadModule(id).then(
      (module) => {
        if (!active) return;
        setLaunch(module ? { id, status: 'ready', module } : { id, status: 'error', message: 'could not load plugin' });
      },
      (error: unknown) => {
        if (active) setLaunch({ id, status: 'error', message: error instanceof Error ? error.message : String(error) });
      },
    );
    return () => {
      active = false;
    };
  }, [service, available, selectedId, disabled]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  function toggle(id: string): void {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function refresh(): void {
    if (!service) return;
    setAvailable(service.listAvailable());
    setBuckets(service.listBuckets());
  }

  function handleAddBucket(url: string): void {
    if (!service) return;
    service.addBucket(url);
    refresh();
  }

  function handleInstall(name: string): void {
    if (!service) return;
    service.install(name);
    refresh();
  }

  const selected = available.find((plugin) => plugin.id === selectedId) ?? null;
  const activeCount = available.filter((plugin) => !disabled.has(plugin.id) && !context.failures[plugin.id]).length;

  // AI tab wiring. The filesystem/home and the injected `ai` global are only
  // touched on the ai tab, so the non-ai shell (and App.test) never hit them.
  const eagleRecord = eagle as unknown as Record<string, unknown>;
  const aiConversations: Conversation[] = tab === 'ai' ? readConversationsSafely() : [];
  const runAiTurn = (input: TurnInput, promptOptions?: PromptOptions): ReturnType<typeof runTurn> =>
    runTurn(input, {
      ai: (props.ai ?? resolveAiModule()) as AiModule,
      home: powereagleHome(),
      context,
      newId: () => `ai-${Date.now().toString(36)}`,
      promptOptions,
    });
  const loadAiVersion = (conversationId: string, version: number): Promise<AnyPluginModule> =>
    loadDiskPlugin(versionDir(powereagleHome(), conversationId, version), { importModule: nativeImport });

  function renderViewport(plugin: PluginSummary): JSX.Element {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <ThemeContext.Provider value={mergeThemes(context.theme, theme)}>
          {launch?.id === plugin.id && launch.status === 'ready' ? (
            <PluginRuntimeView
              eagle={eagleRecord}
              module={launch.module}
              services={context.services}
              widgets={context.widgets}
            />
          ) : launch?.id === plugin.id && launch.status === 'error' ? (
            <div className="text-sm text-destructive">failed to load {plugin.name}: {launch.message}</div>
          ) : (
            <div className="text-sm text-muted-foreground">loading {plugin.name}…</div>
          )}
        </ThemeContext.Provider>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground md:px-6">
      <section className="relative mx-auto flex min-h-[720px] max-w-7xl overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[52px] items-center gap-4 border-b border-border bg-card px-4 md:px-5">
            <div className="text-sm font-semibold tracking-[-0.02em] text-foreground">
              power<span className="font-medium text-muted-foreground">eagle</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_1px_hsl(var(--primary)/0.55)]" />
              {activeCount} of {available.length} active
            </div>
            <Tabs className="ml-auto" onValueChange={(value) => setTab(value as HostTab)} value={tab}>
              <TabsList>
                {TABS.map((name) => (
                  <TabsTrigger key={name} value={name}>{name}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {service ? null : <span className="text-xs text-muted-foreground">initializing saucepan...</span>}
          </header>
          <div className="flex min-h-0 flex-1">
            {tab === 'ai' ? (
              <AiTab
                context={context}
                conversations={aiConversations}
                deleteTurn={(conversationId, version) => deleteConversationTurn(powereagleHome(), conversationId, version)}
                eagle={eagleRecord}
                loadVersion={loadAiVersion}
                runTurn={runAiTurn}
              />
            ) : tab === 'install' ? (
              <InstallView buckets={buckets} onAddBucket={handleAddBucket} onInstall={handleInstall} />
            ) : (
              <>
                <ExtensionList
                  disabled={disabled}
                  failures={context.failures}
                  onSelect={setSelectedId}
                  onToggle={toggle}
                  plugins={available}
                  selectedId={selectedId}
                />
                <section className="min-w-0 flex-1 overflow-y-auto p-5 md:p-6">
                  {selected ? (
                    <ExtensionDetail
                      contribution={context.contributions[selected.id]}
                      failure={context.failures[selected.id]}
                      isDisabled={disabled.has(selected.id)}
                      onToggle={() => toggle(selected.id)}
                      plugin={selected}
                    >
                      {selected.kind === 'visual' ? renderViewport(selected) : null}
                    </ExtensionDetail>
                  ) : (
                    <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                      Select an extension to see what it does.
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
        <aside className="hidden w-[260px] flex-shrink-0 flex-col border-l border-border bg-muted/25 lg:flex">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">inspector</div>
          <div className="flex-1 overflow-y-auto p-3 text-xs text-muted-foreground">
            {events.length ? events.map((event) => (
              <div className="mb-2 rounded-lg border border-border bg-card px-3 py-2" key={event.id}>
                <div className="font-medium text-foreground">{event.title}</div>
                {event.body ? <div className="mt-0.5">{event.body}</div> : null}
              </div>
            )) : <div className="px-1 py-2">no host events yet</div>}
          </div>
        </aside>
      </section>
    </main>
  );
}
