/**
 * Utilidad para desencriptar tokens AES
 * Traducción del código C# de desencriptado
 */

// Importar crypto-js para web
// Nota: Necesitarás instalar: yarn add crypto-js @types/crypto-js
import CryptoJS from 'crypto-js';

const KEY = 'SomosCocinameSioQue20251'; // 24 caracteres
const IV = 'VectorInit123456'; // 16 caracteres

/**
 * Desencripta un token y retorna el ID de la reserva
 * @param token Token encriptado en formato URL-safe base64
 * @returns ID de la reserva desencriptado
 */
export function decryptToken(token: string): number {
  try {
    // Reemplazar caracteres URL-safe por base64 estándar
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    
    // Agregar padding si es necesario
    switch (base64.length % 4) {
      case 2:
        base64 += '==';
        break;
      case 3:
        base64 += '=';
        break;
    }

    // Convertir Key e IV a WordArray
    const key = CryptoJS.enc.Utf8.parse(KEY);
    const iv = CryptoJS.enc.Utf8.parse(IV);

    // Desencriptar usando AES en modo CBC con padding PKCS7
    const decrypted = CryptoJS.AES.decrypt(base64, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Convertir a string y parsear como número
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    const reservationId = parseInt(decryptedText, 10);

    if (isNaN(reservationId)) {
      throw new Error('Token inválido: no se pudo extraer ID');
    }

    return reservationId;
  } catch (error) {
    console.error('Error desencriptando token:', error);
    throw new Error('Enlace inválido o expirado');
  }
}
