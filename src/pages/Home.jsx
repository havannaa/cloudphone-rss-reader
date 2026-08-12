/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from 'react'
import './Home.css'
import Header from '../components/Header'
import OptionsMenu from '../components/OptionsMenu'
import SoftKeyBar from '../components/SoftKeyBar'
import { t } from 'i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import { withTranslation } from 'react-i18next'
import { newsSources, fetchFeed } from '../utils/newsData'

function AppComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // States
  const [menuVisible, setMenuVisible] = useState(location.hash.includes('#menu'));
  const [loading, setLoading] = useState(() => {
    const cached = sessionStorage.getItem('all_articles');
    if (!cached) return true;
    try {
      const parsed = JSON.parse(cached);
      return Object.keys(parsed).length !== newsSources.length;
    } catch (e) {
      return true;
    }
  });
  const [articlesMap, setArticlesMap] = useState(() => {
    const cached = sessionStorage.getItem('all_articles');
    if (!cached) return {};
    try {
      const parsed = JSON.parse(cached);
      if (Object.keys(parsed).length === newsSources.length) {
        return parsed;
      }
    } catch (e) {
      // Ignore
    }
    return {};
  });
  const [errorsMap, setErrorsMap] = useState(() => {
    const cached = sessionStorage.getItem('all_errors');
    if (!cached) return {};
    try {
      const parsed = JSON.parse(cached);
      const cachedArticles = sessionStorage.getItem('all_articles');
      if (cachedArticles) {
        const parsedArticles = JSON.parse(cachedArticles);
        if (Object.keys(parsedArticles).length === newsSources.length) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore
    }
    return {};
  });
  const [focusedIndex, setFocusedIndex] = useState(() => Number(sessionStorage.getItem('news_source_focus') || 0));

  // Preloading RSS feeds in parallel
  useEffect(() => {
    const cached = sessionStorage.getItem('all_articles');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Object.keys(parsed).length === newsSources.length) {
          return;
        }
      } catch (e) {
        // Ignore and force reload
      }
    }

    let active = true;
    setLoading(true);

    const preloadFeeds = async () => {
      const results = await Promise.all(
        newsSources.map(async (source) => {
          try {
            const data = await fetchFeed(source.id);
            return { sourceId: source.id, articles: data, error: null };
          } catch (err) {
            console.error(`Failed to load source: ${source.id}`, err);
            return { sourceId: source.id, articles: [], error: err.message };
          }
        })
      );

      if (active) {
        const newArticlesMap = {};
        const newErrorsMap = {};
        results.forEach(res => {
          newArticlesMap[res.sourceId] = res.articles;
          if (res.error) newErrorsMap[res.sourceId] = res.error;
        });

        sessionStorage.setItem('all_articles', JSON.stringify(newArticlesMap));
        sessionStorage.setItem('all_errors', JSON.stringify(newErrorsMap));

        setArticlesMap(newArticlesMap);
        setErrorsMap(newErrorsMap);
        setLoading(false);
      }
    };

    preloadFeeds();

    return () => {
      active = false;
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (menuVisible || loading) return; // Let OptionsMenu handle its own keys or wait during loading

    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (!focusables.length) return;

    switch (e.key) {
      case 'ArrowDown':
      case '8':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const nextIndex = (prev + 1) % focusables.length;
          sessionStorage.setItem('news_source_focus', nextIndex);
          return nextIndex;
        });
        break;
      case 'ArrowUp':
      case '2':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const prevIndex = (prev - 1 + focusables.length) % focusables.length;
          sessionStorage.setItem('news_source_focus', prevIndex);
          return prevIndex;
        });
        break;
      case '1':
        e.preventDefault();
        setFocusedIndex(0);
        sessionStorage.setItem('news_source_focus', 0);
        break;
      case 'Enter':
      case '5':
        e.preventDefault();
        if (focusables[focusedIndex]) {
          focusables[focusedIndex].click();
        }
        break;
      case '0':
        e.preventDefault();
        navigate(-1);
        break;
    }
  };

  // Manage softkey actions
  const onSoftKeyClick = (position) => {
    if (loading) return;
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
        navigate(-1);
        break;
    }
  };

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
        <h2 className="section-title">{t('News Sources')}</h2>
        
        {loading ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '10pt' }}>
            <div className="spinner" style={{ marginBottom: '12px' }}></div>
            {t('Preloading live feeds...')}
          </div>
        ) : (
          <div className="news-list">
            {(() => {
              let lastCountry = null;
              return newsSources.map((source, idx) => {
                const sourceArticles = articlesMap[source.id] || [];
                const hasError = errorsMap[source.id];
                const subtitle = hasError 
                  ? t('Offline / Connection timeout') 
                  : `${sourceArticles.length} ${t('articles preloaded')}`;

                const elements = [];
                
                if (source.country !== lastCountry) {
                  lastCountry = source.country;
                  elements.push(
                    <h3 
                      key={`header-${source.country}`} 
                      className="category-title" 
                      style={{ 
                        fontSize: '9pt', 
                        color: 'var(--color-primary, #60a5fa)', 
                        padding: '10px 12px 4px 12px',
                        margin: '10px 0 2px 0', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px',
                        borderBottom: '1px solid #1e293b',
                        fontWeight: 'bold'
                      }}
                    >
                      {t(source.country)}
                    </h3>
                  );
                }

                elements.push(
                  <Link
                    key={source.id}
                    to={`/source/${source.id}`}
                    className={`news-card focusable-item ${idx === focusedIndex ? 'focused' : ''}`}
                    onClick={() => {
                      sessionStorage.setItem('news_source_focus', idx);
                      sessionStorage.setItem('active_articles', JSON.stringify(sourceArticles));
                    }}
                    style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', textDecoration: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <h3 className="card-title" style={{ fontSize: '10.5pt', margin: 0, fontWeight: 'bold' }}>
                        {idx + 1}. {source.name}
                      </h3>
                      <span style={{ fontSize: '8pt', color: '#64748b' }}>➜</span>
                    </div>
                    <span style={{ fontSize: '7.5pt', color: hasError ? '#ef4444' : '#64748b', marginTop: '4px', textTransform: 'none' }}>
                      {subtitle}
                    </span>
                  </Link>
                );

                return elements;
              });
            })()}
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
