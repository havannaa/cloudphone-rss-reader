import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import './Header.css'

function Header({ title }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const month = months[now.getMonth()];
      const date = now.getDate();
      
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      setTimeStr(`${month}-${date} | ${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <title>{title}</title>
      <header>
        <h1>{title}</h1>
        <div className="header-time">{timeStr}</div>
      </header>
    </>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
};

export default Header;
