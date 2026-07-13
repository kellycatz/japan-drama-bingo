import fs from 'node:fs/promises'
import path from 'node:path'
import { readJson, root, sleep } from './lib.mjs'

const dramas = await readJson('data/dramas.json', [])
let downloaded = 0
let skipped = 0

for (const drama of dramas) {
  if (!drama.posterPath) continue
  const directory = path.join(root, 'public', 'posters', String(drama.year))
  const target = path.join(directory, `${drama.tmdbId}.jpg`)
  await fs.mkdir(directory, { recursive: true })
  try { await fs.access(target); skipped += 1; continue } catch {}
  const response = await fetch(`https://image.tmdb.org/t/p/w500${drama.posterPath}`)
  if (!response.ok) { console.warn(`下载失败：${drama.year} ${drama.sourceTitle}`); continue }
  await fs.writeFile(target, Buffer.from(await response.arrayBuffer()))
  downloaded += 1
  await sleep(50)
}

console.log(`海报下载 ${downloaded}｜已存在 ${skipped}`)
