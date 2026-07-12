import { expect } from 'vitest';
import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import * as nodeOs from 'node:os';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { runTurn, type ConverseDeps } from '../src/ai/converse';
import { listConversations, deleteTurn, versionDir, type Conversation } from '../src/ai/conversation-store';
import { loadDiskPlugin } from '../src/host/install/disk-plugin';
import { definePlugin } from '../src/sdui/activate';
import { w } from '../src/sdui/widget';
import type { AiModule } from '../src/ai/ai-bridge';
import type { HostContext } from '../src/app/host-service';
import type { AnyPluginModule } from '../src/plugins/builtins';

const feature = await loadFeature('features/ai-conversations.feature');

// The fs-bridge resolves node modules through window.require (Eagle renderer);
// tests provide the real node modules against a temp home.
(globalThis as unknown as { window: { require: (m: string) => unknown } }).window = {
  require: (moduleName: string) => {
    if (moduleName === 'fs') return nodeFs;
    if (moduleName === 'path') return nodePath;
    if (moduleName === 'os') return nodeOs;
    throw new Error(`Unexpected module request: ${moduleName}`);
  },
};

const context = { services: {}, widgets: {}, theme: {}, contributions: {}, failures: {} } as unknown as HostContext;

/** A fake Eagle AI SDK that returns queued sources and records every prompt. */
function fakeAi(sources: string[], prompts: string[]): AiModule {
  return {
    getDefaultModel: () => 'chat-model',
    getModel: () => ({}),
    generateText: async ({ prompt }) => {
      prompts.push(prompt);
      return { text: sources.shift() ?? 'export default {}' };
    },
  };
}

/** A loadable module the fake importer returns for any version dir. */
const okModule = (): { default: AnyPluginModule } => ({
  default: definePlugin({
    manifest: { id: 'gen', name: 'Gen', version: '1.0.0' },
    state: () => ({}),
    view: () => w('text', { data: 'generated' }),
  }) as unknown as AnyPluginModule,
});

function freshHome(): string {
  return nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'pe-ai-'));
}

const V1_SOURCE = 'export default definePlugin({ /* v1 marker */ })';
const V2_SOURCE = 'export default definePlugin({ /* v2 marker */ })';

interface World {
  home: string;
  prompts: string[];
  deps: ConverseDeps;
  conversation?: Conversation;
}

function makeWorld(sources: string[], importModule = async (): Promise<unknown> => okModule()): World {
  const home = freshHome();
  const prompts: string[] = [];
  let n = 0;
  return {
    home,
    prompts,
    deps: {
      ai: fakeAi(sources, prompts),
      home,
      context,
      newId: () => `conv-${(n += 1)}`,
      importModule,
    },
  };
}

