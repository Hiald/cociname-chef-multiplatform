import { API_CONFIG } from '../config';

export interface PublicLinkResolution {
  tipoReserva: number; // 1 = Reservation, 2 = ReservationSuscription, 3 = ReservationEvent
  reservaId: number;
}

export async function resolvePublicToken(token: string): Promise<PublicLinkResolution> {
  const url = `${API_CONFIG.BASE_URL}FichaPublica/resolve/${token}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Enlace inválido o expirado');
  }

  const json = await response.json();

  if (!json.success || !json.data) {
    throw new Error('Enlace inválido o expirado');
  }

  return {
    tipoReserva: json.data.tipoReserva,
    reservaId: json.data.reservaId,
  };
}
