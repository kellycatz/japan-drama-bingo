import fs from 'node:fs/promises'
import path from 'node:path'

export const root = path.resolve(import.meta.dirname, '..')

export async function loadEnv() {
  const text = await fs.readFile(path.join(root, '.env'), 'utf8').catch(() => '')
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
}

export async function readJson(file, fallback) {
  return JSON.parse(await fs.readFile(path.join(root, file), 'utf8').catch(() => JSON.stringify(fallback)))
}

export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true })
  await fs.writeFile(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`)
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
