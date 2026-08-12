import { useEffect, useState } from 'react'
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

  // States for fetching full article body (needed for Daily Ittefaq where RSS feed has no text description)
  const [content, setContent] = useState(article ? article.content : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!article || article.sourceId !== 'ittefaq') return;
    
    // If we already have the crawled body (longer than 20 chars), skip network fetch
    if (article.content && article.content.trim().length > 20) {
      setContent(article.content);
      return;
    }

    let active = true;
    setLoading(true);

    const fetchIttefaqContent = async () => {
      const CORS_PROXIES = [
        "/api/rss?url=",
        "https://api.allorigins.win/raw?url=",
        "https://corsproxy.io/?url="
      ];

      let htmlText = "";
      let errorMsg = "";

      for (const proxy of CORS_PROXIES) {
        try {
          const targetUrl = proxy.startsWith("/")
            ? window.location.origin + proxy + encodeURIComponent(article.link)
            : proxy + encodeURIComponent(article.link);

          const response = await fetch(targetUrl);
          if (response.ok) {
            htmlText = await response.text();
            break;
          } else {
            errorMsg = `HTTP status: ${response.status}`;
          }
        } catch (e) {
          errorMsg = e.message;
        }
      }

      if (!active) return;

      if (!htmlText) {
        setError(`Failed to load article details: ${errorMsg}`);
        setLoading(false);
        return;
      }

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        
        // Find article body tag like in the user's Python scraping script:
        // article_tag = sp_soup.find('article', class_='jw_detail_content_holder')
        // article_body = article_tag.find('div', itemprop='articleBody')
        const articleBody = doc.querySelector('article.jw_detail_content_holder div[itemprop="articleBody"]');
        
        if (articleBody) {
          const paragraphs = Array.from(articleBody.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(text => text.length > 0);
            
          const fullText = paragraphs.join('\n\n');
          if (fullText) {
            // Save back into session storage cache
            article.content = fullText;
            article.summary = fullText.length > 150 ? fullText.slice(0, 150) + "..." : fullText;
            sessionStorage.setItem('active_articles', JSON.stringify(articles));

            // Update articles list in the master 'all_articles' map as well
            const allArticles = JSON.parse(sessionStorage.getItem('all_articles') || '{}');
            if (allArticles['ittefaq']) {
              const masterIndex = allArticles['ittefaq'].findIndex(a => a.id === article.id);
              if (masterIndex !== -1) {
                allArticles['ittefaq'][masterIndex] = article;
                sessionStorage.setItem('all_articles', JSON.stringify(allArticles));
              }
            }

            setContent(fullText);
          } else {
            setContent("Article content is empty.");
          }
        } else {
          setContent("Article body structure not found on page.");
        }
      } catch (err) {
        setError(`Error parsing article: ${err.message}`);
      }
      setLoading(false);
    };

    fetchIttefaqContent();

    return () => {
      active = false;
    };
  }, [article, articles]);

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
        
        {article.summary && article.summary !== content && (
          <p className="article-summary">{article.summary}</p>
        )}
        
        {loading ? (
          <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '10pt' }}>
            <div className="spinner" style={{ marginBottom: '12px' }}></div>
            {t('Fetching full article body...')}
          </div>
        ) : error ? (
          <div style={{ padding: '20px 10px', color: '#ef4444', fontSize: '9.5pt', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <div className="article-content">
            {content}
          </div>
        )}
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
