import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const sources = [
  "LF-1024x684.png",
  "inovymini.jpg",
  "inovycompact1.jpg",
  "inovycompact2.jpg",
  "LF1150-1.jpg",
  "LF1150-2.jpg",
  "inovy-milk.jpeg",
  "LF1200-Inovy and Milk.jpg",
];

await mkdir("optimized", { recursive: true });

for (const source of sources) {
  const output = path.join("optimized", path.basename(source).replace(/\.(png|jpe?g)$/i, ".webp"));
  await sharp(source)
    .rotate()
    .webp({ quality: 80, effort: 5, smartSubsample: true })
    .toFile(output);
  const { size: inputBytes } = await import("node:fs/promises").then(fs => fs.stat(source));
  const { size: outputBytes } = await import("node:fs/promises").then(fs => fs.stat(output));
  const reduction = ((1 - outputBytes / inputBytes) * 100).toFixed(1);
  console.log(`${source}: ${(inputBytes / 1024).toFixed(1)} KB -> ${(outputBytes / 1024).toFixed(1)} KB (${reduction}% smaller)`);
}
