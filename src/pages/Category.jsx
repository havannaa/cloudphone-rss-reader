import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router'
import Header from '../components/Header'
import SoftKeyBar from '../components/SoftKeyBar'
import OptionsMenu from '../components/OptionsMenu'
import { autoFocus } from '../utils/focus'
import { t } from 'i18next'
import { withTranslation } from 'react-i18next'
import { newsSources, fetchFeed } from '../utils/newsData'
import './Home.css' // Reuse the general homepage layout styles

function CategoryPage() {
  const { country } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  // Filter sources for the current country category
  const categorySources = newsSources.filter(s => s.country === country);

  // States
  const [menuVisible, setMenuVisible] = useState(location.hash.includes('#menu'));
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [articlesMap, setArticlesMap] = useState(() => JSON.parse(sessionStorage.getItem('all_articles') || '{}'));
  const [errorsMap, setErrorsMap] = useState(() => JSON.parse(sessionStorage.getItem('all_errors') || '{}'));
  const [focusedIndex, setFocusedIndex] = useState(() => Number(sessionStorage.getItem(`news_category_source_focus_${country}`) || 0));

  // Preloading feeds in parallel for this category only
  const preloadCategoryFeeds = async (forceRefetch = false) => {
    setLoading(true);
    setLoadingProgress(0);

    const currentArticles = JSON.parse(sessionStorage.getItem('all_articles') || '{}');
    const currentErrors = JSON.parse(sessionStorage.getItem('all_errors') || '{}');

    if (forceRefetch) {
      categorySources.forEach(source => {
        delete currentArticles[source.id];
        delete currentErrors[source.id];
      });
      sessionStorage.setItem('all_articles', JSON.stringify(currentArticles));
      sessionStorage.setItem('all_errors', JSON.stringify(currentErrors));
    }

    if (!forceRefetch) {
      setArticlesMap(currentArticles);
      setErrorsMap(currentErrors);
      setLoading(false);
      return;
    }

    const sourcesToFetch = categorySources;
    if (sourcesToFetch.length === 0) {
      setLoading(false);
      return;
    }

    const total = sourcesToFetch.length;
    let completed = 0;

    await Promise.all(
      sourcesToFetch.map(async (source) => {
        try {
          const data = await fetchFeed(source.id, forceRefetch);
          currentArticles[source.id] = data;
          delete currentErrors[source.id];
        } catch (err) {
          console.error(`Failed to load source: ${source.id}`, err);
          currentErrors[source.id] = err.message;
          currentArticles[source.id] = [];
        } finally {
          completed++;
          setLoadingProgress(Math.round((completed / total) * 100));
        }
      })
    );

    sessionStorage.setItem('all_articles', JSON.stringify(currentArticles));
    sessionStorage.setItem('all_errors', JSON.stringify(currentErrors));
    sessionStorage.setItem('last_update_timestamp', Date.now().toString());
    
    setArticlesMap(currentArticles);
    setErrorsMap(currentErrors);
    setLoading(false);
  };

  useEffect(() => {
    preloadCategoryFeeds(false);
  }, [country]);

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
        navigate('/');
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
          sessionStorage.setItem(`news_category_source_focus_${country}`, nextIndex);
          return nextIndex;
        });
        break;
      case 'ArrowUp':
      case '2':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const prevIndex = (prev - 1 + focusables.length) % focusables.length;
          sessionStorage.setItem(`news_category_source_focus_${country}`, prevIndex);
          return prevIndex;
        });
        break;
      case '1':
        e.preventDefault();
        setFocusedIndex(0);
        sessionStorage.setItem(`news_category_source_focus_${country}`, 0);
        break;
      case '3':
        e.preventDefault();
        // Force refresh all feeds in this category
        preloadCategoryFeeds(true);
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
        navigate('/');
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
      <Header title={t(country)} />

      <section id="app" ref={containerRef}>
        <h2 className="section-title">{t('News Sources')}</h2>
        
        {loading ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '10pt' }}>
            <div className="spinner" style={{ marginBottom: '12px' }}></div>
            {t('Syncing category feeds...')} ({loadingProgress}%)
          </div>
        ) : (
          <div className="news-list">
            {categorySources.map((source, idx) => {
              const sourceArticles = articlesMap[source.id] || [];
              const hasError = errorsMap[source.id];
              const subtitle = hasError 
                ? t('Offline / Connection timeout') 
                : `${sourceArticles.length} ${t('articles preloaded')}`;

              return (
                <Link
                  key={source.id}
                  to={`/source/${source.id}`}
                  className={`news-card focusable-item ${idx === focusedIndex ? 'focused' : ''}`}
                  onClick={() => {
                    sessionStorage.setItem(`news_category_source_focus_${country}`, idx);
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
  );
}

export default withTranslation()(CategoryPage);
