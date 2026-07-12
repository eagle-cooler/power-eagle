/**
 * The AI tab's left panel: two accordion sections — Conversations (switch or
 * start one) and Chat (the active conversation's thread + composer). Pure UI
 * over props: the tab owns conversation state, generation, and the stage. The
 * whole panel collapses to a slim rail so the stage gets the full tab.
 */
import { useState, type ReactNode } from 'react';
import type { Conversation, Turn } from './conversation-store';

function AccordionSection(props: {
  label: string;
  hint?: string;
  open: boolean;
  grow?: boolean;
  onToggle(): void;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className={`flex min-h-0 flex-col border-b border-border ${props.open && props.grow ? 'flex-1' : ''}`}>
      <button
        aria-expanded={props.open}
        className="flex w-full flex-shrink-0 items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:text-foreground"
        onClick={props.onToggle}
        type="button"
      >
        <span className={`text-[9px] transition-transform ${props.open ? 'rotate-90' : ''}`}>▶</span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em]">{props.label}</span>
        {props.hint ? <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">{props.hint}</span> : null}
      </button>
      {props.open ? <div className="flex min-h-0 flex-1 flex-col">{props.children}</div> : null}
    </div>
  );
}

/** One turn in the thread: the user's message, then the outcome (chip or error). */
function TurnView(props: {
  turn: Turn;
  selected: boolean;
  onSelect(): void;
  onDelete(): void;
}): JSX.Element {
  const { turn, selected } = props;
  return (
    <div className="space-y-2">
      <div className="ml-auto max-w-[88%] w-fit rounded-xl rounded-br-sm border border-border bg-secondary px-3 py-2 text-xs">
        {turn.instruction}
      </div>
      {turn.status === 'ok' ? (
        <button
          aria-pressed={selected}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10.5px] ${selected ? 'border-primary/60 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'}`}
          onClick={props.onSelect}
          type="button"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-primary' : 'border border-muted-foreground/70'}`} />
          v{turn.version} · {selected ? 'rendered' : 'view'}
        </button>
      ) : (
        <div className="flex items-start gap-2 text-xs text-destructive">
          <span className="min-w-0 flex-1">v{turn.version} failed: {turn.error}</span>
          <button
            aria-label={`Delete failed turn v${turn.version}`}
            className="flex-shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
            onClick={props.onDelete}
            type="button"
          >
            delete
          </button>
        </div>
      )}
    </div>
  );
}

export function ChatPanel(props: {
  conversations: Conversation[];
  active: Conversation | null;
  selectedVersion: number | null;
  busy: boolean;
  collapsed: boolean;
  onToggleCollapsed(): void;
  onSelectConversation(id: string): void;
  onNewConversation(): void;
  onSelectVersion(version: number): void;
  onDeleteTurn(version: number): void;
  onSend(instruction: string, options: { includeEagle: boolean; includeWebApi: boolean }): void;
}): JSX.Element {
  const [convsOpen, setConvsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [includeEagle, setIncludeEagle] = useState(true);
  const [includeWebApi, setIncludeWebApi] = useState(true);

  function send(): void {
    const instruction = prompt.trim();
    if (!instruction || props.busy) return;
    props.onSend(instruction, { includeEagle, includeWebApi });
    setPrompt('');
  }

  if (props.collapsed) {
    return (
      <aside className="flex w-10 flex-shrink-0 flex-col items-center border-r border-border pt-2">
        <button
          aria-label="Expand chat"
          className="rounded-md border border-transparent p-1 text-muted-foreground hover:border-border hover:text-foreground"
          onClick={props.onToggleCollapsed}
          type="button"
        >
          ›
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-[300px] flex-shrink-0 flex-col border-r border-border">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <button
          aria-label="Collapse chat"
          className="rounded-md border border-transparent p-1 text-muted-foreground hover:border-border hover:text-foreground"
          onClick={props.onToggleCollapsed}
          type="button"
        >
          ‹
        </button>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">ai</span>
      </div>

      <AccordionSection
        hint={String(props.conversations.length)}
        label="Conversations"
        onToggle={() => setConvsOpen((open) => !open)}
        open={convsOpen}
      >
        <div className="max-h-40 overflow-y-auto px-2 pb-2">
          <button
            className="mb-1 w-full rounded-lg border border-dashed border-border px-3 py-1.5 text-center text-xs text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            onClick={props.onNewConversation}
            type="button"
          >
            ＋ New conversation
          </button>
          {props.conversations.map((conversation) => (
            <button
              aria-pressed={conversation.id === props.active?.id}
              className={`mb-1 block w-full rounded-lg border px-3 py-1.5 text-left ${conversation.id === props.active?.id ? 'border-border bg-secondary' : 'border-transparent hover:bg-card'}`}
              key={conversation.id}
              onClick={() => props.onSelectConversation(conversation.id)}
              type="button"
            >
              <span className="block truncate text-xs font-medium text-foreground">{conversation.title}</span>
              <span className="font-mono text-[10px] text-muted-foreground/80">{conversation.turns.length} turns</span>
            </button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        grow
        hint={props.active?.title}
        label="Chat"
        onToggle={() => setChatOpen((open) => !open)}
        open={chatOpen}
      >
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {props.active?.turns.length ? (
            props.active.turns.map((turn) => (
              <TurnView
                key={turn.version}
                onDelete={() => props.onDeleteTurn(turn.version)}
                onSelect={() => props.onSelectVersion(turn.version)}
                selected={props.selectedVersion === turn.version}
                turn={turn}
              />
            ))
          ) : (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              Describe an extension below to start this conversation.
            </p>
          )}
        </div>
        <div className="border-t border-border p-2.5">
          <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-1.5 pl-2.5 focus-within:border-primary">
            <textarea
              aria-label="Message"
              className="max-h-28 min-h-[22px] w-full flex-1 resize-none bg-transparent py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={props.active ? `Refine ${props.active.title}, or describe a new extension…` : 'Describe a new extension…'}
              rows={1}
              value={prompt}
            />
            <button
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              disabled={props.busy || !prompt.trim()}
              onClick={send}
              type="button"
            >
              {props.busy ? 'Working…' : 'Send'}
            </button>
          </div>
          <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground/80">
            <label className="flex items-center gap-1.5">
              <input checked={includeEagle} onChange={(event) => setIncludeEagle(event.target.checked)} type="checkbox" />
              Eagle API
            </label>
            <label className="flex items-center gap-1.5">
              <input checked={includeWebApi} onChange={(event) => setIncludeWebApi(event.target.checked)} type="checkbox" />
              Web API
            </label>
          </div>
        </div>
      </AccordionSection>
    </aside>
  );
}
