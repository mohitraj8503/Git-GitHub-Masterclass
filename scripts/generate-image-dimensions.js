const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.cwd();
const imageDir = path.join(root, "public", "images");
const entries = {};

for (const file of fs.readdirSync(imageDir).sort()) {
  const fullPath = path.join(imageDir, file);
  if (!fs.statSync(fullPath).isFile()) continue;
  if (!/\.(png|jpe?g|webp|svg)$/i.test(file)) continue;

  try {
    const output = execFileSync("identify", ["-format", "%w %h", fullPath], {
      encoding: "utf8",
    }).trim();
    const [width, height] = output.split(/\s+/).map(Number);
    if (width > 0 && height > 0) {
      entries[`/images/${file}`] = { width, height };
    }
  } catch {
    // Keep generation resilient for any asset ImageMagick cannot inspect.
  }
}

const body = `export const imageDimensions: Record<string, { width: number; height: number }> = ${JSON.stringify(entries, null, 2)};\n`;
fs.mkdirSync(path.join(root, "lib"), { recursive: true });
fs.writeFileSync(path.join(root, "lib", "imageDimensions.ts"), body);
