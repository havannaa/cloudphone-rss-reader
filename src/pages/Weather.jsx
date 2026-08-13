import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router'
import Header from '../components/Header'
import { DISTRICTS } from '../utils/weatherData'
import { t } from 'i18next'
import { withTranslation } from 'react-i18next'
import './Home.css'

function WeatherPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [focusedIndex, setFocusedIndex] = useState(() => Number(sessionStorage.getItem('weather_district_focus') || 0));

  const handleKeyDown = (e) => {
    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (!focusables.length) return;

    switch (e.key) {
      case 'ArrowDown':
      case '8':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const nextIndex = (prev + 1) % focusables.length;
          sessionStorage.setItem('weather_district_focus', nextIndex);
          return nextIndex;
        });
        break;
      case 'ArrowUp':
      case '2':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const prevIndex = (prev - 1 + focusables.length) % focusables.length;
          sessionStorage.setItem('weather_district_focus', prevIndex);
          return prevIndex;
        });
        break;
      case '1':
        e.preventDefault();
        setFocusedIndex(0);
        sessionStorage.setItem('weather_district_focus', 0);
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
    const focusables = containerRef.current?.querySelectorAll('.focusable-item') || [];
    if (focusables[focusedIndex]) {
      focusables[focusedIndex].focus();
    }
  }, [focusedIndex]);

  return (
    <>
      <Header title={t('Weather Forecast')} />

      <section id="app" ref={containerRef}>
        <h2 className="section-title">{t('Select District')}</h2>

        <div className="news-list">
          {DISTRICTS.map((district, idx) => (
            <Link
              key={district.name}
              to={`/weather-detail/${encodeURIComponent(district.name)}`}
              className={`news-card focusable-item ${idx === focusedIndex ? 'focused' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <h3 className="card-title" style={{ fontSize: '11pt', margin: 0, fontWeight: 'bold' }}>
                  {idx + 1}. {t(district.name)}
                </h3>
                <span style={{ fontSize: '8.5pt', color: '#64748b' }}>➜</span>
              </div>
              <span style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '4px', textTransform: 'none' }}>
                {t('View weather report')}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default withTranslation()(WeatherPage);
