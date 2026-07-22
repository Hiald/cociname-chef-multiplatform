import {
  formatCurrency,
  formatPublicDate,
  formatPublicHour,
  getCustomerFullName,
  getDistrictName,
  getClientComment,
  getSubscriptionVisitsPerMonth,
  getPerVisitPortions,
  getSubscriptionChefCommission,
} from './formatters';

export const REQUEST_TYPE_LABELS = {
  reserva: 'Reserva de cocina',
  suscripcion: 'Suscripción mensual',
  evento: 'Evento especial',
  dieta: 'Plan nutricional',
  tarea: 'Actividad de cocina',
};

export const getRequestServiceTitle = (tipo) => REQUEST_TYPE_LABELS[tipo] || 'Solicitud de servicio';

export const getRequestPriceText = (item) => {
  const raw = item.commissiontoChef
    ?? item.commissionToChef
    ?? item.totalPrice
    ?? item.TotalPrice
    ?? item.monthlyPrice
    ?? item.MonthlyPrice;
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

export const getRequestCustomerName = (item) => getCustomerFullName(item) || 'Cliente';

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
  onRecipe: onViewRecipe ? () => onViewRecipe(recipe) : undefined,
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

export const buildDietScheduleRows = (record, getDateValue, getHourValue) => buildScheduleRows([
  { icon: 'calendar', label: formatPublicDate(getDateValue(record)) },
  { icon: 'clock', label: formatPublicHour(getHourValue(record)) },
  { icon: 'list', label: record.puchaseIngredients ? 'Con compras' : 'Sin compras' },
  record.diner != null || record.Diner != null || record.personCount != null
    ? {
      icon: 'chef',
      label: `${record.diner ?? record.Diner ?? record.personCount ?? record.PersonCount} personas`,
    }
    : null,
]);

export const buildTareaScheduleRows = (record, getDateValue, getHourValue, hours) => buildScheduleRows([
  { icon: 'calendar', label: formatPublicDate(getDateValue(record)) },
  { icon: 'clock', label: formatPublicHour(getHourValue(record)) },
  { icon: 'list', label: record.puchaseIngredients ? 'Con compras' : 'Sin compras' },
  hours > 0 ? { icon: 'chef', label: `${hours} h estimadas` } : null,
]);

export const getRequestServiceAmount = (data, suscriptionInfo = null) => {
  const price = getRequestPriceText({ ...data, tipo: data.tipo });
  if (price) return price;

  const commission = data.commissiontoChef ?? data.commissionToChef;
  if (commission != null && Number(commission) > 0) return formatCurrency(Number(commission));

  const total = data.totalPrice ?? data.TotalPrice;
  if (total != null && Number(total) > 0) return formatCurrency(Number(total));

  if (suscriptionInfo || data.tipo === 'suscripcion') {
    const perVisit = getSubscriptionChefCommission(data, suscriptionInfo);
    if (perVisit > 0) return formatCurrency(perVisit);
  }

  return '';
};

export const getRequestAllergies = (data) => parseAllergies(
  data.allergies ?? data.Allergies ?? data.allergyRestrictions ?? data.AllergyRestrictions,
);

export const getRequestClientComment = (data) => getClientComment(data);
