import matched from '../data/dramas.json'
import sources from '../data/source-titles.json'

export interface Drama {
  id: string
  year: number
  title: string
  originalTitle: string
  poster: string | null
  tmdbId: number | null
  needsReview: boolean
}

const matchedByKey = new Map(
  matched.map((drama) => [`${drama.year}:${drama.sourceTitle}`, drama]),
)

export const YEARS = Object.keys(sources).map(Number).sort((a, b) => a - b)

export const CATALOG: Record<number, Drama[]> = Object.fromEntries(
  Object.entries(sources).map(([yearText, titles]) => {
    const year = Number(yearText)
    return [year, titles.map((sourceTitle, index) => {
      const drama = matchedByKey.get(`${year}:${sourceTitle}`)
      return drama ? {
        id: drama.tmdbId ? `${year}-${drama.tmdbId}` : drama.id,
        year,
        title: drama.displayTitle || sourceTitle,
        originalTitle: drama.originalTitle,
        poster: drama.poster,
        tmdbId: drama.tmdbId,
        needsReview: false,
      } : {
        id: `${year}-pending-${index + 1}`,
        year,
        title: sourceTitle,
        originalTitle: '海报资料待复核',
        poster: null,
        tmdbId: null,
        needsReview: true,
      }
    })]
  }),
)

export const ALL_DRAMAS = YEARS.flatMap((year) => CATALOG[year])
