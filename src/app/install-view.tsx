/**
 * The install tab: install an extension by name (owner/repo for GitHub) and
 * manage the registered sources, side by side. Input state lives here; the
 * shell owns the actual install/add-bucket calls.
 */
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

function SectionLabel(props: { children: string }): JSX.Element {
  return (
    <h3 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
      {props.children}
    </h3>
  );
}

export function InstallView(props: {
  buckets: string[];
  onInstall(name: string): void;
  onAddBucket(url: string): void;
}): JSX.Element {
  const [installInput, setInstallInput] = useState('');
  const [bucketInput, setBucketInput] = useState('');

  function handleInstall(): void {
    if (!installInput.trim()) return;
    props.onInstall(installInput.trim());
    setInstallInput('');
  }

  function handleAddBucket(): void {
    if (!bucketInput.trim()) return;
    props.onAddBucket(bucketInput.trim());
    setBucketInput('');
  }

  return (
    <section className="min-w-0 flex-1 overflow-y-auto p-5 md:p-6">
      <div className="grid max-w-3xl gap-7 md:grid-cols-2">
        <div>
          <SectionLabel>install an extension</SectionLabel>
          <div className="flex gap-2">
            <Input className="flex-1" onChange={(event) => setInstallInput(event.target.value)} placeholder="owner/repo or name" value={installInput} />
            <Button onClick={handleInstall} type="button">Install</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            GitHub extensions install as <span className="font-mono">owner/repo</span>. Anything from your sources installs by name.
          </p>
        </div>
        <div>
          <SectionLabel>sources</SectionLabel>
          <ul className="space-y-1.5">
            {props.buckets.length ? props.buckets.map((url) => (
              <li className="rounded-lg border border-border px-3 py-2 font-mono text-[11.5px] text-muted-foreground" key={url}>{url}</li>
            )) : <li className="px-1 py-2 text-sm text-muted-foreground">No sources yet — add one below.</li>}
          </ul>
          <div className="mt-2.5 flex gap-2">
            <Input className="flex-1" onChange={(event) => setBucketInput(event.target.value)} placeholder="Path or file:// url" value={bucketInput} />
            <Button onClick={handleAddBucket} type="button" variant="outline">Add source</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
