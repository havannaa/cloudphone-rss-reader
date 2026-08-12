import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import Header from '../components/Header'
import { t } from 'i18next'
import { withTranslation } from 'react-i18next'
import './Home.css' // Re-use the layout styles

const dummyVideos = [
  { id: 1, title: "Learn React in 10 Minutes", duration: "10:15", views: "10K views", date: "2 hours ago" },
  { id: 2, title: "KaiOS Feature Phone App Development Tutorial", duration: "45:30", views: "5.4K views", date: "1 day ago" },
  { id: 3, title: "What is an RSS Feed? Introduction & Setup", duration: "12:05", views: "25K views", date: "3 days ago" },
  { id: 4, title: "Vite + React Deployment on GitHub Pages", duration: "08:45", views: "1.2K views", date: "1 week ago" }
];

function YoutubePage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e) => {
    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (!focusables.length) return;

    switch (e.key) {
      case 'ArrowDown':
      case '8':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % focusables.length);
        break;
      case 'ArrowUp':
      case '2':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + focusables.length) % focusables.length);
        break;
      case '1':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case '0':
        e.preventDefault();
        navigate('/');
        break;
    }
  };

  // Add keydown listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Focus active item
  useEffect(() => {
    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (focusables[focusedIndex]) {
      focusables[focusedIndex].focus();
    }
  }, [focusedIndex]);

  return (
    <>
      <Header title="YouTube" />

      <section id="app" ref={containerRef}>
        <h2 className="section-title">{t('YouTube Placeholder')}</h2>
        
        <div className="news-list">
          {dummyVideos.map((video, idx) => (
            <div
              key={video.id}
              tabIndex={0}
              className={`news-card focusable-item ${idx === focusedIndex ? 'focused' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', outline: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <h3 className="card-title" style={{ fontSize: '10.5pt', margin: 0, fontWeight: 'bold', lineHeight: '1.3' }}>
                  {idx + 1}. {video.title}
                </h3>
                <span style={{ fontSize: '7.5pt', background: '#334155', color: '#cbd5e1', padding: '2px 4px', borderRadius: '3px', marginLeft: '6px' }}>
                  {video.duration}
                </span>
              </div>
              <span style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '6px' }}>
                {video.views} • {video.date}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default withTranslation()(YoutubePage);
