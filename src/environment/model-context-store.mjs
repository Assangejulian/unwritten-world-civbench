// One temporary SQLite file per match. Full model text stays here; the live prompt
// receives a compressed summary of older rows plus the newest exchanges.
import {DatabaseSync} from 'node:sqlite';
import {gzipSync, gunzipSync} from 'node:zlib';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

// Start shrinking a live prompt only around this size. Earlier cuts dropped the
// observation the model was still using. 200_000 is an estimate, not a provider tokenizer.
export const COMPRESSION_TOKENS = 200_000;

export function estimateTokens(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  let tokens = 0;
  for (let index = 0; index < text.length; index++) tokens += text.charCodeAt(index) > 0x2e80 ? 1 : 0.25;
  return Math.ceil(tokens);
}

export function digestLine(kind, full) {
  if (typeof full === 'string') return `${kind}: ${full.replace(/\s+/g, ' ').slice(0, 160)}`;
  const action = full?.arguments?.action || full?.action;
  const result = full?.result && typeof full.result === 'object' ? full.result : full;
  if (Array.isArray(full?.arguments?.commands)) return full.arguments.commands.map((command, index) => {
    const receipt = result?.results?.[index];
    return digestLine(kind, {arguments: command, result: receipt || {status: 'not_executed'}});
  }).join('; ');
  const type = action?.type || result?.action?.type;
  const status = result?.status || (full?.ok === false ? 'rejected' : '');
  const error = result?.error ? String(result.error).slice(0, 80) : '';
  const target = Object.fromEntries(['unit','city','item','tile','target','targetUnit','targetCity','tech','civic','mission','player','spy','state','governor','agenda','topic','choice','currency'].filter(key => action?.[key] != null).map(key => [key, action[key]]));
  const parts = [kind, type, Object.keys(target).length ? JSON.stringify(target) : '', status, error].filter(Boolean);
  if (parts.length === 1) return `${kind}: ${JSON.stringify(full).replace(/\s+/g, ' ').slice(0, 160)}`;
  return parts.join(' ');
}

export function contextPath(root, matchId) {
  const safe = String(matchId || 'match').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) || 'match';
  return path.join(root, 'output', 'model-context', `${safe}.sqlite`);
}