describeFeature(feature, ({ Scenario }) => {
  Scenario('A first message starts a conversation and generates v1', ({ Given, When, Then }) => {
    let world: World;
    Given('a model that returns a valid plugin module', () => {
      world = makeWorld([V1_SOURCE]);
    });
    When('a turn runs with the instruction "make a todo list"', async () => {
      const result = await runTurn({ instruction: 'make a todo list' }, world.deps);
      world.conversation = result.conversation;
    });
    Then('a conversation exists with one ok turn at v1 whose module loads', async () => {
      const conv = world.conversation!;
      expect(conv.turns).toHaveLength(1);
      expect(conv.turns[0]).toMatchObject({ version: 1, status: 'ok', instruction: 'make a todo list' });
      const loaded = await loadDiskPlugin(versionDir(world.home, conv.id, 1), { importModule: async () => okModule() });
      expect(loaded.manifest.name).toBe('Gen');
    });
  });

  Scenario('A follow-up refines the selected version with its source in the prompt', ({ Given, When, Then }) => {
    let world: World;
    Given('a conversation whose v1 was generated', async () => {
      world = makeWorld([V1_SOURCE, V2_SOURCE]);
      const result = await runTurn({ instruction: 'make a todo list' }, world.deps);
      world.conversation = result.conversation;
    });
    When('a refining turn runs against v1 with the instruction "add a clear button"', async () => {
      const result = await runTurn(
        { conversationId: world.conversation!.id, baseVersion: 1, instruction: 'add a clear button' },
        world.deps,
      );
      world.conversation = result.conversation;
    });
    Then("the model prompt contains v1's source and the conversation gains an ok v2", () => {
      expect(world.prompts[1]).toContain('v1 marker');
      expect(world.prompts[1]).toContain('add a clear button');
      expect(world.conversation!.turns).toHaveLength(2);
      expect(world.conversation!.turns[1]).toMatchObject({ version: 2, status: 'ok' });
    });
  });

  Scenario("Refining an older version branches from that version's source", ({ Given, When, Then }) => {
    let world: World;
    Given('a conversation with generated versions v1 and v2', async () => {
      world = makeWorld([V1_SOURCE, V2_SOURCE, 'export default definePlugin({ /* v3 */ })']);
      const first = await runTurn({ instruction: 'make a todo list' }, world.deps);
      const second = await runTurn(
        { conversationId: first.conversation.id, baseVersion: 1, instruction: 'restyle it' },
        world.deps,
      );
      world.conversation = second.conversation;
    });
    When('a refining turn runs against v1', async () => {
      const result = await runTurn(
        { conversationId: world.conversation!.id, baseVersion: 1, instruction: 'go back to basics' },
        world.deps,
      );
      world.conversation = result.conversation;
    });
    Then("the model prompt contains v1's source and not v2's", () => {
      const lastPrompt = world.prompts[2];
      expect(lastPrompt).toContain('v1 marker');
      expect(lastPrompt).not.toContain('v2 marker');
    });
  });

  Scenario('A turn whose module fails to load is recorded as failed', ({ Given, When, Then }) => {
    let world: World;
    let loads = 0;
    Given('a conversation whose v1 was generated', async () => {
      // The importer succeeds for v1, then refuses the refined module.
      world = makeWorld([V1_SOURCE, 'garbage'], async () => {
        loads += 1;
        if (loads > 1) throw new Error('not a valid plugin module');
        return okModule();
      });
      const result = await runTurn({ instruction: 'make a todo list' }, world.deps);
      world.conversation = result.conversation;
    });
    When('a refining turn runs and the produced module does not load', async () => {
      const result = await runTurn(
        { conversationId: world.conversation!.id, baseVersion: 1, instruction: 'break it' },
        world.deps,
      );
      world.conversation = result.conversation;
    });
    Then('the conversation records a failed v2 with the error and v1 still loads', async () => {
      const conv = world.conversation!;
      expect(conv.turns[1]).toMatchObject({ version: 2, status: 'failed' });
      expect(conv.turns[1].error).toContain('not a valid plugin module');
      const loaded = await loadDiskPlugin(versionDir(world.home, conv.id, 1), { importModule: async () => okModule() });
      expect(loaded.manifest.name).toBe('Gen');
    });
  });

  Scenario('A failed turn can be deleted from the conversation', ({ Given, When, Then }) => {
    let world: World;
    Given('a conversation with an ok v1 and a failed v2', async () => {
      let loads = 0;
      world = makeWorld([V1_SOURCE, 'garbage'], async () => {
        loads += 1;
        if (loads > 1) throw new Error('not a valid plugin module');
        return okModule();
      });
      const first = await runTurn({ instruction: 'make a todo list' }, world.deps);
      const second = await runTurn(
        { conversationId: first.conversation.id, baseVersion: 1, instruction: 'break it' },
        world.deps,
      );
      world.conversation = second.conversation;
    });
    When('the failed turn is deleted', () => {
      world.conversation = deleteTurn(world.home, world.conversation!.id, 2);
    });
    Then('the conversation has only the ok v1 turn', () => {
      expect(world.conversation!.turns).toHaveLength(1);
      expect(world.conversation!.turns[0]).toMatchObject({ version: 1, status: 'ok' });
    });
  });

  Scenario('Conversations persist across reloads', ({ Given, When, Then }) => {
    let world: World;
    let listed: Conversation[] = [];
    Given('a conversation whose v1 was generated', async () => {
      world = makeWorld([V1_SOURCE]);
      const result = await runTurn({ instruction: 'make a todo list' }, world.deps);
      world.conversation = result.conversation;
    });
    When('conversations are listed fresh from disk', () => {
      listed = listConversations(world.home);
    });
    Then('the conversation is listed with its turn history', () => {
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe(world.conversation!.id);
      expect(listed[0].turns).toHaveLength(1);
      expect(listed[0].turns[0].instruction).toBe('make a todo list');
    });
  });
});
