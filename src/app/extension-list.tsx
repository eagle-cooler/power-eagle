/**
 * The installed tab's filter list: search, kind/source chips, and one row per
 * extension. The row's iris light is the enable toggle; filter state lives
 * here because it only shapes this list.
 */
import { useState } from 'react';
import { Input } from '../components/ui/input';
import type { PluginSummary } from './host-service';
import { IrisToggle } from './iris-toggle';

type KindFilter = 'all' | 'visual' | 'service' | 'styling';
const KIND_CHIPS: KindFilter[] = ['all', 'visual', 'service', 'styling'];
type SourceFilter = 'all' | 'builtin' | 'disk';
const SOURCE_CHIPS: Array<{ value: SourceFilter; label: string }> = [
  { value: 'all', label: 'any source' },
  { value: 'builtin', label: 'built-in' },
  { value: 'disk', label: 'installed' },
];

/** A filter chip: mono microtype, amber when active. */
function Chip(props: { label: string; active: boolean; onClick(): void }): JSX.Element {
  return (
    <button
      aria-pressed={props.active}
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.04em] ${props.active ? 'border-primary bg-primary font-semibold text-primary-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'}`}
      onClick={props.onClick}
      type="button"
    >
      {props.label}
    </button>
  );
}

export function ExtensionList(props: {
  plugins: PluginSummary[];
  selectedId: string | null;
  disabled: ReadonlySet<string>;
  failures: Record<string, string>;
  onSelect(id: string): void;
  onToggle(id: string): void;
}): JSX.Element {
  const { plugins, selectedId, disabled, failures, onSelect, onToggle } = props;
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [filter, setFilter] = useState('');

  const needle = filter.trim().toLowerCase();
  const visible = plugins.filter(
    (plugin) =>
      (kindFilter === 'all' || plugin.kind === kindFilter) &&
      (sourceFilter === 'all' ||
        (sourceFilter === 'builtin' ? plugin.source === 'builtin' : plugin.source !== 'builtin')) &&
      (!needle || plugin.name.toLowerCase().includes(needle) || plugin.id.includes(needle)),
  );

  function renderRow(plugin: PluginSummary): JSX.Element {
    const failure = failures[plugin.id];
    const isOff = disabled.has(plugin.id);
    return (
      <div
        aria-selected={selectedId === plugin.id}
        className={`mb-1 flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 ${selectedId === plugin.id ? 'border-border bg-card' : 'border-transparent hover:bg-card'} ${isOff ? 'opacity-60' : ''}`}
        key={plugin.id}
        onClick={() => onSelect(plugin.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(plugin.id);
          }
        }}
        role="option"
        tabIndex={0}
      >
        <IrisToggle failed={Boolean(failure)} name={plugin.name} on={!isOff && !failure} onToggle={() => onToggle(plugin.id)} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[13.5px] font-medium text-foreground">
            {plugin.name}
            <span className="rounded border border-border px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
              {plugin.kind}
            </span>
          </span>
          <span className={`block truncate font-mono text-[10.5px] ${failure ? 'text-destructive' : 'text-muted-foreground/80'}`}>
            {failure ? 'failed to load' : `${plugin.id} · v${plugin.version} · ${plugin.source === 'builtin' ? 'built-in' : plugin.source}`}
          </span>
        </span>
      </div>
    );
  }

  return (
    <aside className="flex w-[264px] flex-shrink-0 flex-col border-r border-border">
      <div className="grid gap-2 border-b border-border p-3">
        <Input
          className="w-full"
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search extensions"
          type="search"
          value={filter}
        />
        <div aria-label="Filter by kind" className="flex flex-wrap gap-1" role="group">
          {KIND_CHIPS.map((kind) => (
            <Chip active={kindFilter === kind} key={kind} label={kind} onClick={() => setKindFilter(kind)} />
          ))}
        </div>
        <div aria-label="Filter by source" className="flex flex-wrap gap-1" role="group">
          {SOURCE_CHIPS.map((source) => (
            <Chip active={sourceFilter === source.value} key={source.value} label={source.label} onClick={() => setSourceFilter(source.value)} />
          ))}
        </div>
      </div>
      <div aria-label="Extensions" className="flex-1 overflow-y-auto p-2" role="listbox">
        {visible.length ? visible.map(renderRow) : (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            Nothing matches. Clear a filter, or find new extensions in the install tab.
          </div>
        )}
      </div>
    </aside>
  );
}