export class ModelContextStore {
  constructor(file) {
    mkdirSync(path.dirname(file), {recursive: true});
    this.file = file;
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      PRAGMA busy_timeout=3000;
      PRAGMA synchronous=NORMAL;
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        seat INTEGER NOT NULL,
        turn INTEGER,
        role TEXT NOT NULL,
        kind TEXT,
        text TEXT NOT NULL,
        body BLOB NOT NULL,
        tokens INTEGER NOT NULL DEFAULT 0,
        hot INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY,
        seat INTEGER NOT NULL,
        through_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        before_bytes INTEGER NOT NULL,
        after_bytes INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY,
        seat INTEGER NOT NULL,
        turn INTEGER,
        type TEXT NOT NULL,
        name TEXT,
        ok INTEGER,
        fidelity TEXT,
        text TEXT NOT NULL,
        time TEXT NOT NULL
      );
    `);
    try {this.db.exec('ALTER TABLE messages ADD COLUMN tokens INTEGER NOT NULL DEFAULT 0');} catch {}
  }

  appendMessage({seat, turn, role, kind, text, body}) {
    const json = Buffer.from(JSON.stringify(body ?? text));
    const tokens = estimateTokens(body ?? text);
    const info = this.db.prepare('INSERT INTO messages (seat, turn, role, kind, text, body, tokens, hot) VALUES (?, ?, ?, ?, ?, ?, ?, 1)').run(seat, turn ?? null, role, kind || role, String(text || '').slice(0, 4000), gzipSync(json), tokens);
    return {id: Number(info.lastInsertRowid), bytes: json.length};
  }

  appendEvent({seat, turn, type, name, ok, fidelity, text}) {
    const info = this.db.prepare('INSERT INTO events (seat, turn, type, name, ok, fidelity, text, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      seat, turn ?? null, type, name || null, ok == null ? null : ok ? 1 : 0, fidelity || null, String(text || ''), new Date().toISOString()
    );
    return Number(info.lastInsertRowid);
  }

  compress(seat, {minTokens = COMPRESSION_TOKENS, reserveTokens = 50_000} = {}) {
    const rows = this.db.prepare('SELECT id, role, kind, text, body, tokens FROM messages WHERE seat=? AND hot=1 ORDER BY id').all(seat);
    const weights = rows.map(row => row.tokens || estimateTokens(row.text));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (total < minTokens) return null;
    let keepWeight = 0;
    let keepFrom = rows.length;
    for (let index = rows.length - 1; index >= 0; index--) {
      if (keepFrom < rows.length && keepWeight + weights[index] > reserveTokens) break;
      keepWeight += weights[index];
      keepFrom = index;
    }
    if (keepFrom <= 0) return null;
    const old = rows.slice(0, keepFrom);
    let before = 0;
    const previous = this.db.prepare('SELECT text FROM summaries WHERE seat=? ORDER BY id DESC LIMIT 1').get(seat);
    before += Buffer.byteLength(previous?.text || '');
    const lines = previous?.text ? previous.text.split('\n') : [];
    for (const row of old) {
      let full = row.text;
      let raw = Buffer.byteLength(row.text);
      try {
        const json = gunzipSync(row.body);
        raw = json.length;
        full = JSON.parse(json.toString('utf8'));
      } catch {}
      before += raw;
      // Raw provider reasoning remains archived for the observer, not replayed as memory.
      if (row.role !== 'reasoning') lines.push(digestLine(row.kind, full));
    }
    const recentLines = [...new Set(lines.filter(Boolean))];
    while (recentLines.length > 1 && recentLines.join('\n').length > 8000) recentLines.shift();
    const text = recentLines.join('\n').slice(-8000);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('INSERT INTO summaries (seat, through_id, text, before_bytes, after_bytes) VALUES (?, ?, ?, ?, ?)').run(seat, old.at(-1).id, text, before, Buffer.byteLength(text));
      this.db.prepare('UPDATE messages SET hot=0 WHERE seat=? AND id<=? AND hot=1').run(seat,old.at(-1).id);
      this.db.exec('COMMIT');
    } catch (error) {this.db.exec('ROLLBACK');throw error;}
    return {messages: old.length, beforeBytes: before, afterBytes: Buffer.byteLength(text), tokens: total};
  }

  workingSet(seat) {
    const summary = this.db.prepare('SELECT text, before_bytes AS beforeBytes, after_bytes AS afterBytes FROM summaries WHERE seat=? ORDER BY id DESC LIMIT 1').get(seat);
    const recent = this.db.prepare("SELECT turn, kind, text, body FROM messages WHERE seat=? AND hot=1 AND role!='reasoning' ORDER BY id DESC LIMIT 8").all(seat).reverse().map(row => {
      let body = row.text;
      try {body = JSON.parse(gunzipSync(row.body).toString('utf8'));} catch {}
      return {turn: row.turn, kind: row.kind, text: digestLine(row.kind, body)};
    });
    return {summary: summary?.text || '', recent, compression: summary ? {beforeBytes: summary.beforeBytes, afterBytes: summary.afterBytes} : null};
  }

  events(seat, after = 0) {
    return this.db.prepare('SELECT id, turn, type, name, ok, fidelity, text, time FROM events WHERE seat=? AND id>? ORDER BY id').all(seat, after).map(row => ({
      id: row.id, turn: row.turn, type: row.type, name: row.name, fidelity: row.fidelity, text: row.text, time: row.time, ...(row.ok == null ? {} : {ok: !!row.ok})
    }));
  }

  stats(seat) {
    const messages = this.db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(body)), 0) AS bytes FROM messages WHERE seat=?').get(seat);
    const hot = this.db.prepare('SELECT COUNT(*) AS n FROM messages WHERE seat=? AND hot=1').get(seat);
    const events = this.db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(text)), 0) AS textBytes FROM events WHERE seat=?').get(seat);
    return {file: this.file, messages: messages.n, gzipBytes: messages.bytes, hot: hot.n, events: events.n, eventTextBytes: events.textBytes};
  }

  close() {this.db.close();}
}
