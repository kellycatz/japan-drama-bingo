import { CATALOG, YEARS } from './catalog'

const WIDTH = 1180
const HEIGHT = 2797
const PAD = 38
const LABEL_WIDTH = 72
const ROW_HEIGHT = 122
const GRID_TOP = 258

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`海报加载失败: ${src}`))
    image.src = src
  })
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Safari 未能创建 PNG 文件')), 'image/png')
  })
}

export async function renderMobilePoster(watched: Set<string>): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器不支持 Canvas')

  context.fillStyle = '#efe5cf'
  context.fillRect(0, 0, WIDTH, HEIGHT)
  context.fillStyle = '#1b1915'
  context.font = '8px monospace'
  context.textAlign = 'right'
  context.fillText('DRAMA ARCHIVE · PERSONAL EDITION', WIDTH - PAD, 48)
  context.fillRect(PAD, 58, WIDTH - PAD * 2, 1)

  context.fillStyle = '#e9b73e'
  context.fillRect(PAD, 78, 95, 100)
  context.strokeStyle = '#1b1915'
  context.lineWidth = 2
  context.strokeRect(PAD, 78, 95, 100)
  context.fillStyle = '#1b1915'
  context.textAlign = 'center'
  context.font = '700 48px serif'
  context.fillText('20', PAD + 50, 143)
  context.textAlign = 'left'
  context.fillStyle = '#c8392c'
  context.font = '10px monospace'
  context.fillText('ドラマ記録', 160, 100)
  context.fillStyle = '#1b1915'
  context.font = '900 50px serif'
  context.fillText('日剧世代', 160, 155)

  context.strokeStyle = '#c8392c'
  context.lineWidth = 3
  context.beginPath()
  context.arc(WIDTH - PAD - 52, 128, 49, 0, Math.PI * 2)
  context.stroke()
  context.fillStyle = '#c8392c'
  context.textAlign = 'center'
  context.font = '700 38px monospace'
  context.fillText(String(watched.size), WIDTH - PAD - 52, 132)
  context.font = '9px monospace'
  context.fillText('/ 200 已看', WIDTH - PAD - 52, 153)

  context.textAlign = 'left'
  context.font = '700 22px monospace'
  context.fillText('2005—2024', PAD, 225)
  context.fillRect(PAD + 170, 218, WIDTH - PAD * 2 - 170, 1)

  const gridWidth = WIDTH - PAD * 2 - LABEL_WIDTH
  const cellWidth = gridWidth / 10
  for (let yearIndex = 0; yearIndex < YEARS.length; yearIndex += 1) {
    const year = YEARS[yearIndex]
    const rowY = GRID_TOP + yearIndex * ROW_HEIGHT
    context.fillStyle = '#e9b73e'
    context.fillRect(PAD, rowY, LABEL_WIDTH, ROW_HEIGHT)
    context.strokeStyle = '#1b1915'
    context.lineWidth = 2
    context.strokeRect(PAD, rowY, LABEL_WIDTH, ROW_HEIGHT)
    context.fillStyle = '#1b1915'
    context.textAlign = 'center'
    context.font = '700 15px monospace'
    context.fillText(String(year), PAD + LABEL_WIDTH / 2, rowY + 56)
    const yearCount = CATALOG[year].filter((drama) => watched.has(drama.id)).length
    context.font = '8px monospace'
    context.fillText(`${yearCount}/10`, PAD + LABEL_WIDTH / 2, rowY + 75)

    for (let index = 0; index < CATALOG[year].length; index += 1) {
      const drama = CATALOG[year][index]
      const x = PAD + LABEL_WIDTH + index * cellWidth
      const isWatched = watched.has(drama.id)
      context.save()
      context.beginPath()
      context.rect(x, rowY, cellWidth, ROW_HEIGHT)
      context.clip()
      context.fillStyle = '#000'
      context.fillRect(x, rowY, cellWidth, ROW_HEIGHT)
      if (drama.poster) {
        try {
          const image = await loadImage(drama.poster)
          context.filter = isWatched ? 'none' : 'grayscale(1)'
          context.globalAlpha = isWatched ? 1 : 0.35
          drawCover(context, image, x, rowY, cellWidth, ROW_HEIGHT)
          context.filter = 'none'
          context.globalAlpha = 1
        } catch {
          // Keep the black fallback cell if an individual poster cannot load.
        }
      }
      const gradient = context.createLinearGradient(0, rowY + 52, 0, rowY + ROW_HEIGHT)
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(1, 'rgba(0,0,0,.92)')
      context.fillStyle = gradient
      context.fillRect(x, rowY + 50, cellWidth, ROW_HEIGHT - 50)
      context.fillStyle = '#fff'
      context.textAlign = 'left'
      context.font = '700 8px serif'
      context.fillText(drama.title.slice(0, 12), x + 7, rowY + ROW_HEIGHT - 9, cellWidth - 12)
      context.strokeStyle = '#1b1915'
      context.lineWidth = 2
      context.strokeRect(x, rowY, cellWidth, ROW_HEIGHT)
      context.restore()
    }
  }

  context.fillStyle = '#1b1915'
  context.textAlign = 'left'
  context.font = '9px monospace'
  context.fillText('部分海报及影视资料来自 TMDB', PAD, HEIGHT - 34)
  return canvasToBlob(canvas)
}
