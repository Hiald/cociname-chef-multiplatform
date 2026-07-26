import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appScreenTheme as theme, mockup } from '../styles';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api.service';

// Paletas de avatar del maquetado; se asigna una por reseña de forma estable.
const AVATAR_PALETTE = [
  { bg: 'linear-gradient(135deg,#E7EEFA,#D6E4F7)', color: '#1763C9' },
  { bg: 'linear-gradient(135deg,#E4F6EC,#C4EBD3)', color: '#0B855C' },
  { bg: 'linear-gradient(135deg,#F0EBFB,#DDD0F5)', color: '#7A4FD0' },
];

const buildStars = (value) => {
  const filled = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};

const buildInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CL';
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${second}`.toUpperCase();
};

/**
 * El API graba los timestamps con DateTime.Now dentro de un contenedor en UTC,
 * así que se interpretan como UTC para que el "hace X" no salga corrido 5 horas.
 */
const parseApiDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim().replace(' ', 'T');
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildRelativeTime = (value) => {
  const date = parseApiDate(value);
  if (!date) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Hace un momento';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? 'Hace 1 minuto' : `Hace ${minutes} minutos`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;

  const months = Math.floor(days / 30);
  if (days < 365) return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;

  const years = Math.floor(days / 365);
  return years === 1 ? 'Hace 1 año' : `Hace ${years} años`;
};

const ReviewsScreen = () => {
  const navigate = useNavigate();
  const { chefData } = useAuth();
  const chefId = Number(chefData?.chefId || chefData?.id || 0);

  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadReviews = useCallback(async () => {
    if (chefId <= 0) {
      setLoading(false);
      setErrorMessage('No se pudo identificar tu perfil de cocinera.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const [ratingsResponse, averageResponse] = await Promise.all([
        apiService.getChefRatings(chefId, 1, 100),
        apiService.getChefRatingAverage(chefId),
      ]);

      if (!ratingsResponse.success) {
        throw new Error(ratingsResponse.errorMessage || 'No se pudieron cargar tus reseñas.');
      }

      // El listado del API no filtra soft-delete; las borradas se descartan aquí
      // para que coincidan con el promedio (ese sí las excluye).
      const visible = (ratingsResponse.data || []).filter((item) => item?.status !== false);

      const sorted = visible.slice().sort((a, b) => {
        const dateA = parseApiDate(a?.createdAt)?.getTime() ?? 0;
        const dateB = parseApiDate(b?.createdAt)?.getTime() ?? 0;
        if (dateA !== dateB) return dateB - dateA;
        return Number(b?.id || 0) - Number(a?.id || 0);
      });

      setReviews(sorted);

      const apiAverage = Number(averageResponse?.data || 0);
      if (averageResponse?.success && apiAverage > 0) {
        setAverage(apiAverage);
      } else if (sorted.length) {
        const total = sorted.reduce((acc, item) => acc + Number(item?.ratingValue || 0), 0);
        setAverage(total / sorted.length);
      } else {
        setAverage(0);
      }
    } catch (error) {
      console.error('Error loading chef reviews:', error);
      setReviews([]);
      setAverage(0);
      setErrorMessage(error?.message || 'No se pudieron cargar tus reseñas.');
    } finally {
      setLoading(false);
    }
  }, [chefId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const ratingBars = useMemo(() => {
    const total = reviews.length;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((item) => Math.round(Number(item?.ratingValue || 0)) === star).length;
      return {
        star,
        count,
        width: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
      };
    });
  }, [reviews]);

  const averageLabel = average > 0 ? average.toFixed(1) : '0.0';
  const countLabel = reviews.length === 1 ? '1 reseña' : `${reviews.length} reseñas`;

  return (
    <div className="coci-page-wrap">
      <button type="button" style={styles.backButton} onClick={() => navigate('/profile')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver a mi perfil
      </button>

      <h1 style={{ ...mockup.screenTitle, marginBottom: 18 }}>Reseñas</h1>

      {loading ? (
        <div style={styles.stateCard}>
          <div style={styles.stateText}>Cargando tus reseñas...</div>
        </div>
      ) : errorMessage ? (
        <div style={styles.stateCard}>
          <div style={styles.stateEmoji}>⚠️</div>
          <div style={styles.stateText}>{errorMessage}</div>
          <button type="button" style={styles.retryButton} onClick={() => void loadReviews()}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div style={styles.summaryCard}>
            <div style={styles.summaryScore}>
              <div style={styles.summaryAverage}>{averageLabel}</div>
              <div style={styles.summaryStars}>{buildStars(average)}</div>
              <div style={styles.summaryCount}>{countLabel}</div>
            </div>
            <div style={styles.summaryBars}>
              {ratingBars.map((bar) => (
                <div key={bar.star} style={styles.barRow}>
                  <span style={styles.barLabel}>{bar.star}</span>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: bar.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div style={styles.stateCard}>
              <div style={styles.stateEmoji}>⭐</div>
              <div style={styles.stateText}>Aún no tienes reseñas.</div>
              <div style={styles.stateHint}>
                Cuando tus clientes te califiquen desde tu perfil público, las verás aquí.
              </div>
            </div>
          ) : (
            <div style={styles.reviewList}>
              {reviews.map((review, index) => {
                const palette = AVATAR_PALETTE[(Number(review?.id) || index) % AVATAR_PALETTE.length];
                const when = buildRelativeTime(review?.createdAt);

                return (
                  <div key={review?.id ?? index} style={styles.reviewCard}>
                    <div style={styles.reviewHeader}>
                      <div style={{ ...styles.avatar, background: palette.bg, color: palette.color }}>
                        {buildInitials(review?.customerName)}
                      </div>
                      <div style={styles.reviewMeta}>
                        <div style={styles.reviewName}>{review?.customerName || 'Cliente'}</div>
                        <div style={styles.reviewSub}>
                          <span style={styles.reviewStars}>{buildStars(review?.ratingValue)}</span>
                          {when ? ` · ${when}` : ''}
                        </div>
                      </div>
                    </div>
                    {review?.comment ? (
                      <p style={styles.reviewText}>{review.comment}</p>
                    ) : (
                      <p style={{ ...styles.reviewText, color: theme.textMuted, fontStyle: 'italic' }}>
                        Sin comentario.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    background: 'none',
    border: 'none',
    color: theme.textCaption,
    fontFamily: theme.fontBody,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 16,
  },
  summaryCard: {
    background: theme.cardBg,
    boxShadow: theme.cardShadow,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    display: 'flex',
    gap: 22,
    alignItems: 'center',
  },
  summaryScore: {
    textAlign: 'center',
    flex: 'none',
  },
  summaryAverage: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 40,
    lineHeight: 1,
    letterSpacing: -1,
    color: theme.textPrimary,
  },
  summaryStars: {
    color: theme.accent,
    fontSize: 14,
    marginTop: 6,
    letterSpacing: 2,
  },
  summaryCount: {
    fontSize: 11.5,
    color: theme.textMuted,
    marginTop: 6,
  },
  summaryBars: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  },
  barLabel: {
    fontSize: 11,
    color: theme.textMuted,
    width: 8,
  },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    background: '#F0EEF0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: theme.accent,
    borderRadius: 999,
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  reviewCard: {
    background: theme.cardBg,
    boxShadow: theme.cardShadow,
    borderRadius: 20,
    padding: 18,
  },
  reviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 14,
    flex: 'none',
  },
  reviewMeta: {
    flex: 1,
    minWidth: 0,
  },
  reviewName: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14.5,
    color: theme.textPrimary,
  },
  reviewSub: {
    fontSize: 11.5,
    color: theme.textMuted,
    marginTop: 2,
  },
  reviewStars: {
    color: theme.accent,
    letterSpacing: 1,
  },
  reviewText: {
    margin: 0,
    fontSize: 13.5,
    color: '#4B5568',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  stateCard: {
    background: theme.cardBg,
    boxShadow: theme.cardShadow,
    borderRadius: 20,
    padding: '28px 20px',
    textAlign: 'center',
  },
  stateEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },
  stateText: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 15,
    color: theme.textPrimary,
  },
  stateHint: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 6,
    lineHeight: 1.5,
  },
  retryButton: {
    marginTop: 14,
    padding: '10px 22px',
    borderRadius: 12,
    border: 'none',
    background: theme.primaryGradient,
    color: '#fff',
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
    boxShadow: theme.primaryShadow,
  },
};

export default ReviewsScreen;
