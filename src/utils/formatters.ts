/**
 * Funciones helper para formateo de datos
 */

import { apiService } from '../services/api.service';

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo dinámico de distritos/comunas (multi-país).
// Se carga del API en el primer uso de getDistrictName(); el switch legacy de
// Lima queda como fallback síncrono mientras llega la respuesta (o si falla).
// Con el catálogo nacional cargado (1,874 distritos) y la expansión a Chile,
// el switch fijo ya no alcanza.
// ─────────────────────────────────────────────────────────────────────────────
let geoNombres: Record<number, string> = {};
let geoCargaIniciada = false;

function asegurarCatalogoGeo(): void {
  if (geoCargaIniciada) return;
  geoCargaIniciada = true;
  apiService.getGeoDivisions(3)
    .then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const mapa: Record<number, string> = {};
        res.data.forEach((d) => { mapa[d.id] = d.name; });
        geoNombres = mapa;
      } else {
        geoCargaIniciada = false; // reintentar en el próximo uso
      }
    })
    .catch(() => { geoCargaIniciada = false; });
}

/**
 * Formateador de fechas para Lima, Perú (UTC-5)
 * Evita el error de "un día menos" usando UTC
 */
export function formatearFechaPerú(fechaISO: string | Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC' // Forzamos UTC para que coincida con la entrada ISO
  };

  return new Intl.DateTimeFormat('es-PE', opciones).format(new Date(fechaISO));
}

/**
 * Formatea una fecha para mostrar con día de la semana
 * Formato: "lunes, 5 ene"
 */
export function formatearFechaConDia(fechaISO: string | Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  };

  return new Intl.DateTimeFormat('es-PE', opciones).format(new Date(fechaISO));
}

/**
 * Retorna el nombre de la categoría de ingrediente
 */
export function getCategoryName(categoryId: number): string {
  switch (categoryId) {
    case 1: return "Proteína";
    case 2: return "Carbohidratos";
    case 3: return "Verduras";
    case 4: return "Básicos de cocina";
    case 5: return "Especias";
    case 6: return "Lácteos";
    case 7: return "Frutos secos";
    case 8: return "Otros";
    case 9: return "Frutas";
    case 10: return "Menestras";
    default: return "-";
  }
}

/**
 * Retorna el nombre de la unidad de medida
 */
export function getUnitName(unitId: number): string {
  switch (unitId) {
    case 1: return "Unidad (un)";
    case 2: return "Kilogramos (kg)";
    case 4: return "Litros (lt)";
    case 6: return "Cucharada (cda)";
    case 7: return "Cucharadita (cdta)";
    case 8: return "Atado";
    case 9: return "Hojas";
    case 10: return "Ramita";
    default: return "-";
  }
}

/**
 * Retorna la abreviatura de la unidad de medida
 */
export function getUnitAbbreviation(unitId: number): string {
  switch (unitId) {
    case 1: return "un";
    case 2: return "kg";
    case 4: return "lt";
    case 6: return "cda";
    case 7: return "cdta";
    case 8: return "atado";
    case 9: return "hojas";
    case 10: return "ramita";
    default: return "";
  }
}

/**
 * Formatea el tamaño/cantidad según la unidad
 * - kg: convierte a gramos si es < 1kg
 * - litros: convierte a ml si es < 1lt
 * - otras unidades: muestra el valor con la abreviatura
 */
export function formatSize(size: number, unit = 2): string {
  const value = parseFloat(size.toString());
  
  // Kilogramos (unit = 2)
  if (unit === 2) {
    if (value < 1) {
      const fraccion = value;
      
      if (fraccion === 0.25) {
        return "1/4 kg";
      } else if (fraccion === 0.5) {
        return "1/2 kg";
      } else if (fraccion === 0.75) {
        return "3/4 kg";
      } else {
        const gramos = Math.round(value * 1000);
        return gramos + " gr";
      }
    } else {
      return value.toFixed(2) + " kg";
    }
  }
  
  // Litros (unit = 4)
  if (unit === 4) {
    if (value < 1) {
      const mililitros = Math.round(value * 1000);
      return mililitros + " ml";
    } else {
      return value.toFixed(2) + " lt";
    }
  }
  
  // Otras unidades: mostrar valor + abreviatura
  const abbreviation = getUnitAbbreviation(unit);
  
  // Para unidades, mostrar número entero si es entero
  if (unit === 1 && Number.isInteger(value)) {
    return value + " " + abbreviation;
  }
  
  return value.toFixed(2) + " " + abbreviation;
}

/**
 * Formatea la cantidad de un ingrediente (usa size si uM_value es 0)
 */
export function formatIngredientQuantity(ingredient: any): string {
  const value = ingredient.uM_value && ingredient.uM_value > 0 
    ? ingredient.uM_value 
    : parseFloat(ingredient.size || 0);
  
  return formatSize(value, ingredient.unit);
}

