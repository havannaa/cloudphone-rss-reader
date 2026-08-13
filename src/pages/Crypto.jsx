import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router'
import { newsSources, fetchFeed } from '../utils/newsData'
import Header from '../components/Header'
import { t } from 'i18next'
import { withTranslation } from 'react-i18next'
import './Home.css'

function CryptoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  const sourceId = 'crypto';
  const source = newsSources.find(s => s.id === sourceId);

  // States
  const [articles, setArticles] = useState(() => {
    const cached = JSON.parse(sessionStorage.getItem('all_articles') || '{}');
    return cached[sourceId] || [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(() => Number(sessionStorage.getItem(`news_page_${sourceId}`) || 0));
  const [focusedIndex, setFocusedIndex] = useState(() => Number(sessionStorage.getItem(`news_focus_${sourceId}`) || 0));

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

    if (!forceRefetch) {
      setArticles(cachedArticles[sourceId] || []);
      setError(cachedErrors[sourceId] || null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchFeed(sourceId, forceRefetch);
      cachedArticles[sourceId] = data;
      delete cachedErrors[sourceId];
      sessionStorage.setItem('all_articles', JSON.stringify(cachedArticles));
      sessionStorage.setItem('all_errors', JSON.stringify(cachedErrors));
      setArticles(data);
    } catch (err) {
      console.error(err);
      cachedErrors[sourceId] = err.message;
      cachedArticles[sourceId] = [];
      sessionStorage.setItem('all_articles', JSON.stringify(cachedArticles));
      sessionStorage.setItem('all_errors', JSON.stringify(cachedErrors));
      setError(err.message);
      setArticles([]);
    }
    sessionStorage.setItem('last_update_timestamp', Date.now().toString());
    setLoading(false);
  };

  useEffect(() => {
    fetchSourceFeed(false);
  }, []);

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
    if (loading) return;

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
        fetchSourceFeed(true);
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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => {
    if (loading) return;
    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (focusables[focusedIndex]) {
      focusables[focusedIndex].focus();
    }
  }, [focusedIndex, page, loading]);

  if (!source) {
    return (
      <>
        <Header title={t('Error')} />
        <section id="app">
          <h2>{t('Source Not Found')}</h2>
        </section>
      </>
    );
  }

  return (
    <>
      <Header title={source.name} />

      <section id="app" ref={containerRef}>
        <h2 className="section-title">{source.name} {t('Prices')}</h2>

        {loading ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '10pt' }}>
            <div className="spinner" style={{ marginBottom: '12px' }}></div>
            {t('Fetching live tickers...')}
          </div>
        ) : error ? (
          <div style={{ padding: '20px 10px', color: '#ef4444', fontSize: '9.5pt', textAlign: 'center' }}>
            {error}
          </div>
        ) : articles.length === 0 ? (
          <div style={{ padding: '20px 10px', textAlign: 'center', color: '#ef4444', fontSize: '9.5pt' }}>
            {t('No data available or feed offline.')}
          </div>
        ) : (
          <>
            <div className="news-list">
              {activeNews.map((item, idx) => {
                const coinIndex = page * itemsPerPage + idx + 1;
                const changeStr = item.summary.match(/24h Change:\s*([+-]?\d+\.?\d*%)/i)?.[1] || "";
                const isNegative = changeStr.startsWith('-');
                
                return (
                  <Link
                    key={item.id}
                    to={`/crypto-detail/${item.id}`}
                    className={`news-card focusable-item ${idx === focusedIndex ? 'focused' : ''}`}
                    onClick={() => {
                      sessionStorage.setItem(`news_focus_${sourceId}`, idx);
                      sessionStorage.setItem('active_articles', JSON.stringify(articles));
                    }}
                    style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', textDecoration: 'none' }}
                  >
                    <div className="card-meta">
                      <span className="card-badge" style={{ backgroundColor: isNegative ? '#ef4444' : '#22c55e', color: 'white' }}>
                        {changeStr || 'Crypto'}
                      </span>
                      <span className="card-date">{item.date}</span>
                    </div>
                    <h3 className="card-title" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                      {coinIndex}. {item.title}
                    </h3>
                    <p className="card-desc" style={{ fontSize: '8.5pt', color: '#94a3b8', marginTop: '4px' }}>
                      {item.summary}
                    </p>
                  </Link>
                );
              })}
            </div>

            <div className="pagination-bar">
              <span className="page-indicator">
                {t('Page')} {page + 1} {t('of')} {totalPages}
              </span>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default withTranslation()(CryptoPage);
