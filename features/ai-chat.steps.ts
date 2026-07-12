// @vitest-environment jsdom
import { expect } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { AiTab } from '../src/ai/ai-tab';
import { definePlugin } from '../src/sdui/activate';
import { w } from '../src/sdui/widget';
import type { Conversation, Turn } from '../src/ai/conversation-store';
import type { TurnResult } from '../src/ai/converse';
import type { HostContext } from '../src/app/host-service';
import type { AnyPluginModule } from '../src/plugins/builtins';

const feature = await loadFeature('features/ai-chat.feature');

const context = { services: {}, widgets: {}, theme: {}, contributions: {}, failures: {} } as unknown as HostContext;

/** A generated plugin whose view carries a recognizable marker. */
function markedModule(marker: string): AnyPluginModule {
  return definePlugin({
    manifest: { id: 'gen', name: 'Gen', version: '1.0.0' },
    state: () => ({}),
    view: () => w('text', { data: marker }),
  }) as unknown as AnyPluginModule;
}

const okTurn = (version: number, instruction: string): Turn => ({
  version,
  instruction,
  name: 'Gen',
  status: 'ok',
});

function renderTab(options: {
  conversations?: Conversation[];
  runTurn?: (input: { conversationId?: string; baseVersion?: number; instruction: string }) => Promise<TurnResult>;
  loadVersion?: (conversationId: string, version: number) => Promise<AnyPluginModule | undefined>;
  deleteTurn?: (conversationId: string, version: number) => Conversation;
}): void {
  render(
    React.createElement(AiTab, {
      context,
      eagle: {},
      conversations: options.conversations ?? [],
      runTurn: options.runTurn ?? (async () => { throw new Error('runTurn not faked'); }),
      loadVersion: options.loadVersion ?? (async () => undefined),
      deleteTurn: options.deleteTurn ?? ((id) => { throw new Error(`deleteTurn not faked for ${id}`); }),
    }),
  );
}

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => cleanup());

  Scenario('Sending a message renders the generated extension on the stage', ({ Given, When, Then }) => {
    Given('the AI tab with a model that generates a working extension', () => {
      renderTab({
        runTurn: async ({ instruction }) => ({
          conversation: { id: 'c1', title: 'Gen', turns: [okTurn(1, instruction)] },
          turn: okTurn(1, instruction),
          module: markedModule('GENERATED V1 VIEW'),
        }),
      });
    });
    When('I send the message "make a todo list"', async () => {
      await userEvent.type(screen.getByPlaceholderText(/describe a new extension/iu), 'make a todo list');
      await userEvent.click(screen.getByRole('button', { name: /send/iu }));
    });
    Then('the generated view is on the stage with a v1 chip in the thread', async () => {
      expect(await screen.findByText('GENERATED V1 VIEW')).toBeTruthy();
      expect(screen.getByRole('button', { name: /v1/iu })).toBeTruthy();
    });
  });

  Scenario('Selecting an earlier version chip puts that version on the stage', ({ Given, When, Then }) => {
    const conversation: Conversation = {
      id: 'c1',
      title: 'Gen',
      turns: [okTurn(1, 'make a todo list'), okTurn(2, 'add a clear button')],
    };
    Given('the AI tab with a conversation that has versions v1 and v2', () => {
      renderTab({
        conversations: [conversation],
        loadVersion: async (_id, version) => markedModule(version === 1 ? 'V1 VIEW' : 'V2 VIEW'),
      });
    });
    When('I select the v1 chip in the thread', async () => {
      await userEvent.click(await screen.findByRole('button', { name: /v1/iu }));
    });
    Then("v1's view is on the stage", async () => {
      expect(await screen.findByText('V1 VIEW')).toBeTruthy();
    });
  });

  Scenario('A failed turn shows its error and can be deleted', ({ Given, When, Then }) => {
    const failed: Turn = { version: 2, instruction: 'break it', name: 'Gen', status: 'failed', error: 'not a valid plugin module' };
    const conversation: Conversation = { id: 'c1', title: 'Gen', turns: [okTurn(1, 'make a todo list'), failed] };
    Given('the AI tab with a conversation whose last turn failed', async () => {
      renderTab({
        conversations: [conversation],
        loadVersion: async () => markedModule('V1 VIEW'),
        deleteTurn: (_id, version) => ({
          ...conversation,
          turns: conversation.turns.filter((turn) => turn.version !== version),
        }),
      });
      expect(await screen.findByText(/not a valid plugin module/)).toBeTruthy();
    });
    When('I delete the failed turn from the thread', async () => {
      await userEvent.click(screen.getByRole('button', { name: /delete failed turn/iu }));
    });
    Then('the failed turn disappears from the thread', () => {
      expect(screen.queryByText(/not a valid plugin module/)).toBeNull();
    });
  });

  Scenario('Collapsing the chat panel gives the stage the full width', ({ Given, When, Then }) => {
    Given('the AI tab with a model that generates a working extension', () => {
      renderTab({});
    });
    When('I collapse the chat panel', async () => {
      await userEvent.click(screen.getByRole('button', { name: /collapse chat/iu }));
    });
    Then('the thread is hidden and the stage remains', () => {
      expect(screen.queryByPlaceholderText(/describe a new extension/iu)).toBeNull();
      expect(screen.getByLabelText(/render stage/iu)).toBeTruthy();
    });
  });
});
