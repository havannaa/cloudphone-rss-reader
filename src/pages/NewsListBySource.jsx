import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router'
import { newsSources } from '../utils/newsData'
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

  // Load articles synchronously from preloaded sessionStorage cache
  const allArticles = JSON.parse(sessionStorage.getItem('all_articles') || '{}');
  const articles = allArticles[sourceId] || [];

  // Redirect back to home if preloaded cache is missing (e.g. direct deep link entry)
  useEffect(() => {
    if (!sessionStorage.getItem('all_articles')) {
      navigate('/');
    }
  }, [navigate]);

  // States
  const [menuVisible, setMenuVisible] = useState(location.hash.includes('#menu'));
  const [page, setPage] = useState(() => Number(sessionStorage.getItem(`news_page_${sourceId}`) || 0));
  const [focusedIndex, setFocusedIndex] = useState(() => Number(sessionStorage.getItem(`news_focus_${sourceId}`) || 0));

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
    if (menuVisible) return;

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
        navigate('/');
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
        navigate('/');
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => {
    if (menuVisible) return;
    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (focusables[focusedIndex]) {
      focusables[focusedIndex].focus();
    }
  }, [focusedIndex, page, menuVisible]);

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

        {articles.length === 0 ? (
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
