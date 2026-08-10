import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import Header from '../components/Header'
import SoftKeyBar from '../components/SoftKeyBar'
import { autoFocus } from '../utils/focus'
import { t } from 'i18next'
import './Home.css' // Reuse general app container layout
import './NewsDetail.css'

function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Load dynamic articles from session storage cache
  const articles = JSON.parse(sessionStorage.getItem('active_articles') || '[]');
  const article = articles.find((a) => a.id === parseInt(id, 10));

  const onSoftKeyClick = (position) => {
    switch (position) {
      case 'end':
        navigate(-1);
        break;
    }
  };

  const handleKeyDown = (e) => {
    const container = document.getElementById('app');
    switch (e.key) {
      case '2':
        e.preventDefault();
        if (container) {
          container.scrollTop -= 40;
        }
        break;
      case '8':
        e.preventDefault();
        if (container) {
          container.scrollTop += 40;
        }
        break;
      case '0':
        e.preventDefault();
        navigate(-1);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!article) {
    return (
      <>
        <Header title={t('Error')} />
        <section id="app" ref={autoFocus}>
          <h2>{t('Article Not Found')}</h2>
          <p>{t('The requested article does not exist.')}</p>
        </section>
        <SoftKeyBar
          buttons={{ end: { icon: 'back' } }}
          onSoftKeyClick={onSoftKeyClick}
        />
      </>
    );
  }

  // Get color code based on category for visual accent
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Tech': return 'var(--color-tech, #a855f7)';
      case 'Science': return 'var(--color-science, #06b6d4)';
      case 'Finance': return 'var(--color-finance, #10b981)';
      case 'World': return 'var(--color-world, #3b82f6)';
      case 'Health': return 'var(--color-health, #ef4444)';
      default: return '#94a3b8';
    }
  };

  return (
    <>
      <Header title={article.category || 'News'} />

      <section id="app" className="article-container" ref={autoFocus}>
        {article.imageUrl && (
          <div className="detail-image-container">
            <img src={article.imageUrl} alt="" className="detail-image" />
          </div>
        )}

        <div className="article-meta">
          <span 
            className="article-badge" 
            style={{ backgroundColor: getCategoryColor(article.category || 'World') }}
          >
            {article.category || 'World'}
          </span>
          <span className="article-date">{article.date} | #{article.id}</span>
        </div>

        <h2 className="article-title">{article.id}. {article.title}</h2>
        
        {article.summary && article.summary !== article.content && (
          <p className="article-summary">{article.summary}</p>
        )}
        
        <div className="article-content">
          {article.content}
        </div>
      </section>

      <SoftKeyBar
        buttons={{
          end: { icon: 'back' }
        }}
        onSoftKeyClick={onSoftKeyClick}
      />
    </>
  );
}

export default NewsDetail;
