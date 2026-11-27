// main.ts — Gobble Dash entrypoint for the make.fun grader.
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier. Node 22 standard library only.
// The output directory is a mount point on the grader, so it is never
// deleted — only its CONTENTS are cleared, never the directory itself
// (EBUSY lesson from Cooking Game + Flight Game slot 1).
// Paths are resolved from this file's own location, NOT from the process
// working directory: the submitted slot-1 entry failed dev grading with
// exit code 1 in 0.5s because cpSync('game', ...) threw ENOENT when the
// grader ran it from a different cwd. Flight Game slot 2 fixed the same
// failure with this absolute-path pattern and graded FINISHED.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (existsSync(out)) {
  for (const entry of readdirSync(out)) {
    rmSync(join(out, entry), { recursive: true, force: true });
  }
} else {
  mkdirSync(out, { recursive: true });
}
mkdirSync(join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log('wrote ' + out + '/dossier.json (' + statSync(join(out, 'dossier.json')).size + ' bytes)');
