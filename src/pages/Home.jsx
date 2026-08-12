import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import Header from '../components/Header'
import SoftKeyBar from '../components/SoftKeyBar'
import OptionsMenu from '../components/OptionsMenu'
import { autoFocus } from '../utils/focus'
import { t } from 'i18next'
import { withTranslation } from 'react-i18next'
import { newsSources, fetchFeed } from '../utils/newsData'
import './Home.css'

const categoriesList = ['Bangladesh', 'India', 'Middle East', 'World News', 'YouTube'];

function AppComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  // States
  const [menuVisible, setMenuVisible] = useState(location.hash.includes('#menu'));
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('all_articles'));
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(() => Number(sessionStorage.getItem('news_category_focus') || 0));

  const onSoftKeyClick = (position) => {
    switch (position) {
      case 'start':
        if (menuVisible)
          navigate(-1);
        else
          setMenuVisible(!menuVisible);
        break;
      case 'center':
        {
          const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
          if (focusables[focusedIndex]) {
            focusables[focusedIndex].click();
          }
        }
        break;
      case 'end':
        // Exit app
        break;
    }
  };

  const handleKeyDown = (e) => {
    if (menuVisible || loading) return;

    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (!focusables.length) return;

    switch (e.key) {
      case 'ArrowDown':
      case '8':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const nextIndex = (prev + 1) % focusables.length;
          sessionStorage.setItem('news_category_focus', nextIndex);
          return nextIndex;
        });
        break;
      case 'ArrowUp':
      case '2':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const prevIndex = (prev - 1 + focusables.length) % focusables.length;
          sessionStorage.setItem('news_category_focus', prevIndex);
          return prevIndex;
        });
        break;
      case '1':
        e.preventDefault();
        setFocusedIndex(0);
        sessionStorage.setItem('news_category_focus', 0);
        break;
      case '3':
        e.preventDefault();
        // Clear all cached articles and force preload all categories
        preloadAllFeeds();
        break;
      case 'Enter':
      case '5':
        e.preventDefault();
        if (focusables[focusedIndex]) {
          focusables[focusedIndex].click();
        }
        break;
    }
  };

  const preloadAllFeeds = async () => {
    setLoading(true);
    setLoadingProgress(0);

    sessionStorage.removeItem('all_articles');
    sessionStorage.removeItem('all_errors');

    const total = newsSources.length;
    let completed = 0;
    const newArticlesMap = {};
    const newErrorsMap = {};

    await Promise.all(
      newsSources.map(async (source) => {
        try {
          const data = await fetchFeed(source.id);
          newArticlesMap[source.id] = data;
        } catch (err) {
          console.error(`Failed to load source: ${source.id}`, err);
          newErrorsMap[source.id] = err.message;
        } finally {
          completed++;
          setLoadingProgress(Math.round((completed / total) * 100));
        }
      })
    );

    sessionStorage.setItem('all_articles', JSON.stringify(newArticlesMap));
    sessionStorage.setItem('all_errors', JSON.stringify(newErrorsMap));
    setLoading(false);
  };

  useEffect(() => {
    const cached = sessionStorage.getItem('all_articles');
    let needsPreload = !cached;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Object.keys(parsed).length !== newsSources.length) {
          needsPreload = true;
        }
      } catch (e) {
        needsPreload = true;
      }
    }
    if (needsPreload) {
      preloadAllFeeds();
    }
  }, []);

  const onMenuItemSelected = () => setMenuVisible(false);

  // Add keydown listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Keep focus on the active item whenever state changes
  useEffect(() => {
    if (menuVisible || loading) return;
    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (focusables[focusedIndex]) {
      focusables[focusedIndex].focus();
    }
  }, [focusedIndex, menuVisible, loading]);

  // Sync menu state with URL hash
  useEffect(() => {
    setMenuVisible(location.hash.includes('#menu'));
  }, [location.hash]);

  return (
    <>
      <Header title={t('World News')} />

      <section id="app" ref={containerRef}>
        <h2 className="section-title">{t('News Categories')}</h2>
        
        {loading ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '10pt' }}>
            <div className="spinner" style={{ marginBottom: '12px' }}></div>
            {t('Syncing all categories...')} ({loadingProgress}%)
          </div>
        ) : (
          <div className="news-list">
            {categoriesList.map((country, idx) => {
              const count = newsSources.filter(s => s.country === country).length;
              const isYoutube = country === 'YouTube';
              return (
                <Link
                  key={country}
                  to={isYoutube ? '/youtube' : `/category/${encodeURIComponent(country)}`}
                  className={`news-card focusable-item ${idx === focusedIndex ? 'focused' : ''}`}
                  onClick={() => {
                    sessionStorage.setItem('news_category_focus', idx);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <h3 className="card-title" style={{ fontSize: '11pt', margin: 0, fontWeight: 'bold' }}>
                      {idx + 1}. {t(country)}
                    </h3>
                    <span style={{ fontSize: '8.5pt', color: '#64748b' }}>➜</span>
                  </div>
                  <span style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '4px', textTransform: 'none' }}>
                    {isYoutube ? t('Videos placeholder feed') : `${count} ${t('news sources')}`}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <OptionsMenu
        onMenuItemSelected={onMenuItemSelected}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}>
        <Link to="about" replace>
          {t('About')}
        </Link>
        <Link to="settings" replace>
          {t('Settings')}
        </Link>
      </OptionsMenu>

      <SoftKeyBar
        buttons={{
          start: { icon: 'menu' },
          center: { icon: 'select', title: t('Select') },
          end: { icon: 'back' },
        }}
        onSoftKeyClick={onSoftKeyClick}
      />
    </>
  )
}

export default withTranslation()(AppComponent)
