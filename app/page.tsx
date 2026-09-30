import Link from 'next/link'

export default function Home() {
  return <main className="landing"><div className="landing-mark"><span className="brand-mark">+</span><span>Hookboard</span></div><section className="hero"><p className="eyebrow">A visual API playground</p><h1>Build. Trigger.<br /><em>Inspect.</em></h1><p className="hero-copy">Compose API workflows on a canvas, trigger test events, and understand every response without leaving your browser.</p><div className="hero-actions"><Link className="button button-primary" href="/playground">Open Playground <span>→</span></Link><Link className="button button-quiet" href="/playground?example=true">View Example</Link></div></section><footer className="landing-footer"><span>Designed for thoughtful API work.</span><span>© 2026 Hookboard</span></footer></main>
}