/**
 * Retorna el nombre del concepto de pago
 */
export function getConceptName(conceptId: number): string {
  switch (conceptId) {
    case 1: return "Cocina";
    case 2: return "Compras";
    case 3: return "Movilidad";
    case 4: return "Otro";
    case 5: return "Cocina, compra e ingredientes";
    default: return "-";
  }
}

/**
 * Retorna el nombre del distrito/comuna por su ID.
 * Multi-país: primero el catálogo del API; el switch legacy de Lima es el
 * fallback síncrono mientras el catálogo carga.
 */
export function getDistrictName(districtId: number): string {
  asegurarCatalogoGeo();
  if (geoNombres[districtId]) return geoNombres[districtId];

  switch (districtId) {
    case 1: return "ANCON";
    case 2: return "ATE";
    case 3: return "BARRANCO";
    case 4: return "BREÑA";
    case 5: return "CARABAYLLO";
    case 6: return "CHACLACAYO";
    case 7: return "CHORRILLOS";
    case 8: return "CIENEGUILLA";
    case 9: return "COMAS";
    case 10: return "EL AGUSTINO";
    case 11: return "INDEPENDENCIA";
    case 12: return "JESUS MARIA";
    case 13: return "LA MOLINA";
    case 14: return "LA VICTORIA";
    case 15: return "LIMA";
    case 16: return "LINCE";
    case 17: return "LOS OLIVOS";
    case 18: return "LURIGANCHO";
    case 19: return "LURIN";
    case 20: return "MAGDALENA DEL MAR";
    case 21: return "MIRAFLORES";
    case 22: return "PACHACAMAC";
    case 23: return "PUCUSANA";
    case 24: return "PUEBLO LIBRE";
    case 25: return "PUENTE PIEDRA";
    case 26: return "PUNTA HERMOSA";
    case 27: return "PUNTA NEGRA";
    case 28: return "RIMAC";
    case 29: return "SAN BARTOLO";
    case 30: return "SAN BORJA";
    case 31: return "SAN ISIDRO";
    case 32: return "SAN JUAN DE LURIGANCHO";
    case 33: return "SAN JUAN DE MIRAFLORES";
    case 34: return "SAN LUIS";
    case 35: return "SAN MARTIN DE PORRES";
    case 36: return "SAN MIGUEL";
    case 37: return "SANTA ANITA";
    case 38: return "SANTA MARIA DEL MAR";
    case 39: return "SANTA ROSA";
    case 40: return "SANTIAGO DE SURCO";
    case 41: return "SURQUILLO";
    case 42: return "VILLA EL SALVADOR";
    case 43: return "VILLA MARIA DEL TRIUNFO";
    case 44: return "CALLAO";
    default: return "-";
  }
}

