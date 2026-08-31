import {
  formatCurrency,
  formatPublicDate,
  formatPublicHour,
  getCustomerFullName,
  getDistrictName,
  getClientComment,
  getSubscriptionVisitsPerMonth,
  getPerVisitPortions,
  parseSubscriptionPaymentConcepts,
} from './formatters';

export const REQUEST_TYPE_LABELS = {
  reserva: 'Reserva de cocina',
  suscripcion: 'Suscripción mensual',
  evento: 'Evento especial',
  dieta: 'Plan nutricional',
  tarea: 'Mise en place',
};

export const getRequestServiceTitle = (tipo) => REQUEST_TYPE_LABELS[tipo] || 'Solicitud de servicio';

// Devuelve SOLO la comisión de la cocinera. Antes caía a totalPrice, que es lo
// que paga el CLIENTE: mostrárselo a ella es una fuga de costos. Ojo que esta
// función es la primera línea de getRequestServiceAmount, así que mientras el
// respaldo vivió aquí, quitarlo allá abajo no tenía ningún efecto.
// Las claves difieren por typos históricos del modelo: `commissiontoChef` (t
// minúscula) en reserva, suscripción y evento; `commissionToChef` en tarea.
// monthlyPrice/MonthlyPrice no existen en ningún DTO del API — eran código
// muerto, y de existir serían también un monto del cliente.
export const getRequestPriceText = (item) => {
  const raw = item.commissiontoChef ?? item.commissionToChef;
  if (raw === null || raw === undefined || raw === '') return null;
  const value = Number(raw);
  if (Number.isNaN(value) || value <= 0) return null;
  return formatCurrency(value);
};

export const getRequestCardSubtitle = (item) => {
  const parts = [];
  if (item.dateReservation) {
    parts.push(formatPublicDate(item.dateReservation));
  }
  if (item.hourReservation) {
    parts.push(formatPublicHour(item.hourReservation));
  }
  const type = (item.tipo || 'reserva').toUpperCase();
  parts.push(type);
  if (item.puchaseIngredients) parts.push('Con compras');
  return parts.filter(Boolean).join(' · ') || 'Por confirmar';
};

export const getRequestCustomerName = (item, fallback = null) => (
  getCustomerFullName(item, fallback) || 'Cliente'
);

export const parseAllergies = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const text = String(value).trim();
  if (!text || text === '-') return [];
  return text
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
};

export const buildScheduleRows = (rows) => rows.filter((row) => row?.label);

export const getDistrictLabel = (data) => {
  const raw = data?.district ?? data?.District ?? data?.suscriptionDistrict ?? '';
  if (raw === null || raw === undefined || raw === '') return '';
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber) && asNumber > 0) return getDistrictName(asNumber);
  return String(raw).trim();
};

export const getReferenceLabel = (data) => {
  const ref = data?.reference ?? data?.Reference ?? data?.ubication ?? '';
  return typeof ref === 'string' ? ref.trim() : String(ref ?? '').trim();
};

export const mapRecipesToDishes = (recipes, onViewRecipe) => (recipes || []).map((recipe) => ({
  title: [recipe.MenuNombre, recipe.MasterRecipeNombre].filter(Boolean).join(' - ') || 'Plato solicitado',
  portionsText: recipe.iCantidadPlatos ? `${recipe.iCantidadPlatos} porciones` : '',
  // Sin MasterRecipeId el modal de receta abre vacio, asi que no se ofrece.
  onRecipe: onViewRecipe && recipe.MasterRecipeId ? () => onViewRecipe(recipe) : undefined,
}));

export const mapDietMenusToDishes = (menus, record) => (menus || []).map((item, index) => {
  const name = item.menuName || item.MenuName || item.menuNombre || item.MenuNombre
    || `Plato ${item.menuId || item.MenuId || index + 1}`;
  const portions = item.portions ?? item.Portions ?? record?.diner ?? record?.Diner ?? 1;
  return {
    title: name,
    portionsText: `${portions} porciones`,
  };
});

export const mapActivitiesToDishes = (activities) => (activities || []).map((item, index) => {
  const description = item.activityDescription || item.ActivityDescription
    || item.description || item.Description || `Actividad ${index + 1}`;
  const minutes = Number(item.estimatedMinutes ?? item.EstimatedMinutes ?? 0);
  return {
    title: description,
    portionsText: minutes > 0 ? `${minutes} min estimados` : 'Tiempo por confirmar',
  };
});

export const buildReservationScheduleRows = (reservation) => buildScheduleRows([
  { icon: 'calendar', label: formatPublicDate(reservation.dateReservation) },
  { icon: 'clock', label: formatPublicHour(reservation.hourReservation) },
  { icon: 'list', label: reservation.puchaseIngredients ? 'Con compras' : 'Sin compras' },
  reservation.diner != null ? {
    icon: 'chef',
    label: `${reservation.diner} personas, ${reservation.portionperDay ?? reservation.portionPerDay ?? '-'} comidas`,
  } : null,
  reservation.totalPortion ? { icon: 'chef', label: `${reservation.totalPortion} porciones totales` } : null,
]);

