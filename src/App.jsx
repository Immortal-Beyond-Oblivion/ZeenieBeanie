import { lazy, Suspense, useEffect } from 'react'
import './App.css'
import WordDetective from './components/WordDetective.tsx'
import Header from './components/Header.tsx'
import SkipLink from './sections/SkipLink.tsx'

/* The site around the game (about, lessons, ways to get in touch)
   ships as deferred chunks: it all sits below the fold, and the
   initial bundle has a hard size gate. Vite loads a chunk's
   stylesheet before resolving it, so nothing ever paints unstyled. */
const aboutModule = import('./sections/About.tsx')
const classesModule = import('./sections/Classes.tsx')
const contactModule = import('./sections/Contact.tsx')
const footerModule = import('./sections/Footer.tsx')

const About = lazy(() => aboutModule)
const Classes = lazy(() => classesModule)
const Contact = lazy(() => contactModule)
/* the footer waits for the sections, so the page never jumps */
const Footer = lazy(() =>
  Promise.all([aboutModule, classesModule, contactModule, footerModule]).then(
    ([, , , footer]) => footer,
  ),
)

/* A visitor may arrive on /#contact from a shared link, or tap a
   hero anchor before the section chunk has arrived. Once the
   sections are in the DOM, honour the hash. */
function HashScroll() {
  useEffect(() => {
    const id = window.location.hash
    if (!id) return
    const target = document.querySelector(id)
    if (target) target.scrollIntoView()
  }, [])
  return null
}

function App() {
  return (
    <>
      {/* The first focusable thing on the page: a keyboard user can
          step straight past the hero into the game. */}
      <SkipLink />
      <main className='page-wrapper'>
        <Header />
        {/* One bounded "Detective's Desk" scene — Slice 004a */}
        <WordDetective />
        <Suspense fallback={null}>
          <About />
          <Classes />
          <Contact />
          <HashScroll />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  )
}



export default App;