export function formatPublicHour(value?: string | null) {
  if (!value) return 'No especificado';
  const parts = String(value).split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes} ${period}`;
}

export function formatPublicDate(value?: string | Date | null) {
  if (!value) return 'No especificado';
  return formatearFechaConDia(value);
}

export function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  return `S/ ${amount.toFixed(2)}`;
}

export function getCustomerFullName(
  data?: Record<string, unknown> | null,
  fallback?: Record<string, unknown> | null,
) {
  const sources = [data, fallback].filter(Boolean) as Record<string, unknown>[];

  for (const source of sources) {
    const fullName = [
      source.customerName || source.CustomerName,
      source.customerLastName || source.CustomerLastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (fullName) return fullName;
  }

  return '';
}

export function getChefDisplay(data: Record<string, unknown>) {
  const chefId = Number(data.chefId ?? data.ChefId ?? 0);
  const chefName = String(data.chefName || data.ChefName || '').trim();
  const chefLastName = String(data.chefLastName || data.ChefLastName || '').trim();

  if (chefId > 0 && chefName) {
    const initials = `${chefName.charAt(0).toUpperCase()}${chefLastName ? chefLastName.charAt(0).toUpperCase() : ''}`;
    return {
      name: chefName,
      lastName: chefLastName,
      initials: initials || 'C',
      assigned: true,
    };
  }

  return {
    name: 'Cocinera',
    lastName: 'no asignada',
    initials: 'C',
    assigned: false,
  };
}

export function getClientComment(record?: Record<string, unknown> | null) {
  if (!record) return '';

  const value = record.commentClient
    ?? record.commentsClient
    ?? record.CommentClient
    ?? record.CommentsClient;

  return typeof value === 'string' ? value.trim() : '';
}

type SubscriptionRecord = Record<string, unknown> | null | undefined;

export function getSubscriptionVisitsPerMonth(
  reservation?: SubscriptionRecord,
  suscriptionInfo?: SubscriptionRecord
): number {
  const visits = Number(
    reservation?.visitsPerMonth
    ?? reservation?.VisitsPerMonth
    ?? suscriptionInfo?.visitsPerMonth
    ?? suscriptionInfo?.VisitsPerMonth
    ?? 0
  );

  return visits > 0 ? visits : 1;
}

/** Porciones tal como vienen del API (sin dividir entre visitas). */
export function getPerVisitPortions(
  reservation?: SubscriptionRecord,
  suscriptionInfo?: SubscriptionRecord
): number {
  return Number(
    reservation?.totalPortion
    ?? reservation?.TotalPortion
    ?? reservation?.suscriptionTotalPortion
    ?? reservation?.SuscriptionTotalPortion
    ?? suscriptionInfo?.totalPortion
    ?? suscriptionInfo?.TotalPortion
    ?? 0
  );
}

export function getSubscriptionMonthlyChefTotal(
  reservation?: SubscriptionRecord,
  suscriptionInfo?: SubscriptionRecord
): number {
  return Number(
    suscriptionInfo?.commissiontoChef
    ?? suscriptionInfo?.CommissiontoChef
    ?? reservation?.commissiontoChef
    ?? reservation?.CommissiontoChef
    ?? 0
  );
}

export interface SubscriptionPaymentConcept {
  concept: number;
  amount: number;
}

/** Parsea jsonPaymentChef tal cual (ya viene por sesión; no dividir). */
export function parseSubscriptionPaymentConcepts(
  jsonPaymentChef?: string | null
): SubscriptionPaymentConcept[] {
  if (!jsonPaymentChef) return [];

  try {
    const concepts = JSON.parse(jsonPaymentChef);
    if (!Array.isArray(concepts)) return [];

    return concepts.map((item) => ({
      concept: Number(item.Concepto ?? item.concepto ?? 0),
      amount: parseFloat(String(item.Monto ?? item.monto ?? 0)),
    }));
  } catch {
    return [];
  }
}

/**
 * Desglose de pago a la cocinera, listo para <BloqueMonto>.
 *
 * El TOTAL es la suma de los conceptos de jsonPaymentChef, no el campo de
 * comisión. Así lo documenta el propio API (ChefPaymentBreakdownHelper): "la suma
 * de los Monto es lo que el admin guarda en CommissiontoChef, es la fuente
 * correcta". El campo suelto queda solo como respaldo cuando no hay conceptos.
 *
 * Por qué hace falta: la clave cambia según el DTO. Los de la ficha pública
 * (AppReservation*ResponseDto) usan `CommissionToChef` con T mayúscula; los del
 * admin (Reservation*ResponseDto) arrastran el typo `CommissiontoChef` con t
 * minúscula. Leer una sola grafia dejaba el total en S/ 0.00 en todos los tipos
 * menos suscripción, que se salvaba justamente porque su DTO no trae el campo y
 * no le quedaba más remedio que sumar los conceptos.
 *
 * NUNCA cae a totalPrice: ese es el precio que paga el cliente.
 */
export function getChefPaymentBreakdown(record?: Record<string, any> | null) {
  const data = record ?? {};

  const conceptos = parseSubscriptionPaymentConcepts(
    data.jsonPaymentChef ?? data.JsonPaymentChef
  ).filter((c) => Number.isFinite(c.amount) && c.amount > 0);

  const comisionCampo = Number(
    data.commissiontoChef
    ?? data.CommissiontoChef
    ?? data.commissionToChef
    ?? data.CommissionToChef
    ?? 0
  );

  const total = conceptos.length > 0
    ? conceptos.reduce((sum, c) => sum + c.amount, 0)
    : (Number.isFinite(comisionCampo) ? comisionCampo : 0);

  const filas = conceptos.length > 0
    ? conceptos.map((c) => ({ label: getConceptName(c.concept), valor: formatCurrency(c.amount) }))
    : [{ label: 'Servicio', valor: formatCurrency(total) }];

  return { conceptos: filas, total, totalTexto: formatCurrency(total) };
}

/** Comisión/pago de la sesión tal como viene del API (sin dividir entre visitas). */
export function getSubscriptionChefCommission(
  reservation?: SubscriptionRecord,
  suscriptionInfo?: SubscriptionRecord
): number {
  const paymentJson = String(
    reservation?.jsonPaymentChef
    ?? reservation?.JsonPaymentChef
    ?? suscriptionInfo?.jsonPaymentChef
    ?? suscriptionInfo?.JsonPaymentChef
    ?? ''
  );

  const concepts = parseSubscriptionPaymentConcepts(paymentJson);
  if (concepts.length > 0) {
    return concepts.reduce((sum, concept) => sum + concept.amount, 0);
  }

  const monthlyChefTotal = getSubscriptionMonthlyChefTotal(reservation, suscriptionInfo);
  if (monthlyChefTotal > 0) return monthlyChefTotal;

  return Number(
    reservation?.totalPrice
    ?? reservation?.TotalPrice
    ?? suscriptionInfo?.totalPrice
    ?? suscriptionInfo?.TotalPrice
    ?? 0
  );
}
