import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, Download, Film, LockKeyhole, RotateCcw, Sparkles } from 'lucide-react'
import { toPng } from 'html-to-image'
import { DRAMAS, type Drama } from './data'

const STORAGE_KEY = 'japan-tv-bingo:2012:watched'

function loadWatched(): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(stored) ? stored.filter((id) => DRAMAS.some((drama) => drama.id === id)) : [])
  } catch {
    return new Set()
  }
}

function PosterImage({ drama }: { drama: Drama }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <div className="poster-fallback"><Film aria-hidden="true" /><span>{drama.originalTitle}</span></div>
  }

  return <img src={drama.poster} alt={`${drama.title} 海报`} draggable={false} onError={() => setFailed(true)} />
}

function TmdbCredit() {
  return (
    <p className="tmdb-credit">
      海报及影视资料来自 <strong>TMDB</strong> · 本产品与 TMDB 无关联，亦未经其认可
    </p>
  )
}

function App() {
  const [watched, setWatched] = useState<Set<string>>(loadWatched)
  const [view, setView] = useState<'select' | 'poster'>('select')
  const [exporting, setExporting] = useState(false)
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
    setExporting(true)
    try {
      await document.fonts.ready
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#efe5cf',
      })
      const link = document.createElement('a')
      link.download = `我的2012日剧Bingo-${watched.size}of${DRAMAS.length}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('海报生成失败', error)
      window.alert('海报生成失败，请稍后重试。')
    } finally {
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

        <div className="share-poster" ref={posterRef}>
          <div className="poster-registration">DRAMA ARCHIVE · PERSONAL EDITION</div>
          <header className="share-header">
            <div className="year-block"><span>平成</span><strong>24</strong><small>年</small></div>
            <div>
              <p className="eyebrow">わたしのドラマ記録</p>
              <h1>日剧世代<br /><em>BINGO</em></h1>
            </div>
            <div className="score-stamp"><strong>{watched.size}</strong><span>/ 10</span><small>已看</small></div>
          </header>

          <div className="share-rule"><span>2012</span><i /><small>MY WATCHED LIST</small></div>

          <div className="bingo-grid">
            {DRAMAS.map((drama, index) => {
              const isWatched = watched.has(drama.id)
              return (
                <article className={`bingo-cell ${isWatched ? 'is-lit' : 'is-locked'}`} key={drama.id}>
                  <div className="cell-number">{String(index + 1).padStart(2, '0')}</div>
                  <PosterImage drama={drama} />
                  <div className="cell-shade" />
                  <div className="cell-state" aria-label={isWatched ? '看过' : '没看过'}>
                    {isWatched ? <Check size={22} strokeWidth={3} /> : <LockKeyhole size={17} />}
                  </div>
                  <div className="cell-title"><strong>{drama.title}</strong><span>{drama.originalTitle}</span></div>
                </article>
              )
            })}
          </div>

          <footer className="share-footer">
            <div><span>2012 DRAMA GENERATION</span><strong>你看过几部？</strong></div>
            <TmdbCredit />
          </footer>
        </div>
      </main>
    )
  }

  return (
    <main className="selection-page">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="日剧世代 Bingo 首页"><span>日剧世代</span><strong>BINGO</strong></a>
        <div className="issue">ISSUE <b>2012</b></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} />平成二十四年 · 十部代表作</p>
          <h1>点亮你的<br /><em>日剧世代</em></h1>
          <p className="hero-intro">从《Legal High》到《孤独的美食家》，勾选你看过的 2012 日剧，生成一张只属于你的年度观剧海报。</p>
        </div>
        <div className="hero-score" aria-live="polite">
          <span>WATCHED</span><strong>{String(watched.size).padStart(2, '0')}</strong><small>／10 部</small>
        </div>
      </section>

      <section className="selection-section" aria-labelledby="selection-title">
        <div className="section-heading">
          <div><p>SELECT YOUR DRAMAS</p><h2 id="selection-title">看过的，就点亮它</h2></div>
          <div className="quick-actions">
            <button onClick={() => setWatched(new Set())} disabled={watched.size === 0}><RotateCcw size={15} />清空</button>
            <button onClick={() => setWatched(new Set(DRAMAS.map((drama) => drama.id)))} disabled={watched.size === DRAMAS.length}><CheckCircle2 size={15} />全选</button>
          </div>
        </div>

        <div className="drama-grid">
          {DRAMAS.map((drama, index) => {
            const isWatched = watched.has(drama.id)
            return (
              <button className={`drama-card ${isWatched ? 'is-selected' : ''}`} onClick={() => toggle(drama.id)} aria-pressed={isWatched} key={drama.id}>
                <div className="card-poster">
                  <PosterImage drama={drama} />
                  <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="check-mark"><Check size={22} strokeWidth={3} /></span>
                  <span className="watched-label">看过</span>
                </div>
                <div className="card-copy"><strong>{drama.title}</strong><span>{drama.originalTitle}</span></div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="generate-bar">
        <div><span>你的 2012 观剧记录</span><strong>{watched.size} <small>/ {DRAMAS.length}</small></strong></div>
        <button className="button button-primary button-generate" onClick={showPoster}>生成我的 2012 Bingo <span>→</span></button>
      </section>

      <footer className="site-footer"><TmdbCredit /><p>仅供个人非商业使用 · 2012 日剧世代 Bingo</p></footer>
    </main>
  )
}

export default App
