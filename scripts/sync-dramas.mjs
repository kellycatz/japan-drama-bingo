import { loadEnv, readJson, sleep, writeJson } from './lib.mjs'

await loadEnv()
const token = process.env.TMDB_ACCESS_TOKEN
if (!token) throw new Error('缺少 TMDB_ACCESS_TOKEN，请检查 .env')

const sources = await readJson('data/source-titles.json', {})
const overrides = await readJson('data/manual-overrides.json', {})
const saved = await readJson('data/dramas.json', [])
const byKey = new Map(saved.map((item) => [`${item.year}:${item.sourceTitle}`, item]))
const review = []
let matched = 0
let cached = 0

function scoreCandidate(item, year) {
  const firstYear = Number(item.first_air_date?.slice(0, 4))
  let score = 0
  if (firstYear === year) score += 6
  else if (Math.abs(firstYear - year) === 1) score += 1
  if (item.origin_country?.includes('JP')) score += 4
  if (item.original_language === 'ja') score += 3
  if (item.poster_path) score += 1
  return score
}

for (const [yearText, titles] of Object.entries(sources)) {
  const year = Number(yearText)
  for (const sourceTitle of titles) {
    const key = `${year}:${sourceTitle}`
    if (byKey.has(key)) { cached += 1; continue }

    const override = overrides[key]
    if (override) {
      if (override.localPoster) {
        byKey.set(key, { id: `${year}-${override.id}`, year, sourceTitle, displayTitle: override.displayTitle || sourceTitle, title: override.displayTitle || sourceTitle, originalTitle: override.originalTitle || sourceTitle, tmdbId: null, firstAirDate: `${year}-01-01`, posterPath: null, poster: override.localPoster })
        matched += 1
        continue
      }
      const response = await fetch(`https://api.themoviedb.org/3/tv/${override.tmdbId}?language=zh-CN`, { headers: { Authorization: `Bearer ${token}`, accept: 'application/json' } })
      if (!response.ok) throw new Error(`TMDB 人工覆盖请求失败：${key} HTTP ${response.status}`)
      const item = await response.json()
      byKey.set(key, { id: `${year}-${item.id}`, year, sourceTitle, displayTitle: override.displayTitle || null, title: item.name || sourceTitle, originalTitle: item.original_name, tmdbId: item.id, firstAirDate: item.first_air_date, posterPath: item.poster_path, poster: item.poster_path ? `/posters/${year}/${item.id}.jpg` : null })
      matched += 1
      await sleep(80)
      continue
    }

    const url = new URL('https://api.themoviedb.org/3/search/tv')
    url.searchParams.set('query', sourceTitle)
    url.searchParams.set('language', 'zh-CN')
    url.searchParams.set('first_air_date_year', String(year))
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, accept: 'application/json' } })
    if (!response.ok) throw new Error(`TMDB 请求失败：HTTP ${response.status}`)
    const body = await response.json()
    const ranked = body.results.map((item) => ({ item, score: scoreCandidate(item, year) })).sort((a, b) => b.score - a.score)
    const best = ranked[0]

    if (!best || best.score < 11 || (ranked[1] && best.score === ranked[1].score)) {
      review.push({ year, sourceTitle, reason: !best ? 'no-results' : 'uncertain-match', candidates: ranked.slice(0, 3).map(({ item, score }) => ({ tmdbId: item.id, name: item.name, originalName: item.original_name, firstAirDate: item.first_air_date, originCountry: item.origin_country, posterPath: item.poster_path, score })) })
    } else {
      const item = best.item
      const record = { id: `${year}-${item.id}`, year, sourceTitle, title: item.name || sourceTitle, originalTitle: item.original_name, tmdbId: item.id, firstAirDate: item.first_air_date, posterPath: item.poster_path, poster: item.poster_path ? `/posters/${year}/${item.id}.jpg` : null }
      byKey.set(key, record)
      matched += 1
    }
    await sleep(80)
  }
  await writeJson('data/dramas.json', [...byKey.values()].sort((a, b) => a.year - b.year || a.sourceTitle.localeCompare(b.sourceTitle, 'zh-CN')))
  await writeJson('data/review-needed.json', review)
  console.log(`${year}: 完成`)
}

console.log(`\n总计 ${Object.values(sources).flat().length}｜缓存 ${cached}｜新增匹配 ${matched}｜待复核 ${review.length}`)