export const buildSubscriptionScheduleRows = (reservation, suscriptionInfo) => {
  const visitsPerMonth = getSubscriptionVisitsPerMonth(reservation, suscriptionInfo);
  const portionsPerVisit = getPerVisitPortions(reservation, suscriptionInfo);
  return buildScheduleRows([
    { icon: 'calendar', label: formatPublicDate(reservation.dateReservation) },
    { icon: 'clock', label: formatPublicHour(reservation.hourReservation) },
    { icon: 'list', label: reservation.puchaseIngredients ? 'Con compras' : 'Sin compras' },
    reservation.diner != null ? { icon: 'chef', label: `${reservation.diner} personas` } : null,
    portionsPerVisit ? { icon: 'chef', label: `${portionsPerVisit} porciones` } : null,
    reservation.suscriptionCount && visitsPerMonth
      ? { icon: 'list', label: `Visita ${reservation.suscriptionCount} de ${visitsPerMonth}` }
      : null,
  ]);
};

export const buildEventScheduleRows = (event) => buildScheduleRows([
  { icon: 'calendar', label: formatPublicDate(event.dateEvent ?? event.dateReservation) },
  { icon: 'clock', label: formatPublicHour(event.hourEvent ?? event.hourReservation) },
  event.attendeesCount ? { icon: 'chef', label: `${event.attendeesCount} asistentes` } : null,
  event.attendeesType != null
    ? { icon: 'list', label: `Tipo: ${Number(event.attendeesType) === 1 ? 'Formal' : 'Casual'}` }
    : null,
]);

export const getDietModalityShortLabel = (value) => (
  Number(value) === 2 ? 'Plan Nutricional' : 'Comida dietética'
);

export const getDietServicePreferenceLabel = (value) => (
  Number(value) === 1 ? 'Cocinera a domicilio' : 'Comida ya preparada'
);

export const buildDietScheduleRows = (record, getDateValue, getHourValue) => {
  const people = record.diner ?? record.Diner ?? record.personCount ?? record.PersonCount;
  return buildScheduleRows([
    { icon: 'calendar', label: formatPublicDate(getDateValue(record)) },
    { icon: 'clock', label: formatPublicHour(getHourValue(record)) },
    { icon: 'list', label: record.puchaseIngredients ? 'Con compras' : 'Sin compras' },
    people != null ? { icon: 'chef', label: `${people} ${Number(people) === 1 ? 'persona' : 'personas'}` } : null,
    {
      icon: 'list',
      label: `Modalidad: ${getDietModalityShortLabel(record.dietModality ?? record.DietModality)}`,
    },
    {
      icon: 'chef',
      label: `Servicio: ${getDietServicePreferenceLabel(record.servicePreference ?? record.ServicePreference)}`,
    },
  ]);
};

export const buildTareaScheduleRows = (record, getDateValue, getHourValue, hours) => buildScheduleRows([
  { icon: 'calendar', label: formatPublicDate(getDateValue(record)) },
  { icon: 'clock', label: formatPublicHour(getHourValue(record)) },
  { icon: 'list', label: record.puchaseIngredients ? 'Con compras' : 'Sin compras' },
  hours > 0 ? { icon: 'chef', label: `${hours} h estimadas` } : null,
]);

export const getRequestServiceAmount = (data, suscriptionInfo = null) => {
  // getRequestPriceText ya resuelve la comisión de los dos typos de clave y
  // devuelve null si no hay. NO se cae a totalPrice: ese es el precio que paga
  // el CLIENTE, y mostrárselo a la cocinera como monto de su servicio es una
  // fuga de costos. Si no hay comisión informada se devuelve vacío: mejor no
  // mostrar nada que un número que la haría aceptar por una expectativa falsa.
  const price = getRequestPriceText({ ...data, tipo: data.tipo });
  if (price) return price;

  if (suscriptionInfo || data.tipo === 'suscripcion') {
    const perVisit = getSubscriptionChefAmount(data, suscriptionInfo);
    if (perVisit > 0) return formatCurrency(perVisit);
  }

  return '';
};

// Monto de la cocinera por visita de suscripción, sin respaldo a totalPrice.
// No se usa getSubscriptionChefCommission de formatters porque esa sí termina
// cayendo al total del cliente; aquí preferimos no mostrar nada.
// El DTO del listado (ReservationSuscriptionResponseDto) ya trae JsonPaymentChef,
// así que no hace falta tocar el API.
const getSubscriptionChefAmount = (data, suscriptionInfo = null) => {
  const paymentJson = String(
    data?.jsonPaymentChef
    ?? data?.JsonPaymentChef
    ?? suscriptionInfo?.jsonPaymentChef
    ?? suscriptionInfo?.JsonPaymentChef
    ?? ''
  );

  const concepts = parseSubscriptionPaymentConcepts(paymentJson);
  if (concepts.length > 0) {
    return concepts.reduce((sum, concept) => sum + concept.amount, 0);
  }

  return Number(
    suscriptionInfo?.commissiontoChef
    ?? suscriptionInfo?.CommissiontoChef
    ?? data?.commissiontoChef
    ?? data?.CommissiontoChef
    ?? 0
  );
};

export const getRequestAllergies = (data) => parseAllergies(
  data.allergies ?? data.Allergies ?? data.allergyRestrictions ?? data.AllergyRestrictions,
);

export const getRequestClientComment = (data) => getClientComment(data);
