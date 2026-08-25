import fs from "node:fs";
import crypto from "node:crypto";

/**
 * Records a hash of every file the public actually receives.
 *
 * Run it before and after a reorganisation: if the two manifests match, the
 * site's visitors saw no change, whatever moved on disk. Paths are joined with
 * "/" by hand rather than path.join so the two runs compare cleanly.
 */

const PUBLIC = [
  "index.html", "privacy.html", "404.html", "favicon.svg",
  "apple-touch-icon.png", "robots.txt", "sitemap.xml",
  "assets", "vendor", "images",
];

const root = process.argv[3] ?? ".";
const out = [];

function walk(rel) {
  const full = root === "." ? rel : root + "/" + rel;
  if (!fs.existsSync(full)) return;
  if (fs.statSync(full).isDirectory()) {
    for (const entry of fs.readdirSync(full).sort()) walk(rel + "/" + entry);
    return;
  }
  const hash = crypto.createHash("sha1").update(fs.readFileSync(full)).digest("hex");
  out.push(hash + "  " + rel);
}

for (const p of PUBLIC) walk(p);

out.sort();
fs.writeFileSync(process.argv[2], out.join("\n") + "\n");
console.log("  " + out.length + " public files recorded from " + root);
