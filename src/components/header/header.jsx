import React, { useState, useEffect } from 'react';

import { images } from '../../assets/images';



const Header = ({ onMenuPress, showMenu = true, notificationCount = 0, onNotificationPress }) => {

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);



  useEffect(() => {

    const handleResize = () => {

      setIsMobile(window.innerWidth < 768);

    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);

  }, []);



  return (

    <div style={styles.container}>

      <div className="header-inner-desktop" style={styles.inner}>

        {showMenu && onMenuPress && isMobile && (

          <button

            onClick={onMenuPress}

            style={styles.iconButton}

            aria-label="Abrir menú"

          >

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B2436" strokeWidth="2.2" strokeLinecap="round">

              <path d="M3 6h18M3 12h18M3 18h18" />

            </svg>

          </button>

        )}



        {!isMobile && <div className="header-spacer-desktop" aria-hidden="true" />}



        <img src={images.logo} alt="Cociname" className="header-logo-mobile-only" style={styles.logo} />



        {showMenu && (

          <button style={styles.iconButton} onClick={onNotificationPress} aria-label="Notificaciones">

            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1B2436" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">

              <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />

              <path d="M13.7 21a2 2 0 01-3.4 0" />

            </svg>

            {notificationCount > 0 && <span style={styles.notificationDot} />}

          </button>

        )}

      </div>

    </div>

  );

};



const styles = {

  container: {

    position: 'sticky',

    top: 0,

    zIndex: 40,

    background: 'rgba(255, 251, 247, 0.94)',

    backdropFilter: 'blur(8px)',

    borderBottom: '1px solid #F0E7DF',

  },

  inner: {

    height: 68,

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'space-between',

    padding: '12px 16px',

    maxWidth: 480,

    margin: '0 auto',

    width: '100%',

    boxSizing: 'border-box',

  },

  iconButton: {

    position: 'relative',

    width: 40,

    height: 40,

    borderRadius: 12,

    border: 'none',

    background: '#FFFFFF',

    boxShadow: '0 3px 10px rgba(27, 52, 92, 0.08)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    cursor: 'pointer',

    padding: 0,

    flexShrink: 0,

  },

  logo: {

    width: 122,

    height: 28,

    objectFit: 'contain',

  },

  notificationDot: {

    position: 'absolute',

    top: 8,

    right: 9,

    width: 7,

    height: 7,

    borderRadius: 999,

    background: '#F2542D',

    border: '1.5px solid #fff',

  },

};



export default Header;

