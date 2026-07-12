/**
 * Persistence for AI conversations under ~/.powereagle/conversations. Each
 * conversation folder holds one v<N>/ per generated version in the
 * installed-plugin format (manifest.json + index.mjs) so the existing disk
 * loader can load any version; index.json records the conversations and their
 * turn history. Legacy one-shot attempts under aidriven/ are intentionally
 * ignored (owner decision, 2026-07-11).
 */
import { joinPath, homeDir, ensureDir, writeTextFile, readTextFile, pathExists } from '../host/install/fs-bridge';

/** One conversation turn: the instruction and what its generation produced. */
export interface Turn {
  version: number;
  instruction: string;
  name: string;
  status: 'ok' | 'failed';
  error?: string;
}

/** One conversation: an ordered history of generated versions. */
export interface Conversation {
  id: string;
  title: string;
  turns: Turn[];
}

/** The powereagle home directory (~/.powereagle) — shared with the install layer. */
export function powereagleHome(): string {
  return joinPath(homeDir(), '.powereagle');
}

/** The conversations folder under the powereagle home. */
export function conversationsDir(home: string = powereagleHome()): string {
  return joinPath(home, 'conversations');
}

function indexFile(home: string): string {
  return joinPath(conversationsDir(home), 'index.json');
}

/** All recorded conversations (empty on any read/parse failure). */
export function listConversations(home: string = powereagleHome()): Conversation[] {
  const file = indexFile(home);
  if (!pathExists(file)) return [];
  try {
    const parsed = JSON.parse(readTextFile(file)) as unknown;
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch {
    return [];
  }
}

/** Upsert one conversation in the index, keeping its position (new ones append). */
export function saveConversation(home: string, conversation: Conversation): void {
  const all = listConversations(home);
  const index = all.findIndex((entry) => entry.id === conversation.id);
  if (index === -1) all.push(conversation);
  else all[index] = conversation;
  ensureDir(conversationsDir(home));
  writeTextFile(indexFile(home), JSON.stringify(all, null, 2));
}

/** The on-disk folder of one generated version. */
export function versionDir(home: string, conversationId: string, version: number): string {
  return joinPath(joinPath(conversationsDir(home), conversationId), `v${version}`);
}

/** Write one generated version in the installed-plugin format; returns its dir. */
export function writeVersion(
  home: string,
  conversationId: string,
  version: number,
  plugin: { name: string; source: string },
): string {
  const dir = versionDir(home, conversationId, version);
  ensureDir(dir);
  const manifest = {
    name: plugin.name,
    version: '1.0.0',
    description: `AI-generated: ${plugin.name}`,
    id: `${conversationId}-v${version}`,
    main: 'index.mjs',
  };
  writeTextFile(joinPath(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeTextFile(joinPath(dir, 'index.mjs'), plugin.source);
  return dir;
}

/** Read back the source of one generated version (for refinement prompts). */
export function readVersionSource(home: string, conversationId: string, version: number): string {
  return readTextFile(joinPath(versionDir(home, conversationId, version), 'index.mjs'));
}

/** Remove one turn from a conversation's history; its folder stays on disk. */
export function deleteTurn(home: string, conversationId: string, version: number): Conversation {
  const conversation = listConversations(home).find((entry) => entry.id === conversationId);
  if (!conversation) throw new Error(`unknown conversation: ${conversationId}`);
  const updated: Conversation = {
    ...conversation,
    turns: conversation.turns.filter((turn) => turn.version !== version),
  };
  saveConversation(home, updated);
  return updated;
}
