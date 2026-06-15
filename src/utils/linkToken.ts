import { apiService } from '../services/api.service';
import { decryptToken } from './crypto';

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PUBLIC_LINK_TYPES = {
  RESERVATION: 1,
  SUBSCRIPTION: 2,
  EVENT: 3,
  DIET: 4,
  TAREA: 5,
} as const;

export function isGuidToken(token: string) {
  return GUID_REGEX.test(token);
}

export function parseRouteId(value: string) {
  const numericId = parseInt(value, 10);
  if (!Number.isNaN(numericId) && String(numericId) === value) {
    return { kind: 'numeric' as const, numericId };
  }
  return { kind: 'token' as const, token: value };
}

export async function resolvePublicLinkToken(token: string, expectedType?: number) {
  if (isGuidToken(token)) {
    const response = await apiService.resolvePublicLink(token);

    if (!response.success || !response.data) {
      throw new Error(response.errorMessage || 'Enlace inválido o expirado');
    }

    const reservationId = Number(response.data.reservaId ?? response.data.ReservaId);
    const tipo = Number(response.data.tipoReserva ?? response.data.TipoReserva);

    if (!reservationId || Number.isNaN(reservationId)) {
      throw new Error('Enlace inválido o expirado');
    }

    if (expectedType !== undefined && tipo !== expectedType) {
      throw new Error('Enlace inválido para este servicio');
    }

    return { reservationId, tipo };
  }

  const reservationId = decryptToken(token);
  return { reservationId, tipo: expectedType ?? PUBLIC_LINK_TYPES.RESERVATION };
}
