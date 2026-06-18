import CryptoJS from 'crypto-js';
import { API_CONFIG } from '../config';

const KEY = 'SomosCocinameSioQue20251';
const IV = 'VectorInit123456';

export interface PublicLinkResolution {
  tipoReserva: number;
  reservaId: number;
}

/**
 * Desencripta un token legacy (AES) y retorna el ID de la reserva.
 */
export function decryptToken(token: string): number {
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');

    switch (base64.length % 4) {
      case 2:
        base64 += '==';
        break;
      case 3:
        base64 += '=';
        break;
    }

    const key = CryptoJS.enc.Utf8.parse(KEY);
    const iv = CryptoJS.enc.Utf8.parse(IV);

    const decrypted = CryptoJS.AES.decrypt(base64, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    const reservationId = parseInt(decryptedText, 10);

    if (Number.isNaN(reservationId)) {
      throw new Error('Token inválido: no se pudo extraer ID');
    }

    return reservationId;
  } catch (error) {
    console.error('Error desencriptando token:', error);
    throw new Error('Enlace inválido o expirado');
  }
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
