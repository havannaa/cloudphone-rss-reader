import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import Header from '../components/Header'
import { t } from 'i18next'
import { withTranslation } from 'react-i18next'
import './NewsDetail.css'

function CryptoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const activeArticles = JSON.parse(sessionStorage.getItem('active_articles') || '[]');
  const coinItem = activeArticles.find(item => item.id === Number(id));

  const handleKeyDown = (e) => {
    if (e.key === '0') {
      e.preventDefault();
      navigate('/crypto');
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
  }, []);

  if (!coinItem) {
    return (
      <>
        <Header title={t('Error')} />
        <section id="app">
          <h2>{t('Coin Details Not Found')}</h2>
          <button onClick={() => navigate('/crypto')} className="focusable-item" style={{ marginTop: '12px' }}>
            {t('Go Back')}
          </button>
        </section>
      </>
    );
  }

  const jsonMatch = coinItem.content.match(/\|\|JSON:(.+)$/);
  const details = jsonMatch ? JSON.parse(jsonMatch[1]) : null;

  const change24 = details ? parseFloat(details.percent_change_24h || '0') : 0;
  const change1 = details ? parseFloat(details.percent_change_1h || '0') : 0;
  const change7 = details ? parseFloat(details.percent_change_7d || '0') : 0;

  const formatCurrency = (val) => {
    if (!val) return t('N/A');
    const parsed = Number(val);
    if (isNaN(parsed)) return t('N/A');
    return parsed.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const formatNumber = (val) => {
    if (!val) return t('N/A');
    const parsed = Number(val);
    if (isNaN(parsed)) return t('N/A');
    return parsed.toLocaleString('en-US');
  };

  return (
    <>
      <Header title={coinItem.title.split(' - ')[0]} />

      <section id="app" className="detail-container" ref={containerRef}>
        <div className="detail-header" style={{ marginBottom: '12px' }}>
          <span className="detail-badge" style={{ backgroundColor: '#1971e6', color: 'white', marginRight: '6px', fontSize: '7.5pt', padding: '3px 6px', borderRadius: '4px' }}>
            Rank #{details?.rank || 'N/A'}
          </span>
          <h2 className="detail-title" style={{ fontSize: '12pt', fontWeight: 'bold', margin: '8px 0 4px 0', color: '#f8fafc' }}>
            {coinItem.title.split(' - ')[0]}
          </h2>
          <div className="detail-date" style={{ fontSize: '7pt', color: '#64748b' }}>
            {t('Updated')}: {coinItem.date}
          </div>
        </div>

        <div className="detail-body" style={{ fontSize: '8.5pt', lineHeight: '1.4' }}>
          {/* Price Grid */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>{t('Price USD')}:</span>
              <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{details ? formatCurrency(details.price_usd) : t('N/A')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>{t('Price BTC')}:</span>
              <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{details?.price_btc || t('N/A')} BTC</span>
            </div>
          </div>

          {/* Change Performance Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '7pt', color: '#94a3b8', marginBottom: '1px' }}>1h</div>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', color: change1 >= 0 ? '#22c55e' : '#ef4444' }}>
                {change1 >= 0 ? '+' : ''}{change1}%
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '7pt', color: '#94a3b8', marginBottom: '1px' }}>24h</div>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', color: change24 >= 0 ? '#22c55e' : '#ef4444' }}>
                {change24 >= 0 ? '+' : ''}{change24}%
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '7pt', color: '#94a3b8', marginBottom: '1px' }}>7d</div>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', color: change7 >= 0 ? '#22c55e' : '#ef4444' }}>
                {change7 >= 0 ? '+' : ''}{change7}%
              </div>
            </div>
          </div>

          {/* Supply & Market Caps */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '8pt' }}>{t('Market Cap')}:</span>
              <span style={{ color: '#e2e8f0', fontSize: '8pt', fontWeight: '500' }}>{details ? formatCurrency(details.market_cap_usd).split('.')[0] : t('N/A')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '8pt' }}>{t('Volume 24h')}:</span>
              <span style={{ color: '#e2e8f0', fontSize: '8pt', fontWeight: '500' }}>{details ? formatCurrency(details.volume24).split('.')[0] : t('N/A')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '8pt' }}>{t('Circ. Supply')}:</span>
              <span style={{ color: '#e2e8f0', fontSize: '8pt', fontWeight: '500' }}>{details ? formatNumber(details.csupply) : t('N/A')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: '8pt' }}>{t('Max Supply')}:</span>
              <span style={{ color: '#e2e8f0', fontSize: '8pt', fontWeight: '500' }}>{details ? formatNumber(details.msupply) : t('N/A')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/crypto')}
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
      </section>
    </>
  );
}

export default withTranslation()(CryptoDetailPage);
