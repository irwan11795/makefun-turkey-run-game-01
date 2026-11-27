// main.ts — the entrypoint: copies game/ and screenshots/ into the output
// directory and writes dossier.json with buildDossier. Node 22 standard
// library only. The output directory is a mount point on the grader, so it
// is never deleted — only created and copied into.
import { cpSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { buildDossier } from './vendor/makefun-game.ts';

const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(out, { recursive: true });
cpSync('game', out + '/game', { recursive: true });
cpSync('screenshots', out + '/screenshots', { recursive: true });
writeFileSync(
  out + '/dossier.json',
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log('wrote ' + out + '/dossier.json (' + statSync(out + '/dossier.json').size + ' bytes)');
