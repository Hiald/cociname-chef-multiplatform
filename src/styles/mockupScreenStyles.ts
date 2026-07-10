import { appScreenTheme as theme } from './appScreenTheme';

/** Breakpoint principal desktop (px) — usado en responsive.css */
export const DESKTOP_BREAKPOINT = 768;

export const mockup = {
  pageWrap: {
    padding: '18px 16px 28px',
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  requestsPageWrap: {
    padding: '18px 16px 28px',
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box' as const,
    minHeight: 'calc(100vh - 132px)',
    background: 'linear-gradient(180deg, #ECF2FB 0%, #F2F6FC 45%, #FBFBFD 100%)',
  },
  pageGradient: 'linear-gradient(180deg, #FFF3EC 0%, #FCF8F4 40%, #FBFBFD 100%)',
  requestsGradient: 'linear-gradient(180deg, #ECF2FB 0%, #F2F6FC 45%, #FBFBFD 100%)',
  screenTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 28,
    letterSpacing: -0.6,
    color: theme.textPrimary,
    margin: 0,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#9AA3B5',
    marginTop: 4,
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#9AA3B5',
    marginBottom: 12,
  },
  whiteCard: {
    backgroundColor: theme.cardBg,
    boxShadow: '0 4px 16px rgba(27, 52, 92, 0.08)',
    border: 'none',
    borderRadius: 20,
  },
  chipActive: {
    background: theme.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '8px 16px',
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flex: 'none' as const,
  },
  chipInactive: {
    background: '#fff',
    color: '#3B4658',
    border: '1px solid #EAE3DB',
    borderRadius: 999,
    padding: '8px 16px',
    fontFamily: theme.fontBody,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flex: 'none' as const,
    boxShadow: '0 2px 8px rgba(27, 52, 92, 0.05)',
  },
  tabPillActive: {
    background: theme.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '9px 20px',
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
  },
  tabPillInactive: {
    background: 'transparent',
    color: '#8089A0',
    border: 'none',
    borderRadius: 999,
    padding: '9px 20px',
    fontFamily: theme.fontBody,
    fontWeight: 600,
    fontSize: 13.5,
    cursor: 'pointer',
  },
  dayGroupTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#9AA3B5',
    margin: '10px 2px',
  },
};

export const getReservationEmoji = (tipo?: string) => {
  if (tipo === 'suscripcion') return '📅';
  if (tipo === 'evento') return '🎉';
  if (tipo === 'dieta') return '🥗';
  if (tipo === 'tarea') return '👨‍🍳';
  return '🍽️';
};

export const getReservationTileBg = (tipo?: string) => {
  if (tipo === 'suscripcion') return 'linear-gradient(135deg,#FFF3D6,#FFE49E)';
  if (tipo === 'evento') return 'linear-gradient(135deg,#F3E8FF,#E9D5FF)';
  if (tipo === 'dieta') return 'linear-gradient(135deg,#E4F6EC,#BFE9CF)';
  if (tipo === 'tarea') return 'linear-gradient(135deg,#FFE7DD,#FFC8B4)';
  return 'linear-gradient(135deg,#E7EEFA,#C6DBF6)';
};
