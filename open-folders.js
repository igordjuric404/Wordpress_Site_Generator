import fs from "node:fs";
import { execFile } from "node:child_process";
import readline from "node:readline";

const BASE_URL = "http://localhost:8080";
const BATCH_SIZE = 10;

const opener =
  process.platform === "darwin" ? "open" :
  process.platform === "win32" ? "cmd" :
  "xdg-open";

function openUrl(url) {
  if (process.platform === "win32") {
    execFile(opener, ["/c", "start", "", url]);
  } else {
    execFile(opener, [url]);
  }
}

const folders = fs.readdirSync(process.cwd(), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort((a, b) => a.localeCompare(b));

if (folders.length === 0) {
  console.log("No subfolders found.");
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

let i = 0;
while (i < folders.length) {
  const end = Math.min(i + BATCH_SIZE, folders.length);
  console.log(`\nOpening folders ${i + 1}-${end} of ${folders.length} (batch size ${BATCH_SIZE})`);

  for (let j = i; j < end; j++) {
    const folder = folders[j];
    const url = `${BASE_URL}/${encodeURIComponent(folder)}`;
    console.log(" ", url);
    openUrl(url);
  }

  i = end;
  if (i < folders.length) {
    const ans = (await ask(`Press Enter to open next ${BATCH_SIZE} (or type q to quit): `)).trim().toLowerCase();
    if (ans === "q") break;
  }
}

rl.close();
