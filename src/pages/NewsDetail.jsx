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

  // Sync content state when article id parameter changes (from keybind article transitions)
  useEffect(() => {
    if (article) {
      setContent(article.content);
      setError(null);
      setLoading(false);
      // Reset scroll position on container
      const container = document.getElementById('app');
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [id, article]);

  useEffect(() => {
    if (!article) return;
    const dynamicSources = ['ittefaq', 'banglatribune'];
    if (!dynamicSources.includes(article.sourceId)) return;
    
    // If we already have the crawled body (longer than 20 chars), skip network fetch
    if (article.content && article.content.trim().length > 20) {
      setContent(article.content);
      return;
    }

    let active = true;
    setLoading(true);

    const fetchDetailContent = async () => {
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
        
        let articleBody = null;
        if (article.sourceId === 'ittefaq') {
          // Ittefaq element selectors from Python scraper
          articleBody = doc.querySelector('article.jw_detail_content_holder div[itemprop="articleBody"]');
        } else if (article.sourceId === 'banglatribune') {
          // Bangla Tribune selectors from Python scraper:
          // article_tag = sp_soup.find('div', class_='viewport jw_article_body')
          articleBody = doc.querySelector('div.viewport.jw_article_body');
        }
        
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
            if (allArticles[article.sourceId]) {
              const masterIndex = allArticles[article.sourceId].findIndex(a => a.id === article.id);
              if (masterIndex !== -1) {
                allArticles[article.sourceId][masterIndex] = article;
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

    fetchDetailContent();

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
      case '1':
        e.preventDefault();
        if (container) {
          container.scrollTop = 0;
        }
        break;
      case '4':
        e.preventDefault();
        if (article && articles.length > 0) {
          const currentIndex = articles.findIndex(a => a.id === article.id);
          if (currentIndex !== -1) {
            const prevIndex = (currentIndex - 1 + articles.length) % articles.length;
            const prevArticle = articles[prevIndex];
            navigate(`/news/${prevArticle.id}`, { replace: true });
          }
        }
        break;
      case '6':
        e.preventDefault();
        if (article && articles.length > 0) {
          const currentIndex = articles.findIndex(a => a.id === article.id);
          if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % articles.length;
            const nextArticle = articles[nextIndex];
            navigate(`/news/${nextArticle.id}`, { replace: true });
          }
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
