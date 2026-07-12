/**
 * The iris status light — the shell's signature element and the enable toggle
 * in one control. Amber glow = contributing, hollow ring = off, red = failed
 * (not clickable: there is nothing to enable). Color is never the only signal:
 * the accessible name always carries the state.
 */

export function IrisToggle(props: {
  name: string;
  on: boolean;
  failed?: boolean;
  size?: 'sm' | 'lg';
  onToggle(): void;
}): JSX.Element {
  const { name, on, failed = false, size = 'sm', onToggle } = props;
  const label = failed ? `${name} failed to load` : `${on ? 'Disable' : 'Enable'} ${name}`;
  const dotState = failed
    ? 'bg-destructive shadow-[0_0_6px_1px_hsl(var(--destructive)/0.45)]'
    : on
      ? 'bg-primary shadow-[0_0_6px_1px_hsl(var(--primary)/0.55)]'
      : 'border-[1.5px] border-muted-foreground/70';
  return (
    <button
      aria-checked={on}
      aria-label={label}
      className={`${size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'} inline-flex flex-shrink-0 items-center justify-center rounded-full transition-colors ${failed ? '' : 'hover:bg-primary/15'}`}
      disabled={failed}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      role="switch"
      title={label}
      type="button"
    >
      <span className={`${size === 'lg' ? 'h-[11px] w-[11px]' : 'h-2 w-2'} rounded-full ${dotState}`} />
    </button>
  );
}
