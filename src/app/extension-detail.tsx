/**
 * The detail panel for one selected extension: a header (iris toggle, name,
 * state word, mono meta line) and a kind-specific body that speaks to the
 * user — what a service provides, what a styling plugin adds, why a failed
 * extension is unavailable. The visual kind's live viewport is passed in as
 * children because launching stays with the shell.
 */
import type { ReactNode } from 'react';
import type { PluginSummary, PluginContribution } from './host-service';
import { IrisToggle } from './iris-toggle';

function SectionLabel(props: { children: ReactNode }): JSX.Element {
  return (
    <h3 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
      {props.children}
    </h3>
  );
}

function Token(props: { name: string; kind: string }): JSX.Element {
  return (
    <span className="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-foreground">
      {props.name}
      <small className="ml-1.5 text-[10px] text-muted-foreground/80">{props.kind}</small>
    </span>
  );
}

function FailureBody(props: { plugin: PluginSummary; failure: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
      {props.plugin.name} didn&apos;t load, so nothing it contributes is available.
      <code className="mt-1.5 block font-mono text-xs text-destructive">{props.failure}</code>
      <div className="mt-2 text-xs text-muted-foreground">
        Reinstall it from the install tab, or remove it if you no longer use it.
      </div>
    </div>
  );
}

function ServiceBody(props: { plugin: PluginSummary; contribution?: PluginContribution }): JSX.Element {
  const methods = props.contribution?.services?.methods ?? [];
  const vars = props.contribution?.services?.vars ?? [];
  return (
    <div>
      <SectionLabel>provides — rt.service(&apos;{props.plugin.id}&apos;)</SectionLabel>
      {methods.length || vars.length ? (
        <div className="flex flex-wrap gap-1.5">
          {methods.map((name) => <Token key={name} kind="method" name={name} />)}
          {vars.map((name) => <Token key={name} kind="value" name={name} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">This service exposes nothing yet.</p>
      )}
    </div>
  );
}

function StylingBody(props: { contribution?: PluginContribution }): JSX.Element {
  const widgets = props.contribution?.widgets ?? [];
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>adds widgets</SectionLabel>
        {widgets.length ? (
          <div className="flex flex-wrap gap-1.5">
            {widgets.map((name) => <Token key={name} kind="widget" name={name} />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No widget types.</p>
        )}
      </div>
      <div>
        <SectionLabel>theme</SectionLabel>
        <p className="text-sm text-muted-foreground">
          {props.contribution?.theme ? 'Ships a theme, folded into the host theme.' : 'No theme.'}
        </p>
      </div>
    </div>
  );
}

export function ExtensionDetail(props: {
  plugin: PluginSummary;
  contribution?: PluginContribution;
  failure?: string;
  isDisabled: boolean;
  onToggle(): void;
  /** The live viewport for a visual extension, rendered by the shell. */
  children?: ReactNode;
}): JSX.Element {
  const { plugin, contribution, failure, isDisabled, onToggle, children } = props;
  const stateWord = failure ? 'failed' : isDisabled ? 'off' : 'active';
  const source = plugin.source === 'builtin' ? 'built-in' : plugin.source;

  let body: ReactNode;
  if (failure) {
    body = <FailureBody failure={failure} plugin={plugin} />;
  } else if (isDisabled) {
    body = (
      <p className="text-sm text-muted-foreground">
        {plugin.name} is off — click its light to turn it back on.
      </p>
    );
  } else if (plugin.kind === 'service') {
    body = <ServiceBody contribution={contribution} plugin={plugin} />;
  } else if (plugin.kind === 'styling') {
    body = <StylingBody contribution={contribution} />;
  } else {
    body = children;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <IrisToggle failed={Boolean(failure)} name={plugin.name} on={!isDisabled && !failure} onToggle={onToggle} size="lg" />
        <h2 className="text-lg font-semibold tracking-[-0.02em]">{plugin.name}</h2>
        <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/80">{stateWord}</span>
      </div>
      <div className="mb-4 ml-10 font-mono text-[11px] text-muted-foreground/80">
        {plugin.id} · v{plugin.version} · {source} · {plugin.kind}
      </div>
      <div className="ml-10">{body}</div>
    </div>
  );
}
