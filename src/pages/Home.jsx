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

const categoriesList = ['Bangladesh', 'India', 'Middle East', 'World News', 'Cryptocurrency', 'Weather'];

function AppComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  // States
  const [menuVisible, setMenuVisible] = useState(location.hash.includes('#menu'));
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('feeds_preloaded_once'));
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentLoadingSource, setCurrentLoadingSource] = useState('');
  const [completedFeedsCount, setCompletedFeedsCount] = useState(0);
  const [totalFeedsCount, setTotalFeedsCount] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(() => Number(sessionStorage.getItem('news_category_focus') || 0));
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const ts = sessionStorage.getItem('last_update_timestamp');
      if (!ts) {
        setRelativeTime(t('Never'));
        return;
      }
      const diffMs = Date.now() - Number(ts);
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) {
        setRelativeTime(t('Just now'));
      } else if (diffMins === 1) {
        setRelativeTime(t('1 minute ago'));
      } else {
        setRelativeTime(t('{{count}} minutes ago', { count: diffMins }));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [loading]);

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
        preloadAllFeeds(true);
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

  const preloadAllFeeds = async (forceRefetch = false) => {
    setLoading(true);
    setLoadingProgress(0);

    sessionStorage.removeItem('all_articles');
    sessionStorage.removeItem('all_errors');

    const total = newsSources.length;
    let completed = 0;
    setCompletedFeedsCount(0);
    setTotalFeedsCount(total);
    setCurrentLoadingSource('Initializing...');
    const newArticlesMap = {};
    const newErrorsMap = {};

    await Promise.all(
      newsSources.map(async (source) => {
        try {
          setCurrentLoadingSource(`Fetching ${source.name}...`);
          const data = await fetchFeed(source.id, forceRefetch);
          newArticlesMap[source.id] = data;
        } catch (err) {
          console.error(`Failed to load source: ${source.id}`, err);
          newErrorsMap[source.id] = err.message;
        } finally {
          completed++;
          setCompletedFeedsCount(completed);
          setLoadingProgress(Math.round((completed / total) * 100));
        }
      })
    );

    sessionStorage.setItem('all_articles', JSON.stringify(newArticlesMap));
    sessionStorage.setItem('all_errors', JSON.stringify(newErrorsMap));
    sessionStorage.setItem('last_update_timestamp', Date.now().toString());
    sessionStorage.setItem('feeds_preloaded_once', 'true');
    setLoading(false);
  };

  useEffect(() => {
    const preloadedOnce = sessionStorage.getItem('feeds_preloaded_once');
    if (!preloadedOnce) {
      preloadAllFeeds(false);
    } else if (!sessionStorage.getItem('last_update_timestamp')) {
      sessionStorage.setItem('last_update_timestamp', Date.now().toString());
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
      <Header title="ngrk" />

      <section id="app" ref={containerRef}>
        <h2 className="section-title">{t('News Categories')}</h2>
        
        {!loading && (
          <div style={{ fontSize: '7.5pt', color: '#64748b', textAlign: 'center', marginTop: '-4px', marginBottom: '10px' }}>
            {t('Updated')}: {relativeTime}
          </div>
        )}
        
        {loading ? (
          <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '9.5pt' }}>
            <div className="spinner" style={{ marginBottom: '14px' }}></div>
            <div style={{ fontWeight: '500', color: '#f8fafc', marginBottom: '6px' }}>
              {t('Syncing feeds...')} ({loadingProgress}%)
            </div>
            <div style={{ fontSize: '7.5pt', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('Source')}: {currentLoadingSource}
            </div>
            <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '4px' }}>
              {completedFeedsCount} / {totalFeedsCount} {t('feeds')}
            </div>
          </div>
        ) : (
          <div className="news-list">
            {categoriesList.map((country, idx) => {
              const count = newsSources.filter(s => s.country === country).length;
              const isCrypto = country === 'Cryptocurrency';
              const isWeather = country === 'Weather';
              const targetRoute = isCrypto 
                ? '/crypto' 
                : isWeather
                  ? '/weather'
                  : `/category/${encodeURIComponent(country)}`;
              return (
                <Link
                  key={country}
                  to={targetRoute}
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
                    {isCrypto 
                      ? t('Real-time Coin Tickers') 
                      : isWeather
                        ? t('District weather reports')
                        : `${count} ${t('news sources')}`}
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
