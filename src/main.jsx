import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router'
import './utils/i18n.js'
import './index.css'
import Home from './pages/Home.jsx'
import Settings from './pages/Settings.jsx'
import About from './pages/About.jsx'
import NewsDetail from './pages/NewsDetail.jsx'
import NewsListBySource from './pages/NewsListBySource.jsx'
import Category from './pages/Category.jsx'
import Youtube from './pages/Youtube.jsx'

function AppWrapper() {
  const [showSlider, setShowSlider] = useState(false);
  const [brightness, setBrightness] = useState(() => {
    return Number(sessionStorage.getItem('brightness_level') || '20');
  });
  const [colorMode, setColorMode] = useState(() => {
    return sessionStorage.getItem('color_mode') === 'true';
  });

  // Apply brightness updates to CSS and sessionStorage
  useEffect(() => {
    document.documentElement.style.setProperty('--app-brightness', `${brightness}%`);
    sessionStorage.setItem('brightness_level', brightness.toString());
  }, [brightness]);

  // Apply color mode updates
  useEffect(() => {
    document.body.classList.toggle('color-mode', colorMode);
    sessionStorage.setItem('color_mode', colorMode.toString());
  }, [colorMode]);

  // Register capture-phase keydown event listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSlider) {
        // Intercept navigation while slider is active
        if (e.key === 'ArrowLeft' || e.key === '4') {
          e.preventDefault();
          e.stopPropagation();
          setBrightness((prev) => Math.max(10, prev - 5));
        } else if (e.key === 'ArrowRight' || e.key === '6') {
          e.preventDefault();
          e.stopPropagation();
          setBrightness((prev) => Math.min(100, prev + 5));
        } else if (e.key === '#' || e.key === 'Enter' || e.key === '5' || e.key === '0' || e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setShowSlider(false);
        } else {
          // Prevent other actions (like scrolling or pagination) when slider is open
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      // Normal global hotkeys
      if (e.key === '*') {
        e.preventDefault();
        setColorMode((prev) => !prev);
      } else if (e.key === '#') {
        e.preventDefault();
        setShowSlider(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showSlider]);

  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route path='category/:country' element={<Category />} />
        <Route path='source/:sourceId' element={<NewsListBySource />} />
        <Route path='news/:id' element={<NewsDetail />} />
        <Route path='youtube' element={<Youtube />} />
        <Route path='settings' element={<Settings />} />
        <Route path='about' element={<About />} />
      </Routes>

      {showSlider && (
        <div className="brightness-overlay">
          <div className="brightness-modal">
            <h3 className="brightness-title">Brightness</h3>
            <div className="brightness-track">
              <div 
                className="brightness-fill" 
                style={{ width: `${brightness}%` }} 
              />
            </div>
            <div className="brightness-value">{brightness}%</div>
            <div className="brightness-instructions">
              Press Left / Right to adjust<br />
              Press # or Enter to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// HashRouter is needed for GitHub pages
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter basename='' hashType='noslash'>
      <AppWrapper />
    </HashRouter>
  </StrictMode>,
)
