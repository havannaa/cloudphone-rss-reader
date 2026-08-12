import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router'
import { newsSources, fetchFeed } from '../utils/newsData'
import Header from '../components/Header'
import SoftKeyBar from '../components/SoftKeyBar'
import OptionsMenu from '../components/OptionsMenu'
import { t } from 'i18next'
import { withTranslation } from 'react-i18next'
import './Home.css'

function NewsListBySource() {
  const { sourceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  const source = newsSources.find(s => s.id === sourceId);

  // States
  const [articles, setArticles] = useState(() => {
    const cached = JSON.parse(sessionStorage.getItem('all_articles') || '{}');
    return cached[sourceId] || [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(location.hash.includes('#menu'));
  const [page, setPage] = useState(() => Number(sessionStorage.getItem(`news_page_${sourceId}`) || 0));
  const [focusedIndex, setFocusedIndex] = useState(() => Number(sessionStorage.getItem(`news_focus_${sourceId}`) || 0));

  // Sync state if sourceId changes (e.g. from keybind source switching)
  useEffect(() => {
    setPage(Number(sessionStorage.getItem(`news_page_${sourceId}`) || 0));
    setFocusedIndex(Number(sessionStorage.getItem(`news_focus_${sourceId}`) || 0));
  }, [sourceId]);

  const fetchSourceFeed = async (forceRefetch = false) => {
    setLoading(true);
    setError(null);

    const cachedArticles = JSON.parse(sessionStorage.getItem('all_articles') || '{}');
    const cachedErrors = JSON.parse(sessionStorage.getItem('all_errors') || '{}');

    if (forceRefetch) {
      delete cachedArticles[sourceId];
      delete cachedErrors[sourceId];
      sessionStorage.setItem('all_articles', JSON.stringify(cachedArticles));
      sessionStorage.setItem('all_errors', JSON.stringify(cachedErrors));
    }

    if (!forceRefetch && cachedArticles[sourceId] && cachedArticles[sourceId].length > 0) {
      setArticles(cachedArticles[sourceId]);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchFeed(sourceId);
      cachedArticles[sourceId] = data;
      delete cachedErrors[sourceId];
      sessionStorage.setItem('all_articles', JSON.stringify(cachedArticles));
      sessionStorage.setItem('all_errors', JSON.stringify(cachedErrors));
      setArticles(data);
      // Update active_articles navigation cache
      sessionStorage.setItem('active_articles', JSON.stringify(data));
    } catch (err) {
      console.error(err);
      cachedErrors[sourceId] = err.message;
      cachedArticles[sourceId] = [];
      sessionStorage.setItem('all_articles', JSON.stringify(cachedArticles));
      sessionStorage.setItem('all_errors', JSON.stringify(cachedErrors));
      setError(err.message);
      setArticles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSourceFeed(false);
  }, [sourceId]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(articles.length / itemsPerPage) || 1;
  const activeNews = articles.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const showPrev = page > 0;
  const showNext = page < totalPages - 1;

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setFocusedIndex(0);
    sessionStorage.setItem(`news_page_${sourceId}`, newPage);
    sessionStorage.setItem(`news_focus_${sourceId}`, 0);
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
          sessionStorage.setItem(`news_focus_${sourceId}`, nextIndex);
          return nextIndex;
        });
        break;
      case 'ArrowUp':
      case '2':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const prevIndex = (prev - 1 + focusables.length) % focusables.length;
          sessionStorage.setItem(`news_focus_${sourceId}`, prevIndex);
          return prevIndex;
        });
        break;
      case '1':
        e.preventDefault();
        setFocusedIndex(0);
        sessionStorage.setItem(`news_focus_${sourceId}`, 0);
        break;
      case '3':
        e.preventDefault();
        // Clear and refetch this source feed only
        fetchSourceFeed(true);
        break;
      case '4':
        e.preventDefault();
        {
          const allArticlesCache = JSON.parse(sessionStorage.getItem('all_articles') || '{}');
          const currentIndex = newsSources.findIndex(s => s.id === sourceId);
          if (currentIndex !== -1) {
            const prevIndex = (currentIndex - 1 + newsSources.length) % newsSources.length;
            const prevSource = newsSources[prevIndex];
            const prevArticles = allArticlesCache[prevSource.id] || [];
            sessionStorage.setItem('active_articles', JSON.stringify(prevArticles));
            navigate(`/source/${prevSource.id}`, { replace: true });
          }
        }
        break;
      case '6':
        e.preventDefault();
        {
          const allArticlesCache = JSON.parse(sessionStorage.getItem('all_articles') || '{}');
          const currentIndex = newsSources.findIndex(s => s.id === sourceId);
          if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % newsSources.length;
            const nextSource = newsSources[nextIndex];
            const nextArticles = allArticlesCache[nextSource.id] || [];
            sessionStorage.setItem('active_articles', JSON.stringify(nextArticles));
            navigate(`/source/${nextSource.id}`, { replace: true });
          }
        }
        break;
      case 'Enter':
      case '5':
        e.preventDefault();
        if (focusables[focusedIndex]) {
          focusables[focusedIndex].click();
        }
        break;
      case '9':
        e.preventDefault();
        if (showNext) {
          handlePageChange(page + 1);
        }
        break;
      case '7':
        e.preventDefault();
        if (showPrev) {
          handlePageChange(page - 1);
        }
        break;
      case '0':
        e.preventDefault();
        if (source) {
          navigate(`/category/${encodeURIComponent(source.country)}`);
        } else {
          navigate('/');
        }
        break;
    }
  };

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
        if (source) {
          navigate(`/category/${encodeURIComponent(source.country)}`);
        } else {
          navigate('/');
        }
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => {
    if (menuVisible || loading) return;
    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (focusables[focusedIndex]) {
      focusables[focusedIndex].focus();
    }
  }, [focusedIndex, page, menuVisible, loading]);

  useEffect(() => {
    setMenuVisible(location.hash.includes('#menu'));
  }, [location.hash]);

  if (!source) {
    return (
      <>
        <Header title={t('Error')} />
        <section id="app">
          <h2>{t('Source Not Found')}</h2>
        </section>
        <SoftKeyBar buttons={{ end: { icon: 'back' } }} onSoftKeyClick={() => navigate('/')} />
      </>
    );
  }

  return (
    <>
      <Header title={source.name} />

      <section id="app" ref={containerRef}>
        <h2 className="section-title">{source.name} {t('Feed')}</h2>

        {loading ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '10pt' }}>
            <div className="spinner" style={{ marginBottom: '12px' }}></div>
            {t('Fetching latest feed...')}
          </div>
        ) : error ? (
          <div style={{ padding: '20px 10px', color: '#ef4444', fontSize: '9.5pt', textAlign: 'center' }}>
            {error}
          </div>
        ) : articles.length === 0 ? (
          <div style={{ padding: '20px 10px', textAlign: 'center', color: '#ef4444', fontSize: '9.5pt' }}>
            {t('No articles available or feed offline.')}
          </div>
        ) : (
          <>
            <div className="news-list">
              {activeNews.map((item, idx) => {
                const articleIndex = page * itemsPerPage + idx + 1;
                return (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className={`news-card focusable-item ${idx === focusedIndex ? 'focused' : ''}`}
                    onClick={() => {
                      sessionStorage.setItem(`news_focus_${sourceId}`, idx);
                      sessionStorage.setItem('active_articles', JSON.stringify(articles));
                    }}
                  >
                    {item.imageUrl && (
                      <div className="card-image-container">
                        <img src={item.imageUrl} alt="" className="card-image" loading="lazy" />
                      </div>
                    )}
                    <div className="card-meta">
                      <span className={`card-badge badge-${(item.category || 'World').toLowerCase()}`}>
                        {item.category || 'World'}
                      </span>
                      <span className="card-date">{item.date}</span>
                    </div>
                    <h3 className="card-title">{articleIndex}. {item.title}</h3>
                    <p className="card-desc">{item.summary}</p>
                  </Link>
                );
              })}
            </div>

            <div className="pagination-bar">
              <span className="page-indicator">
                {t('Page')} {page + 1} {t('of')} {totalPages}
              </span>
              <div className="pagination-buttons">
                {showPrev && (
                  <button
                    className={`pagination-btn focusable-item ${
                      focusedIndex === activeNews.length ? 'focused' : ''
                    }`}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    {t('Prev')}
                  </button>
                )}
                {showNext && (
                  <button
                    className={`pagination-btn focusable-item ${
                      focusedIndex === (activeNews.length + (showPrev ? 1 : 0)) ? 'focused' : ''
                    }`}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    {t('Next')}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <OptionsMenu
        onMenuItemSelected={() => setMenuVisible(false)}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}>
        <Link to="/about" replace>
          {t('About')}
        </Link>
        <Link to="/settings" replace>
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

export default withTranslation()(NewsListBySource);
