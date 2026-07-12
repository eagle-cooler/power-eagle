/**
 * The AI tab: a collapsible chat panel beside a render stage. The stage always
 * shows one generated version; the chat steers it — sending a message
 * generates (new conversation) or refines the version currently on stage, and
 * version chips in the thread swap what is rendered. All effectful
 * collaborators (runTurn, loadVersion, deleteTurn) are injected; this
 * component owns only UI state.
 */
import React from 'react';
import { PluginRuntimeView } from '../app/plugin-runtime-view';
import { ThemeContext } from '../sdui/render/render';
import { mergeThemes } from '../sdui/theme';
import { ChatPanel } from './chat-panel';
import type { Conversation } from './conversation-store';
import type { TurnInput, TurnResult } from './converse';
import type { PromptOptions } from './prompt';
import type { HostContext } from '../app/host-service';
import type { AnyPluginModule } from '../plugins/builtins';

/** What is currently rendered: one version of one conversation. */
interface Stage {
  conversationId: string;
  version: number;
  module: AnyPluginModule;
}

/** The latest ok turn of a conversation, or undefined when none loads. */
function latestOkVersion(conversation: Conversation | null): number | undefined {
  if (!conversation) return undefined;
  for (let i = conversation.turns.length - 1; i >= 0; i -= 1) {
    if (conversation.turns[i].status === 'ok') return conversation.turns[i].version;
  }
  return undefined;
}

export function AiTab(props: {
  context: HostContext;
  eagle: Record<string, unknown>;
  conversations: Conversation[];
  runTurn(input: TurnInput, options?: PromptOptions): Promise<TurnResult>;
  loadVersion(conversationId: string, version: number): Promise<AnyPluginModule | undefined>;
  deleteTurn(conversationId: string, version: number): Conversation;
}): React.ReactElement {
  const { context, eagle, runTurn, loadVersion, deleteTurn } = props;
  const [conversations, setConversations] = React.useState<Conversation[]>(props.conversations);
  const [activeId, setActiveId] = React.useState<string | null>(
    props.conversations[props.conversations.length - 1]?.id ?? null,
  );
  const [selectedVersion, setSelectedVersion] = React.useState<number | null>(null);
  const [stage, setStage] = React.useState<Stage | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [collapsed, setCollapsed] = React.useState(false);

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;

  /** Put one version on the stage (and mark its chip selected). */
  const showVersion = React.useCallback(
    async (conversationId: string, version: number): Promise<void> => {
      setSelectedVersion(version);
      try {
        const module = await loadVersion(conversationId, version);
        if (module) setStage({ conversationId, version, module });
      } catch {
        // the chip stays selectable; the stage keeps its last good module
      }
    },
    [loadVersion],
  );

  // When the active conversation changes, stage its latest working version.
  React.useEffect(() => {
    const version = latestOkVersion(active);
    if (active && version !== undefined && stage?.conversationId !== active.id) {
      void showVersion(active.id, version);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- staging is keyed by conversation only
  }, [activeId]);

  /** Merge one updated conversation into the list (append when new). */
  function upsert(conversation: Conversation): void {
    setConversations((current) => {
      const index = current.findIndex((entry) => entry.id === conversation.id);
      if (index === -1) return [...current, conversation];
      return current.map((entry) => (entry.id === conversation.id ? conversation : entry));
    });
  }

  async function handleSend(instruction: string, options: { includeEagle: boolean; includeWebApi: boolean }): Promise<void> {
    setBusy(true);
    setError('');
    try {
      const input: TurnInput = {
        conversationId: active?.id,
        baseVersion: active && selectedVersion !== null ? selectedVersion : undefined,
        instruction,
      };
      const result = await runTurn(input, options);
      upsert(result.conversation);
      setActiveId(result.conversation.id);
      if (result.turn.status === 'ok' && result.module) {
        setStage({ conversationId: result.conversation.id, version: result.turn.version, module: result.module });
        setSelectedVersion(result.turn.version);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteTurn(version: number): void {
    if (!active) return;
    const updated = deleteTurn(active.id, version);
    upsert(updated);
    if (selectedVersion === version) {
      const fallback = latestOkVersion(updated);
      if (fallback !== undefined) void showVersion(updated.id, fallback);
      else {
        setSelectedVersion(null);
        setStage(null);
      }
    }
  }

  function handleNewConversation(): void {
    setActiveId(null);
    setSelectedVersion(null);
    setStage(null);
  }

  const stagedTurn = stage && active?.id === stage.conversationId
    ? active.turns.find((turn) => turn.version === stage.version)
    : null;

  return (
    <div className="flex min-h-0 flex-1">
      <ChatPanel
        active={active}
        busy={busy}
        collapsed={collapsed}
        conversations={conversations}
        selectedVersion={selectedVersion}
        onDeleteTurn={handleDeleteTurn}
        onNewConversation={handleNewConversation}
        onSelectConversation={setActiveId}
        onSelectVersion={(version) => {
          if (active) void showVersion(active.id, version);
        }}
        onSend={(instruction, options) => void handleSend(instruction, options)}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <section aria-label="Render stage" className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-medium">
          <span className={`h-2 w-2 rounded-full ${stage ? 'bg-primary shadow-[0_0_6px_1px_hsl(var(--primary)/0.55)]' : 'border border-muted-foreground/70'}`} />
          {stage && active ? (
            <>
              {stagedTurn?.name ?? active.title}
              <span className="font-mono text-[10.5px] font-normal text-muted-foreground/80">v{stage.version}</span>
            </>
          ) : (
            <span className="text-muted-foreground">nothing on stage</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {error ? <div className="mb-3 text-sm text-destructive">generation failed: {error}</div> : null}
          {stage ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <ThemeContext.Provider value={mergeThemes(context.theme, {})}>
                <PluginRuntimeView eagle={eagle} module={stage.module} services={context.services} widgets={context.widgets} />
              </ThemeContext.Provider>
            </div>
          ) : (
            <div className="px-2 py-10 text-center text-sm text-muted-foreground">
              {busy ? 'Generating…' : 'Send a message to put a generated extension on the stage.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
