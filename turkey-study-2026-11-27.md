# Study — Turkey Run Game ($250) — 27 Nov 2026

## Kompetisi (verified live 09:19–09:30 WIB 27 Nov)
- Slug `turkey-run-game-01`, "Make the best turkey escape game", $250 GRATIS, deadline 09:00 WIB 29 Nov 2026.
- Blind rounds 4: R1 cutoff 21:00 WIB 27 Nov, R2 09:00 WIB 28 Nov, R3 21:00 WIB 28 Nov, R4 final = deadline.
- Hadiah top 20: #1 $50, #2 $35, #3 $25, #4–10 $10, #11–20 $7. Total entri 0 saat studi.
- Format final: top 80 dev board → screen (no-op di bounty ini) → 3 Swiss → racing → playoff top 22. Finalist review: top 3 dimainkan LANGSUNG oleh tim make.fun offline (game HARUS benar-benar load + playable offline).
- Kit bundle_sha256 `3f826f97f7b7409fa9c8d419884ba199b52fb41f8e56356a54b61a870027fc7c` == kompetisi (verified via kit.json).
- Judge: z-ai/glm-5.3-flash, pairwise, 2 calls per pair (both orders), margin 1–5. Kriteria berurutan: (1) game turkey escape LENGKAP di screenshot (title screen, run in play + HUD score/distance/lives, end screen caught/escaped + restart; turkey lari dari jadi makan malam Thanksgiving, dikejar farmer, hindari oven + carving knife); (2) fun/depth (dodging, jumping, hiding, outrunning; farmer chase/search/corner; bahaya + stage makin sulit farmyard → kitchen; alasan main lagi); (3) feel/polish (kontrol responsif, feedback spotted/hit/caught/escaped, sound, menu, tuning fair); (4) look/originality (art Thanksgiving sendiri, palet autumn, comic timing, terbaca sekilas); (5) structure (source terpisah per file, satu job jelas, nama deskriptif).
- Judge view: contact sheet screenshot (cover besar di atas, sisanya kecil di bawah) + outline source (1.536 token). SCREENSHOT MENDOMINASI penilaian.
- Gate: game_files (≤993 file/dir, ≤48 MiB, index.html ≤1 MiB), references (TANPA network — semua file lokal/data: URI), screenshots (3–4, ≤256 KiB tiap file, long side ≤1280, short side ≥480), dossier_matches (byte-for-byte buildDossier), js_parses (info saja).
- Program main.ts (Node 22, stdlib only, 10 dtk, 1 CPU, 1024 MB) jalan 2×, output byte-identik. /output mount point — JANGAN PERNAH hapus foldernya (EBUSY, pelajaran Cooking Game + Flight Game).
- Feed/comments: 0 entri — belum ada yang bisa dibaca. Top LB: belum ada.

## Starter (kit) — yang BOLEH dan TIDAK BOLEH
- Starter "Turkey Dodge": game canvas 2D sederhana (turkey hindari pisau jatuh + tangkap jagung). Dossier-nya byte-for-byte house game #2 — submit starter apa adanya = main sebagai house game, tidak masuk playoff. WAJIB bangun game sendiri yang jelas lebih baik.
- BOLEH: pakai layout starter (main.ts pattern, serve.ts, vendor/makefun-game.ts TIDAK BOLEH diubah — wajib copy apa adanya, LICENSE).
- TIDAK BOLEH: baca/copy kode game starter (game/src/*.js) — builder tulis game dari nol. Screenshot starter TIDAK BOLEH dipakai ulang (copy = diskualifikasi).
- main.ts starter: copy game/ + screenshots/ ke /output + tulis dossier.json via buildDossier (caps: text_max_bytes 163840, screenshots max 4 / max_bytes 262144, game_max_files 993, game_max_bytes 50331648, game_path_max_bytes 1000). Builder tulis main.ts SENDIRI dari pola ini (jangan buka starter/main.ts).
- Screenshots: real render game sendiri di browser, via `?shot=start|play|end&seed=1` (pola starter shots.json) untuk scene deterministik. Headless Chromium tersedia di ~/.cache/ms-playwright (chromium-1255 + chromium_headless_shell-1255).

## Desain yang dipilih — "Gobble Dash: Farmyard to Kitchen Escape"
- Side-view runner/stealth hybrid, Canvas 2D murni, art vektor sendiri, palet autumn (oranye/coklat/kuning hangat).
- 3 stage makin sulit: (1) Farmyard — lari, lompat pagar + jerami, farmer patroli; (2) Barn — sembunyi di tumpukan jerami (tombol Down), hindari perkakas jatuh; (3) Kitchen — hindari semburan oven + pisau carving + rolling pin.
- Mekanik: lari/lompat (Arrow/WASD + Space), dash (Shift/klik), sembunyi (Down di haystack/semak), kumpul jagung (+skor), 3 nyawa, meter jarak, timer, skor.
- Farmer AI: patrol → vision cone → spotted (alarm) → chase (lebih cepat) → corner; sembunyi putus line-of-sight. Kalau ketangkap → end screen "Caught!" + restart; sampai ujung kitchen → "Escaped!" + skor.
- HUD: skor, jarak, nyawa (hati), nama stage, kecepatan. Title screen, pause, end screen.
- Suara: WebAudio synthesized (gobble, langkah, alarm, whoosh oven, fanfare menang) — TANPA file audio.
- File (satu job jelas tiap file): game/index.html, game/src/config.js, random.js, input.js, world.js, farmer.js, turkey.js, hazards.js, render.js, audio.js, shots.js, main.js. main.ts, serve.ts, vendor/makefun-game.ts, screenshots/ (4: 1-play.jpg cover = aksi kejar-kejaran + HUD, 2-title.jpg, 3-kitchen.jpg, 4-end.jpg), README.md, LICENSE, package.json {"type":"module"}.
- Screenshot 1280×800 JPEG q~80 (≤256 KiB), cover = scene play paling informatif (HUD + turkey + farmer + oven + pisau + stage).

## Pelajaran terkait (Flight Game / Cooking Game)
- JANGAN rmSync/rmdir folder /output — bersihkan isinya saja.
- Verifikasi grader-style SEBELUM lapor: plain node, tanpa browser, fresh output dir, double-run byte-identik.
- Kit check 14/0 TIDAK memvalidasi badge README — parent cek manual URL badge.
- Bundle SATU PER SATU (jangan paralel — OOM).
