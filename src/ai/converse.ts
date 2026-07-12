/**
 * Orchestrate one conversation turn: build the prompt (fresh generation for a
 * new conversation, refinement over the selected version's source for a
 * follow-up), ask the model, persist the version, try to load it, and record
 * the turn — ok or failed — in the conversation. Collaborators are injected so
 * the pipeline tests without a real model, filesystem home, or webview import.
 */
import { buildGenerationPrompt, buildRefinementPrompt, type PromptOptions } from './prompt';
import { generatePluginSource, type AiModule } from './ai-bridge';
import {
  listConversations,
  saveConversation,
  writeVersion,
  readVersionSource,
  type Conversation,
  type Turn,
} from './conversation-store';
import { loadDiskPlugin, nativeImport, type ModuleImporter } from '../host/install/disk-plugin';
import type { HostContext } from '../app/host-service';
import type { AnyPluginModule } from '../plugins/builtins';

/** Collaborators for one conversation turn. */
export interface ConverseDeps {
  ai: AiModule;
  home: string;
  context: HostContext;
  newId: () => string;
  importModule?: ModuleImporter;
  promptOptions?: PromptOptions;
}

/** What to run: a fresh instruction, or a refinement of one existing version. */
export interface TurnInput {
  conversationId?: string;
  /** The version whose source the refinement builds on; omit for a fresh generation. */
  baseVersion?: number;
  instruction: string;
}

/** Outcome of a turn: the updated conversation, the recorded turn, and the module if it loaded. */
export interface TurnResult {
  conversation: Conversation;
  turn: Turn;
  module?: AnyPluginModule;
}

/** A short, display-friendly title derived from the first instruction. */
function titleFrom(instruction: string): string {
  return instruction.trim().slice(0, 40) || 'untitled';
}

/** Run one turn: generate or refine, persist the version, and record the outcome. */
export async function runTurn(input: TurnInput, deps: ConverseDeps): Promise<TurnResult> {
  const existing = input.conversationId
    ? listConversations(deps.home).find((entry) => entry.id === input.conversationId)
    : undefined;
  const conversation: Conversation = existing ?? { id: deps.newId(), title: titleFrom(input.instruction), turns: [] };

  const prompt =
    existing && input.baseVersion !== undefined
      ? buildRefinementPrompt(
          input.instruction,
          readVersionSource(deps.home, conversation.id, input.baseVersion),
          deps.context,
          deps.promptOptions,
        )
      : buildGenerationPrompt(input.instruction, deps.context, deps.promptOptions);

  const source = await generatePluginSource(prompt, deps.ai);
  const version = (conversation.turns[conversation.turns.length - 1]?.version ?? 0) + 1;
  const dir = writeVersion(deps.home, conversation.id, version, { name: conversation.title, source });

  let turn: Turn;
  let module: AnyPluginModule | undefined;
  try {
    module = await loadDiskPlugin(dir, { importModule: deps.importModule ?? nativeImport });
    turn = { version, instruction: input.instruction, name: module.manifest.name || conversation.title, status: 'ok' };
  } catch (error) {
    turn = {
      version,
      instruction: input.instruction,
      name: conversation.title,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const updated: Conversation = { ...conversation, turns: [...conversation.turns, turn] };
  saveConversation(deps.home, updated);
  return { conversation: updated, turn, module };
}
