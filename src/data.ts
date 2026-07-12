export interface Drama {
  id: string
  tmdbId: number
  year: 2012
  title: string
  originalTitle: string
  poster: string
}

export const DRAMAS: Drama[] = [
  { id: 'legal-high', tmdbId: 46234, year: 2012, title: 'Legal High', originalTitle: 'リーガル・ハイ', poster: '/posters/legal-high.jpg' },
  { id: 'lucky-seven', tmdbId: 44727, year: 2012, title: '幸运七人组', originalTitle: 'ラッキーセブン', poster: '/posters/lucky-seven.jpg' },
  { id: 'kekkon-shinai', tmdbId: 65326, year: 2012, title: '不结婚', originalTitle: '結婚しない', poster: '/posters/kekkon-shinai.jpg' },
  { id: 'doctor-x', tmdbId: 46052, year: 2012, title: 'Doctor-X', originalTitle: 'ドクターX ～外科医・大門未知子～', poster: '/posters/doctor-x.jpg' },
  { id: 'kodoku-no-gurume', tmdbId: 55582, year: 2012, title: '孤独的美食家', originalTitle: '孤独のグルメ', poster: '/posters/kodoku-no-gurume.jpg' },
  { id: 'rich-man-poor-woman', tmdbId: 45938, year: 2012, title: '富贵男与贫穷女', originalTitle: 'リッチマン、プアウーマン', poster: '/posters/rich-man-poor-woman.jpg' },
  { id: 'locked-room', tmdbId: 46084, year: 2012, title: '上锁的房间', originalTitle: '鍵のかかった部屋', poster: '/posters/locked-room.jpg' },
  { id: 'late-blooming-sunflower', tmdbId: 45922, year: 2012, title: '迟开的向日葵', originalTitle: '遅咲きのヒマワリ', poster: '/posters/late-blooming-sunflower.jpg' },
  { id: 'second-to-last-love', tmdbId: 42180, year: 2012, title: '倒数第二次恋爱', originalTitle: '最後から二番目の恋', poster: '/posters/second-to-last-love.jpg' },
  { id: 'papadol', tmdbId: 46029, year: 2012, title: '爸爸是偶像', originalTitle: 'パパドル！', poster: '/posters/papadol.jpg' },
]
