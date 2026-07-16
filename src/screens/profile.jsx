import React, { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { appScreenTheme as theme, mockup } from '../styles';

import { useAuth } from '../hooks/useAuth';

import { apiService } from '../services/api.service';

import { GEO_CONFIG } from '../config';



const ProfileScreen = () => {

  const { chefData } = useAuth();

  const navigate = useNavigate();

  const [districtName, setDistrictName] = useState('');



  useEffect(() => {

    const districtId = Number(chefData?.district || 0);

    if (districtId <= 0) {

      setDistrictName('');

      return;

    }

    apiService.getGeoDivisions(3).then((res) => {

      if (res.success && Array.isArray(res.data)) {

        const match = res.data.find((d) => d.id === districtId);

        setDistrictName(match ? match.name : '');

      }

    }).catch(() => setDistrictName(''));

  }, [chefData]);



  const initials = useMemo(() => {

    const first = chefData?.firstName?.charAt(0) || 'C';

    const last = chefData?.lastName?.charAt(0) || 'H';

    return `${first}${last}`.toUpperCase();

  }, [chefData]);



  const fullName = useMemo(() => {

    const firstName = chefData?.firstName || 'Chef';

    const lastName = chefData?.lastName || '';

    return `${firstName} ${lastName}`.trim();

  }, [chefData]);



  const specialtyLine = useMemo(() => {

    const raw = chefData?.specialty || '';

    const first = String(raw).split(',')[0]?.trim();

    const location = districtName || 'Sin ubicación';

    return first ? `${first} · ${location}` : location;

  }, [chefData, districtName]);



  const rating = Number(chefData?.rating || 0).toFixed(1);



  const verificationItems = useMemo(() => ([

    {

      title: 'Verificación de datos',

      sub: 'Identidad y datos personales',

      status: chefData?.documentNumber ? 'Aprobado' : 'Pendiente',

      color: chefData?.documentNumber ? '#0B855C' : '#B07D12',

      bg: chefData?.documentNumber ? '#E4F6EC' : '#FFF3D6',

      icon: '🪪',

    },

    {

      title: 'Filtros de seguridad',

      sub: 'Verificación de antecedentes',

      status: chefData?.status ? 'En revisión' : 'Pendiente',

      color: '#B07D12',

      bg: '#FFF3D6',

      icon: '🛡️',

    },

    {

      title: 'Protocolo de sanidad',

      sub: 'Manipulación de alimentos',

      status: chefData?.processDetailtoCooking ? 'Pendiente' : 'Realizado',

      color: chefData?.processDetailtoCooking ? '#C2492A' : '#0B855C',

      bg: chefData?.processDetailtoCooking ? '#FDE9E2' : '#E4F6EC',

      icon: '🧼',

    },

    {

      title: 'Onboarding',

      sub: 'Uniformes y fotocheck',

      status: chefData?.emailConfirmed ? 'Realizado' : 'Pendiente',

      color: chefData?.emailConfirmed ? '#0B855C' : '#B07D12',

      bg: chefData?.emailConfirmed ? '#E4F6EC' : '#FFF3D6',

      icon: '📦',

    },

    {

      title: 'Firma de documentos',

      sub: 'Contrato y reglamento',

      status: chefData?.documentNumber ? 'Realizado' : 'Pendiente',

      color: chefData?.documentNumber ? '#0B855C' : '#B07D12',

      bg: chefData?.documentNumber ? '#E4F6EC' : '#FFF3D6',

      icon: '✍️',

    },

  ]), [chefData]);



  const menuItems = [

    {

      title: 'Reseñas',

      sub: `${rating} ★ · reseñas de clientes`,

      emoji: '⭐',

      tileBg: 'linear-gradient(135deg,#FFE7DD,#FFD2C2)',

      onClick: null,

    },

    {

      title: 'Mi disponibilidad',

      sub: 'Define tus días y horarios de atención',

      emoji: '📅',

      tileBg: 'linear-gradient(135deg,#E7EEFA,#C6DBF6)',

      onClick: () => navigate('/availability'),

    },

  ];



  return (

    <div className="coci-page-wrap">

      <h1 style={{ ...mockup.screenTitle, marginBottom: 18 }}>Mi perfil</h1>



      <div style={styles.heroCard}>

        <div style={styles.avatar}>{initials}</div>

        <div style={styles.heroText}>

          <div style={styles.heroName}>{fullName}</div>

          <div style={styles.heroSub}>{specialtyLine}</div>

          <div style={styles.ratingPill}>

            <span style={styles.ratingStar}>★</span>

            <span style={styles.ratingValue}>{rating}</span>

            <span style={styles.ratingCount}>· reseñas de clientes</span>

          </div>

        </div>

      </div>



      <div style={styles.menuCard}>

        {menuItems.map((item, index) => (

          <button

            key={item.title}

            type="button"

            style={{

              ...styles.menuItem,

              ...(index < menuItems.length - 1 ? styles.menuItemBorder : {}),

            }}

            onClick={item.onClick || undefined}

            disabled={!item.onClick}

          >

            <div style={{ ...styles.menuIcon, background: item.tileBg }}>{item.emoji}</div>

            <div style={styles.menuTextWrap}>

              <div style={styles.menuTitle}>{item.title}</div>

              <div style={styles.menuSub}>{item.sub}</div>

            </div>

            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C3CAD6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">

              <path d="M9 18l6-6-6-6" />

            </svg>

          </button>

        ))}

      </div>



      <div style={styles.sectionTitle}>Verificaciones</div>

      <div style={styles.verifCard}>

        {verificationItems.map((item, index) => (

          <div

            key={item.title}

            style={{

              ...styles.verifRow,

              ...(index < verificationItems.length - 1 ? styles.verifRowBorder : {}),

            }}

          >

            <div style={styles.verifIcon}>{item.icon}</div>

            <div style={styles.verifText}>

              <div style={styles.verifTitle}>{item.title}</div>

              <div style={styles.verifSub}>{item.sub}</div>

            </div>

            <span style={{ ...styles.verifBadge, color: item.color, background: item.bg }}>{item.status}</span>

          </div>

        ))}

      </div>



      {chefData?.description && (

        <>

          <div style={styles.sectionTitle}>Sobre mí</div>

          <div style={styles.aboutCard}>

            <p style={styles.aboutText}>{String(chefData.description)}</p>

            {chefData?.coverageRadiusKm ? (

              <p style={styles.aboutMeta}>

                Cobertura: {chefData.coverageRadiusKm} km · {GEO_CONFIG.LEVEL3_LABEL}: {districtName || '—'}

              </p>

            ) : null}

          </div>

        </>

      )}

    </div>

  );

};



const styles = {

  heroCard: {

    background: '#fff',

    boxShadow: theme.cardShadow,

    borderRadius: theme.cardRadiusLg,

    padding: 22,

    marginBottom: 22,

    display: 'flex',

    alignItems: 'center',

    gap: 16,

  },

  avatar: {

    width: 72,

    height: 72,

    borderRadius: 22,

    background: 'linear-gradient(135deg,#FFD2C2,#FF9E7D)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    fontFamily: theme.fontHeading,

    fontWeight: 800,

    fontSize: 26,

    color: '#B23A18',

    flexShrink: 0,

  },

  heroText: { minWidth: 0, flex: 1 },

  heroName: {

    fontFamily: theme.fontHeading,

    fontWeight: 800,

    fontSize: 21,

    letterSpacing: -0.4,

    color: theme.textPrimary,

  },

  heroSub: {

    fontSize: 13.5,

    color: theme.textCaption,

    marginTop: 3,

  },

  ratingPill: {

    display: 'inline-flex',

    alignItems: 'center',

    gap: 6,

    marginTop: 9,

    background: theme.accentSoft,

    borderRadius: 999,

    padding: '5px 11px',

  },

  ratingStar: { color: theme.accent, fontSize: 13 },

  ratingValue: {

    fontFamily: theme.fontHeading,

    fontWeight: 800,

    fontSize: 13.5,

    color: theme.accent,

  },

  ratingCount: {

    fontSize: 12,

    color: '#B4693F',

    fontWeight: 600,

  },

  menuCard: {

    background: '#fff',

    boxShadow: theme.cardShadow,

    borderRadius: theme.cardRadius,

    padding: '6px 18px',

    marginBottom: 22,

  },

  menuItem: {

    width: '100%',

    textAlign: 'left',

    background: 'none',

    border: 'none',

    display: 'flex',

    alignItems: 'center',

    gap: 13,

    padding: '15px 0',

    cursor: 'pointer',

  },

  menuItemBorder: {

    borderBottom: `1px solid ${theme.divider}`,

  },

  menuIcon: {

    width: 40,

    height: 40,

    borderRadius: 13,

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,

    fontSize: 18,

  },

  menuTextWrap: { flex: 1, minWidth: 0 },

  menuTitle: {

    fontFamily: theme.fontHeading,

    fontWeight: 700,

    fontSize: 15,

    color: theme.textPrimary,

  },

  menuSub: {

    fontSize: 12,

    color: theme.textMuted,

    marginTop: 2,

  },

  sectionTitle: {

    fontFamily: theme.fontHeading,

    fontWeight: 800,

    fontSize: 16,

    margin: '0 2px 12px',

    color: theme.textPrimary,

  },

  verifCard: {

    background: '#fff',

    boxShadow: theme.cardShadow,

    borderRadius: theme.cardRadius,

    padding: '8px 18px',

    marginBottom: 22,

  },

  verifRow: {

    display: 'flex',

    alignItems: 'center',

    gap: 13,

    padding: '14px 0',

  },

  verifRowBorder: {

    borderBottom: `1px solid ${theme.divider}`,

  },

  verifIcon: {

    width: 38,

    height: 38,

    borderRadius: 12,

    background: 'linear-gradient(135deg,#FFE7DD,#FFD2C2)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,

    fontSize: 16,

  },

  verifText: { flex: 1, minWidth: 0 },

  verifTitle: {

    fontFamily: theme.fontHeading,

    fontWeight: 700,

    fontSize: 14,

    color: theme.textPrimary,

  },

  verifSub: {

    fontSize: 11.5,

    color: theme.textMuted,

    marginTop: 1,

  },

  verifBadge: {

    fontSize: 11,

    fontWeight: 700,

    borderRadius: 999,

    padding: '5px 12px',

    flexShrink: 0,

  },

  aboutCard: {

    background: '#fff',

    boxShadow: theme.cardShadow,

    borderRadius: theme.cardRadius,

    padding: 18,

    marginBottom: 12,

  },

  aboutText: {

    margin: 0,

    fontSize: 14,

    lineHeight: 1.55,

    color: theme.textPrimary,

  },

  aboutMeta: {

    margin: '12px 0 0',

    fontSize: 12.5,

    color: theme.textMuted,

  },

};



export default ProfileScreen;

