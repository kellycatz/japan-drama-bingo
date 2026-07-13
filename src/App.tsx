import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, Download, Film, RotateCcw, Sparkles } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { ALL_DRAMAS, CATALOG, YEARS, type Drama } from './catalog'
import { renderMobilePoster } from './mobilePosterExport'

const STORAGE_KEY = 'japan-tv-bingo:watched'

function loadWatched(): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(stored) ? stored.filter((id) => ALL_DRAMAS.some((drama) => drama.id === id)) : [])
  } catch {
    return new Set()
  }
}

function PosterImage({ drama, eager = false }: { drama: Drama; eager?: boolean }) {
  const [failed, setFailed] = useState(false)

  if (failed || !drama.poster) {
    return <div className="poster-fallback"><Film aria-hidden="true" /><span>{drama.originalTitle}</span></div>
  }

  return <img src={drama.poster} alt={`${drama.title} 海报`} draggable={false} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
}

function TmdbCredit() {
  return (
    <p className="tmdb-credit">
      部分海报及影视资料来自 <strong>TMDB</strong>
    </p>
  )
}

function App() {
  const debugMode = new URLSearchParams(window.location.search).has('debug')
  const [watched, setWatched] = useState<Set<string>>(loadWatched)
  const [view, setView] = useState<'select' | 'poster'>('select')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const posterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...watched]))
  }, [watched])

  const toggle = (id: string) => {
    setWatched((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const showPoster = () => {
    setView('poster')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const downloadPoster = async () => {
    if (!posterRef.current || exporting) return
    const poster = posterRef.current
    setExporting(true)
    setExportError('')
    poster.classList.add('is-exporting')
    let exportStage = '准备海报'
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      await document.fonts.ready
      exportStage = '加载海报图片'
      const images = [...poster.querySelectorAll('img')]
      await Promise.all(images.map((image) => image.complete ? image.decode().catch(() => undefined) : new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => resolve(), { once: true })
      })))
      const exportWidth = 1180
      const exportHeight = poster.scrollHeight
      const isMobileDevice = window.matchMedia('(max-width: 650px)').matches || /iPhone|iPad|iPod/i.test(navigator.userAgent)
      exportStage = '渲染 PNG'
      const blob = isMobileDevice ? await renderMobilePoster(watched) : await toBlob(poster, {
        cacheBust: true,
        pixelRatio: isMobileDevice ? 1 : 2,
        skipFonts: true,
        width: exportWidth,
        height: exportHeight,
        backgroundColor: '#efe5cf',
        style: {
          width: `${exportWidth}px`,
          maxWidth: 'none',
          margin: '0',
          boxShadow: 'none',
          transform: 'none',
        },
      })
      if (!blob) throw new Error('浏览器未能创建 PNG 文件')

      exportStage = '保存文件'
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `我的日剧世代Bingo-${watched.size}of${ALL_DRAMAS.length}.png`
      link.href = objectUrl
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      console.error('海报生成失败', error)
      const detail = error instanceof Error ? error.message : String(error)
      const debugInfo = [
        `阶段: ${exportStage}`,
        `错误: ${detail}`,
        `设备: ${navigator.userAgent}`,
        `视口: ${window.innerWidth}x${window.innerHeight}`,
        `海报: ${poster.scrollWidth}x${poster.scrollHeight}`,
        `已看: ${watched.size}/${ALL_DRAMAS.length}`,
        error instanceof Error && error.stack ? `堆栈:\n${error.stack}` : '',
      ].filter(Boolean).join('\n')
      if (debugMode) setExportError(debugInfo)
      else window.alert(`海报生成失败（${exportStage}）\n${detail.slice(0, 160)}`)
    } finally {
      poster.classList.remove('is-exporting')
      setExporting(false)
    }
  }

  if (view === 'poster') {
    return (
      <main className="poster-page">
        <div className="poster-toolbar" aria-label="海报操作">
          <button className="button button-ghost" onClick={() => setView('select')}><ArrowLeft size={18} />返回修改</button>
          <button className="button button-primary" onClick={downloadPoster} disabled={exporting}>
            <Download size={18} />{exporting ? '正在生成…' : '下载高清 PNG'}
          </button>
        </div>

        {debugMode && exportError && (
          <section className="export-debug" aria-live="assertive">
            <strong>海报生成调试信息</strong>
            <pre>{exportError}</pre>
            <button className="button button-ghost" onClick={() => navigator.clipboard.writeText(exportError)}>复制错误信息</button>
          </section>
        )}

        <div className="share-poster all-years-poster" ref={posterRef}>
          <div className="poster-registration">DRAMA ARCHIVE · PERSONAL EDITION</div>
          <header className="share-header">
            <div className="year-block"><span>世代</span><strong>20</strong><small>年</small></div>
            <div>
              <p className="eyebrow">ドラマ記録</p>
              <h1>日剧世代<br /></h1>
            </div>
            <div className="score-stamp"><strong>{watched.size}</strong><span>/ 200</span><small>已看</small></div>
          </header>

          <div className="share-rule"><span>2005—2024</span><i /><small>MY COMPLETE WATCHED ARCHIVE</small></div>

          <div className="archive-poster-grid">
            {YEARS.map((year) => (
              <section className="poster-year-row" key={year}>
                <div className="poster-year-label"><strong>{year}</strong><span>{CATALOG[year].filter((drama) => watched.has(drama.id)).length}/10</span></div>
                <div className="poster-year-cells">
                  {CATALOG[year].map((drama, index) => {
                    const isWatched = watched.has(drama.id)
                    return (
                      <article className={`bingo-cell ${isWatched ? 'is-lit' : 'is-locked'}`} key={drama.id}>
                        {/* <div className="cell-number">{String(index + 1).padStart(2, '0')}</div> */}
                        <PosterImage drama={drama} eager />
                        <div className="cell-shade" />
                        <div className="cell-title"><strong>{drama.title}</strong></div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          <footer className="share-footer">
            <TmdbCredit />
          </footer>
        </div>
      </main>
    )
  }

  return (
    <main className="selection-page">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="日剧世代首页"><span>日剧世代</span></a>
        <div className="issue">ARCHIVE <b>2005–2024</b></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} />二十年 · 二百部代表作</p>
          <h1>点亮你的<br /><em>日剧世代</em></h1>
        </div>
        <div className="hero-score" aria-live="polite">
          <span>WATCHED</span><strong>{String(watched.size).padStart(2, '0')}</strong><small>／200 部</small>
        </div>
      </section>

      <section className="global-generate top-generate">
        <div><span>你的日剧世代记录</span><strong>{watched.size} <small>/ 200</small></strong></div>
        <button className="button button-primary button-generate" onClick={showPoster}>生成全部年代海报 <span>→</span></button>
      </section>

      <div className="archive-list">
        {YEARS.map((year) => {
          const yearDramas = CATALOG[year]
          const yearWatched = yearDramas.filter((drama) => watched.has(drama.id)).length
          return (
            <section className="selection-section year-section" aria-labelledby={`year-${year}`} key={year}>
              <div className="section-heading">
                <div className="year-heading"><p>DRAMA GENERATION</p><h2 id={`year-${year}`}>{year}</h2><span>{yearWatched} / 10 已看</span></div>
                <div className="quick-actions">
                  <button onClick={() => setWatched((current) => new Set([...current].filter((id) => !yearDramas.some((drama) => drama.id === id))))} disabled={yearWatched === 0}><RotateCcw size={15} />清空</button>
                  <button onClick={() => setWatched((current) => new Set([...current, ...yearDramas.map((drama) => drama.id)]))} disabled={yearWatched === yearDramas.length}><CheckCircle2 size={15} />全选</button>
                </div>
              </div>

              <div className="drama-grid">
                {yearDramas.map((drama, index) => {
                  const isWatched = watched.has(drama.id)
                  return (
                    <button className={`drama-card ${isWatched ? 'is-selected' : ''}`} data-drama-id={drama.id} onClick={() => toggle(drama.id)} aria-pressed={isWatched} key={drama.id}>
                      <div className="card-poster">
                        <PosterImage drama={drama} />
                        {/* <span className="card-index">{String(index + 1).padStart(2, '0')}</span> */}
                        <span className="check-mark"><Check size={22} strokeWidth={3} /></span>
                        <span className="watched-label">看过</span>
                      </div>
                      <div className="card-copy"><strong>{drama.title}</strong><span>{drama.originalTitle}</span></div>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <section className="global-generate footer-generate">
        <div><span>全部 20 个年代已展示</span><strong>{watched.size} <small>/ 200</small></strong></div>
        <button className="button button-primary button-generate" onClick={showPoster}>生成全部年代海报 <span>→</span></button>
      </section>

      <footer className="site-footer">
        <TmdbCredit />
        <p>仅供个人非商业使用 · 2005–2024 日剧世代海报</p>
        <p className="source-credit">数据来源：部参照小红书不愿署名的网友依据个人喜好、豆瓣热度排名整理和ドラマ人気ランキング整理</p>
        {/* <p className="project-credit">网页作者：<strong>饼饼几个饼</strong> · 仓库：<a href="https://github.com/kellycatz/japan-drama-bingo" target="_blank" rel="noreferrer">kellycatz/japan-drama-bingo</a></p> */}
      </footer>
    </main>
  )
}

export default App
