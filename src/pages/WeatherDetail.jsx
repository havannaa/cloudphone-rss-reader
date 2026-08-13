import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import Header from '../components/Header'
import { DISTRICTS, getWeatherCondition } from '../utils/weatherData'
import { t } from 'i18next'
import { withTranslation } from 'react-i18next'
import './NewsDetail.css'

function WeatherDetailPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const district = DISTRICTS.find(d => d.name.toLowerCase() === decodeURIComponent(name).toLowerCase());

  // States
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    if (!district) return;
    setLoading(true);
    setError(null);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${district.lat}&longitude=${district.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.current) {
        setWeather(data.current);
      } else {
        throw new Error("Invalid weather data response structure");
      }
    } catch (err) {
      console.error(err);
      setError(t('Failed to load weather report. Please try again.'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
  }, [name]);

  const handleKeyDown = (e) => {
    if (e.key === '0') {
      e.preventDefault();
      navigate('/weather');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const backBtn = containerRef.current?.querySelector('.focusable-item');
    if (backBtn) {
      backBtn.focus();
    }
  }, [loading]);

  if (!district) {
    return (
      <>
        <Header title={t('Error')} />
        <section id="app">
          <h2>{t('District Not Found')}</h2>
          <button onClick={() => navigate('/weather')} className="focusable-item" style={{ marginTop: '12px' }}>
            {t('Go Back')}
          </button>
        </section>
      </>
    );
  }

  const condition = weather ? getWeatherCondition(weather.weather_code) : { text: "", icon: "" };

  return (
    <>
      <Header title={district.name} />

      <section id="app" className="detail-container" ref={containerRef}>
        <div className="detail-header" style={{ marginBottom: '12px', textAlign: 'center' }}>
          <h2 className="detail-title" style={{ fontSize: '13pt', fontWeight: 'bold', margin: '4px 0', color: '#f8fafc' }}>
            {t(district.name)}
          </h2>
          <div style={{ fontSize: '7pt', color: '#64748b' }}>
            Lat: {district.lat} | Lon: {district.lon}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '10pt' }}>
            <div className="spinner" style={{ marginBottom: '12px' }}></div>
            {t('Loading weather data...')}
          </div>
        ) : error ? (
          <div style={{ padding: '20px 10px', color: '#ef4444', fontSize: '9.5pt', textAlign: 'center' }}>
            {error}
            <button
              onClick={fetchWeather}
              className="focusable-item nav-button-main"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                background: '#1971e6',
                color: 'white',
                fontSize: '9pt',
                fontWeight: 'bold',
                marginTop: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {t('Retry')}
            </button>
          </div>
        ) : (
          <div className="detail-body" style={{ fontSize: '8.5pt', lineHeight: '1.4' }}>
            {/* Huge Temp display */}
            <div style={{ textAlign: 'center', margin: '14px 0' }}>
              <div style={{ fontSize: '32pt', fontWeight: 'bold', color: '#f8fafc', lineHeight: '1' }}>
                {Math.round(weather.temperature_2m)}°C
              </div>
              <div style={{ fontSize: '20pt', margin: '6px 0 2px 0' }}>{condition.icon}</div>
              <div style={{ fontSize: '10pt', fontWeight: '500', color: '#e2e8f0' }}>{t(condition.text)}</div>
            </div>

            {/* Weather parameters */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '8pt' }}>{t('Feels Like')}:</span>
                <span style={{ color: '#e2e8f0', fontSize: '8pt', fontWeight: '500' }}>
                  {Math.round(weather.apparent_temperature)}°C
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '8pt' }}>{t('Humidity')}:</span>
                <span style={{ color: '#e2e8f0', fontSize: '8pt', fontWeight: '500' }}>
                  {weather.relative_humidity_2m}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '8pt' }}>{t('Precipitation')}:</span>
                <span style={{ color: '#e2e8f0', fontSize: '8pt', fontWeight: '500' }}>
                  {weather.precipitation} mm
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '8pt' }}>{t('Wind Speed')}:</span>
                <span style={{ color: '#e2e8f0', fontSize: '8pt', fontWeight: '500' }}>
                  {weather.wind_speed_10m} km/h
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/weather')}
              className="focusable-item nav-button-main"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                background: '#1971e6',
                color: 'white',
                fontSize: '9.5pt',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {t('Go Back')}
            </button>
          </div>
        )}
      </section>
    </>
  );
}

export default withTranslation()(WeatherDetailPage);
