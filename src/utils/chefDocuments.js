import { ChefDocumentStatus, ChefDocumentType } from '../types';
import { getPeruNowParts } from './peruDate';

/**
 * Catálogo de documentos que el admin puede cargar por cocinera.
 * Los ids son los mismos del select de cociname-admin (Chef/Control.cshtml).
 */
export const CHEF_DOCUMENT_CATALOG = [
  {
    type: ChefDocumentType.AntecedentesPoliciales,
    title: 'Antecedentes Policiales',
    sub: 'Certificado de antecedentes',
    emoji: '🛡️',
    tileBg: 'linear-gradient(135deg,#E7EEFA,#D6E4F7)',
  },
  {
    type: ChefDocumentType.CarnetSanidad,
    title: 'Carné de Sanidad',
    sub: 'Manipulación de alimentos',
    emoji: '🧼',
    tileBg: 'linear-gradient(135deg,#E4F6EC,#C4EBD3)',
  },
  {
    type: ChefDocumentType.CV,
    title: 'CV / Hoja de Vida',
    sub: 'Experiencia y referencias',
    emoji: '📄',
    tileBg: 'linear-gradient(135deg,#F0EBFB,#DDD0F5)',
  },
  {
    type: ChefDocumentType.DniPasaporte,
    title: 'DNI / Pasaporte',
    sub: 'Identidad y datos personales',
    emoji: '🪪',
    tileBg: 'linear-gradient(135deg,#FFE7DD,#FFD2C2)',
  },
];

const PALETTE = {
  green: { color: '#0B855C', bg: '#E4F6EC' },
  amber: { color: '#C7891A', bg: '#FCF0D8' },
  red: { color: '#C2492A', bg: '#FDECE7' },
  grey: { color: '#8089A0', bg: '#F0EEF0' },
};

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** El admin guarda "-" cuando el campo se dejó vacío. */
const isBlankDate = (value) => {
  const raw = String(value ?? '').trim();
  return !raw || raw === '-';
};

/** "2025-07-28" → "28 de julio de 2025". Devuelve null si no hay fecha usable. */
export const formatLongDate = (value) => {
  if (isBlankDate(value)) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return null;

  return `${Number(day)} de ${monthName} de ${year}`;
};

/**
 * Días que faltan para el vencimiento, contando días de calendario en Perú.
 * Negativo = ya venció. null si el documento no tiene fecha de fin.
 */
export const getDaysUntilExpiration = (dateEnd, now = new Date()) => {
  if (isBlankDate(dateEnd)) return null;
  const match = String(dateEnd).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  const end = Date.UTC(Number(year), Number(month) - 1, Number(day));

  const { dateKey } = getPeruNowParts(now);
  const [todayYear, todayMonth, todayDay] = dateKey.split('-');
  const today = Date.UTC(Number(todayYear), Number(todayMonth) - 1, Number(todayDay));

  return Math.round((end - today) / 86400000);
};

/** Umbral para avisar que un documento está por vencer. */
export const EXPIRATION_WARNING_DAYS = 30;

/**
 * Badge a mostrar por documento. La vigencia manda sobre el estado de revisión:
 * un documento aprobado pero vencido debe verse como vencido, no como aprobado.
 */
export const resolveDocumentBadge = (doc, now = new Date()) => {
  if (!doc) {
    return { label: 'Sin subir', ...PALETTE.grey, tone: 'missing' };
  }

  const status = Number(doc.documentStatus || 0);

  if (status === ChefDocumentStatus.Rechazado) {
    return { label: 'Rechazado', ...PALETTE.red, tone: 'rejected' };
  }
  if (status === ChefDocumentStatus.Observado) {
    return { label: 'Observado', ...PALETTE.amber, tone: 'observed' };
  }
  if (status === ChefDocumentStatus.Pendiente) {
    return { label: 'En revisión', ...PALETTE.amber, tone: 'pending' };
  }

  if (status === ChefDocumentStatus.Aprobado) {
    const days = getDaysUntilExpiration(doc.dateEnd, now);

    if (days === null) {
      return { label: 'Aprobado', ...PALETTE.green, tone: 'approved' };
    }
    if (days < 0) {
      return { label: 'Vencido', ...PALETTE.red, tone: 'expired' };
    }
    if (days <= EXPIRATION_WARNING_DAYS) {
      return { label: `Vence en ${days} d`, ...PALETTE.amber, tone: 'expiring' };
    }
    return { label: 'Vigente', ...PALETTE.green, tone: 'approved' };
  }

  return { label: 'Sin subir', ...PALETTE.grey, tone: 'missing' };
};

/**
 * Se queda con el documento más reciente por tipo: si la cocinera renovó,
 * la tabla guarda varias filas del mismo tipo y solo importa la última.
 */
export const pickLatestByType = (documents = []) => {
  const map = new Map();

  documents
    .filter((doc) => doc && doc.status !== false)
    .forEach((doc) => {
      const type = Number(doc.documentType || 0);
      const current = map.get(type);
      if (!current || Number(doc.id || 0) > Number(current.id || 0)) {
        map.set(type, doc);
      }
    });

  return map;
};
