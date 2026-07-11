import { expect } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { definePlugin } from '../src/sdui/activate';
import { resolveHostContext, type HostService, type PluginSummary } from '../src/app/host-service';
import type { AnyPluginModule } from '../src/plugins/builtins';
import type { WidgetComponent } from '../src/sdui/render/render';

const feature = await loadFeature('features/installed-contributors.feature');

const summary = (id: string, kind: PluginSummary['kind']): PluginSummary => ({
  id,
  name: id,
  version: '1.0.0',
  source: 'github',
  kind,
  launchable: kind === 'visual',
});

// A fake install-backed host service: `installed` are the on-disk summaries and
// `modules` maps an installed id to the module its loadModule resolves. An id
// mapped to a thrown error models a load failure; a missing id resolves to
// undefined like the real service.
function fakeService(installed: PluginSummary[], modules: Record<string, AnyPluginModule | Error>): HostService {
  return {
    listAvailable: () => installed,
    listBuckets: () => [],
    install: () => {},
    addBucket: () => {},
    loadModule: async (id) => {
      const found = modules[id];
      if (found instanceof Error) throw found;
      return found;
    },
  };
}

const greeter = definePlugin({
  manifest: { id: 'greeter', name: 'Greeter', version: '1.0.0', service: true },
  provides: () => ({ hello: (name: string) => `hi ${name}` }),
}) as unknown as AnyPluginModule;

describeFeature(feature, ({ Scenario }) => {
  Scenario('An enabled installed service plugin contributes its methods', ({ Given, When, Then }) => {
    const service = fakeService([summary('greeter', 'service')], { greeter });
    let ctx: Awaited<ReturnType<typeof resolveHostContext>>;
    Given('a host service whose install index has a service plugin "greeter" on disk', () => {});
    When('the host context is resolved with nothing disabled', async () => {
      ctx = await resolveHostContext(service);
    });
    Then('the context exposes the "greeter" service', () => {
      const greeterSvc = ctx.services.greeter as { hello(name: string): string };
      expect(greeterSvc.hello('sam')).toBe('hi sam');
      expect(ctx.contributions.greeter.services?.methods).toContain('hello');
    });
  });

  Scenario('An enabled installed styling plugin contributes its widgets and theme', ({ Given, When, Then }) => {
    const neonBadge: WidgetComponent = () => null;
    const neon = definePlugin({
      manifest: { id: 'neon', name: 'Neon', version: '1.0.0', styling: true },
      widgets: { neonBadge },
      theme: { tokens: { color: { neon: '#0ff' } }, widgets: {} },
    }) as unknown as AnyPluginModule;
    const service = fakeService([summary('neon', 'styling')], { neon });
    let ctx: Awaited<ReturnType<typeof resolveHostContext>>;
    Given('a host service whose install index has a styling plugin "neon" on disk', () => {});
    When('the host context is resolved with nothing disabled', async () => {
      ctx = await resolveHostContext(service);
    });
    Then('the context includes the "neon" widget type and records its theme', () => {
      expect(ctx.widgets.neonBadge).toBe(neonBadge);
      expect(ctx.contributions.neon.theme).toBe(true);
    });
  });

  Scenario('A disabled installed contributor is excluded from the context', ({ Given, When, Then }) => {
    const service = fakeService([summary('greeter', 'service')], { greeter });
    let ctx: Awaited<ReturnType<typeof resolveHostContext>>;
    Given('a host service whose install index has a service plugin "greeter" on disk', () => {});
    When('the host context is resolved with "greeter" disabled', async () => {
      ctx = await resolveHostContext(service, new Set(['greeter']));
    });
    Then('the context does not expose the "greeter" service', () => {
      expect(ctx.services.greeter).toBeUndefined();
      expect(ctx.contributions.greeter).toBeUndefined();
    });
  });

  Scenario('An installed styling contribution overrides a bundled one on collision', ({ Given, When, Then }) => {
    const installedBadge: WidgetComponent = () => null;
    const rebadge = definePlugin({
      manifest: { id: 'rebadge', name: 'Rebadge', version: '1.0.0', styling: true },
      widgets: { badge: installedBadge },
    }) as unknown as AnyPluginModule;
    const service = fakeService([summary('rebadge', 'styling')], { rebadge });
    let ctx: Awaited<ReturnType<typeof resolveHostContext>>;
    Given('a host service whose install index has a styling plugin that redefines the "badge" widget', () => {});
    When('the host context is resolved with nothing disabled', async () => {
      ctx = await resolveHostContext(service);
    });
    Then('the context\'s "badge" widget is the installed one, not the bundled Extras badge', () => {
      expect(ctx.widgets.badge).toBe(installedBadge);
    });
  });

  Scenario('A contributor that fails to activate is skipped and the others still contribute', ({ Given, When, Then }) => {
    const broken = definePlugin({
      manifest: { id: 'broken', name: 'Broken', version: '1.0.0', service: true },
      provides: () => {
        throw new Error('activation blew up');
      },
    }) as unknown as AnyPluginModule;
    const service = fakeService(
      [summary('greeter', 'service'), summary('broken', 'service')],
      { greeter, broken },
    );
    let ctx: Awaited<ReturnType<typeof resolveHostContext>>;
    Given('a host service with a working service plugin "greeter" and a broken contributor on disk', () => {});
    When('the host context is resolved with nothing disabled', async () => {
      ctx = await resolveHostContext(service);
    });
    Then('the context still exposes the "greeter" service', () => {
      const greeterSvc = ctx.services.greeter as { hello(name: string): string };
      expect(greeterSvc.hello('sam')).toBe('hi sam');
      expect(ctx.services.broken).toBeUndefined();
    });
  });

  Scenario('A contributor that fails is reported so the shell can show why', ({ Given, When, Then }) => {
    const broken = definePlugin({
      manifest: { id: 'broken', name: 'Broken', version: '1.0.0', service: true },
      provides: () => {
        throw new Error('activation blew up');
      },
    }) as unknown as AnyPluginModule;
    const service = fakeService(
      [summary('greeter', 'service'), summary('broken', 'service')],
      { greeter, broken },
    );
    let ctx: Awaited<ReturnType<typeof resolveHostContext>>;
    Given('a host service with a working service plugin "greeter" and a broken contributor on disk', () => {});
    When('the host context is resolved with nothing disabled', async () => {
      ctx = await resolveHostContext(service);
    });
    Then('the context reports the broken contributor as failed with its error', () => {
      expect(ctx.failures.broken).toContain('activation blew up');
      expect(ctx.failures.greeter).toBeUndefined();
    });
  });
});
