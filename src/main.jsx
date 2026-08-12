import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router'
import './utils/i18n.js'
import './index.css'
import Home from './pages/Home.jsx'
import Settings from './pages/Settings.jsx'
import About from './pages/About.jsx'
import NewsDetail from './pages/NewsDetail.jsx'
import NewsListBySource from './pages/NewsListBySource.jsx'

// Initialize brightness and grayscale theme from sessionStorage on startup
const brightness = sessionStorage.getItem('brightness_level') || '25';
document.documentElement.style.setProperty('--app-brightness', `${brightness}%`);

const colorMode = sessionStorage.getItem('color_mode') === 'true';
document.body.classList.toggle('color-mode', colorMode);

// Global hotkeys handler (any screen)
window.addEventListener('keydown', (e) => {
  if (e.key === '*') {
    e.preventDefault();
    const current = sessionStorage.getItem('color_mode') === 'true';
    const next = !current;
    sessionStorage.setItem('color_mode', next);
    document.body.classList.toggle('color-mode', next);
  } else if (e.key === '#') {
    e.preventDefault();
    const levels = ['25', '50', '100'];
    const current = sessionStorage.getItem('brightness_level') || '25';
    const nextIndex = (levels.indexOf(current) + 1) % levels.length;
    const nextLevel = levels[nextIndex];
    sessionStorage.setItem('brightness_level', nextLevel);
    document.documentElement.style.setProperty('--app-brightness', `${nextLevel}%`);
  } else if (e.key === '3') {
    e.preventDefault();
    // Force refresh: clear session cache and reload/navigate to home
    sessionStorage.removeItem('all_articles');
    sessionStorage.removeItem('all_errors');
    window.location.href = window.location.origin + window.location.pathname; // Hard redirect to home route
  }
});

// HashRouter is needed for GitHub pages
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter basename='' hashType='noslash'>
      <Routes>
        <Route index element={<Home />} />
        <Route path='source/:sourceId' element={<NewsListBySource />} />
        <Route path='news/:id' element={<NewsDetail />} />
        <Route path='settings' element={<Settings />} />
        <Route path='about' element={<About />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
