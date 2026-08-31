import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { appScreenTheme as theme, mockup, getReservationEmoji, getReservationTileBg } from '../styles';
import {
  getRequestServiceTitle,
  getRequestServiceAmount,
  getRequestCardSubtitle,
  getRequestCustomerName,
} from '../utils/requestDetail';
import { apiService } from '../services/api.service';
import { StatusReservation } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useSignalR } from '../hooks/useSignalR';
import {
  getPeruDateTimeFilters,
  isReservationPastInPeru,
  isReservationUpcomingInPeru,
  normalizeDateKey,
} from '../utils/peruDate';
import { ReservationsCalendar } from '../components/reservations-calendar/ReservationsCalendar';

const confirmedStatuses = new Set([
  StatusReservation.Aceptada,
  StatusReservation.Creada,
  StatusReservation.Actualizada,
  StatusReservation.EnCompra,
  StatusReservation.EnTrayecto,
  StatusReservation.EnCocina,
]);

const pastEligibleStatuses = new Set([
  ...confirmedStatuses,
  StatusReservation.Completada,
]);

const loaderStyle = document.createElement('style');
loaderStyle.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

if (!document.getElementById('reservation-loader-style')) {
  loaderStyle.id = 'reservation-loader-style';
  document.head.appendChild(loaderStyle);
}

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const parseLocalDateTime = (dateString, timeString = '00:00') => {
  const dateKey = normalizeDateKey(dateString);
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = String(timeString || '00:00').split(':').map(Number);
  const dt = new Date(
    year,
    month - 1,
    day,
    Number.isNaN(hours) ? 0 : hours,
    Number.isNaN(minutes) ? 0 : minutes,
    0,
    0,
  );
  return isValidDate(dt) ? dt : null;
};

const formatCustomerName = (firstName, lastName, isRequest) => {
  if (!firstName) return 'Cliente';
  if (!isRequest) return `${firstName} ${lastName || ''}`.trim();
  return `${firstName} ${lastName ? `${lastName.charAt(0)}.` : ''}`.trim();
};

const getTypeLabel = (reservation) => {
  if (reservation.tipo === 'suscripcion') return 'SUSCRIPCION';
  if (reservation.tipo === 'evento') return 'EVENTO';
  if (reservation.tipo === 'dieta') return 'DIETA';
  if (reservation.tipo === 'tarea') return 'MISE EN PLACE';
  return 'RESERVA';
};

const getTypeBadgeStyle = (tipo) => {
  if (tipo === 'suscripcion') return styles.typeBadgeSuscription;
  if (tipo === 'evento') return styles.typeBadgeEvento;
  if (tipo === 'dieta') return styles.typeBadgeDieta;
  if (tipo === 'tarea') return styles.typeBadgeTarea;
  return styles.typeBadgeReservation;
};

const pendingRequestStatuses = new Set([
  StatusReservation.Creada,
  StatusReservation.Reprogramada,
  StatusReservation.ReasignacionCocinera,
]);

/** StatusDiet: 0 Draft, 1 En revisión, 2 Confirmada, 3 Activa, 4 Completada, 5 Cancelada */
const DIET_STATUS = {
  Draft: 0,
  EnRevision: 1,
  Confirmada: 2,
  Activa: 3,
  Completada: 4,
  Cancelada: 5,
};

const asList = (response) => {
  if (!response?.success) return [];
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const getChefIdValue = (item) => item?.chefId ?? item?.ChefId ?? null;

const isUnassignedChef = (item) => {
  const value = getChefIdValue(item);
  return value === null || value === undefined || value === '' || Number(value) === 0;
};

const isPendingRequest = (item, statusValue) => (
  isUnassignedChef(item) && pendingRequestStatuses.has(Number(statusValue))
);

const getDietStatusValue = (item) => Number(
  item?.statusDiet
  ?? item?.StatusDiet
  ?? item?.statusReservationDiet
  ?? item?.statusReservation
  ?? -1
);

const getDietDateValue = (item) => (
  item?.startDate
  || item?.StartDate
  || item?.dateReservationDiet
  || item?.dateReservation
  || null
);

const getDietHourValue = (item) => (
  item?.deliveryHour
  || item?.DeliveryHour
  || item?.hourReservationDiet
  || item?.hourReservation
  || null
);

const formatDayGroupLabel = (dateString) => {
  if (!dateString || dateString === 'sin-fecha') return 'FECHA POR CONFIRMAR';
  const dt = parseLocalDateTime(dateString, '12:00');
  if (!dt) return 'FECHA POR CONFIRMAR';
  const label = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(dt);
  return label.toUpperCase();
};

const formatCardTime = (dateReservation, hourReservation) => {
  const dt = parseLocalDateTime(dateReservation, hourReservation);
  if (!dt) return 'Por confirmar';
  return new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true }).format(dt);
};

const getReservationDateKey = (reservation) => {
  if (!reservation?.dateReservation) return 'sin-fecha';
  const dt = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation || '12:00');
  return dt ? reservation.dateReservation : 'sin-fecha';
};

const getReservationSubline = (reservation, isRequest) => {
  const type = getTypeLabel(reservation);
  const purchases = reservation.puchaseIngredients ? 'Con compras' : 'Sin compras';
  if (isRequest) return `${type} · ${purchases}`;
  return `${purchases} · ${reservation.direction || 'Sin dirección'}`;
};

const compareByDateTime = (a, b, direction = 1) => {
  const dtA = parseLocalDateTime(a.dateReservation, a.hourReservation);
  const dtB = parseLocalDateTime(b.dateReservation, b.hourReservation);
  if (!dtA && !dtB) return 0;
  if (!dtA) return 1;
  if (!dtB) return -1;
  return (dtA.getTime() - dtB.getTime()) * direction;
};

const groupReservationsByDay = (reservations) => {
  const map = new Map();
  reservations.forEach((reservation) => {
    const key = getReservationDateKey(reservation);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(reservation);
  });

  return Array.from(map.entries())
    .sort(([dateA], [dateB]) => {
      if (dateA === 'sin-fecha') return 1;
      if (dateB === 'sin-fecha') return -1;
      const dtA = parseLocalDateTime(dateA, '12:00');
      const dtB = parseLocalDateTime(dateB, '12:00');
      if (!dtA || !dtB) return 0;
      return dtA.getTime() - dtB.getTime();
    })
    .map(([date, items]) => ({
      date,
      dayUpper: formatDayGroupLabel(date),
      items: items.sort((a, b) => {
        const dtA = parseLocalDateTime(a.dateReservation, a.hourReservation);
        const dtB = parseLocalDateTime(b.dateReservation, b.hourReservation);
        if (!dtA || !dtB) return 0;
        return dtA.getTime() - dtB.getTime();
      }),
    }));
};

const ReservationScreen = () => {
  const [activeTab, setActiveTab] = useState('confirmed');
  const [confirmedReservations, setConfirmedReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [requestReservations, setRequestReservations] = useState([]);
  const [viewMode, setViewMode] = useState('lista');
  const [listFilter, setListFilter] = useState('proximas');
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { chefData } = useAuth();
  const chefId = chefData?.chefId;
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    // Se reutiliza el searchParams memoizado en vez de instanciar dos veces.
    const tabFromQuery = searchParams.get('tab');
    const showHistoryFromQuery = searchParams.get('history') === 'true';

    if (tabFromQuery === 'requests' || location.state?.defaultTab === 'requests') {
      setActiveTab('requests');
      setListFilter('proximas');
      return;
    }

    setActiveTab('confirmed');
    if (showHistoryFromQuery || location.state?.showPast === true) {
      setListFilter('pasadas');
    }
  }, [searchParams, location.state]);

  const loadReservations = useCallback(async () => {
    if (!chefId) return;

    try {
      setLoading(true);
      let confirmedForDisplay = [];

      const now = new Date();
      const { dateFilter, timeFilter } = getPeruDateTimeFilters(now);
      const pendingFilters = { dateFilter, timeFilter, Page: 1, RecordsPerPage: 50 };

      const [
        confirmedResponse,
        chefSuscriptionResponse,
        chefSuscriptionParentsResponse,
        requestsResponse,
        suscriptionResponse,
        eventsResponse,
        dietResponse,
        serviceTaskResponse,
        chefEventsResponse,
        chefDietsResponse,
        chefServiceTasksResponse,
      ] = await Promise.all([
        apiService.listReservationByChefId(chefId),
        apiService.listReservationSuscriptionByChefId(chefId),
        apiService.getSuscriptionsByChefId(chefId),
        apiService.getPendingReservations(pendingFilters),
        apiService.getPendingReservationSuscription(pendingFilters),
        apiService.getPendingEventReservation(pendingFilters),
        apiService.getPendingReservationDiet(pendingFilters),
        apiService.getPendingReservationServiceTask(pendingFilters),
        apiService.getReservationEventsByChefId(chefId, 1, 100),
        apiService.getDietsByChefId(chefId, 1, 100),
        apiService.getServiceTasksByChefId(chefId, 1, 100),
      ]);

      const customerBySuscriptionId = new Map();
      const parentRows = Array.isArray(chefSuscriptionParentsResponse.data)
        ? chefSuscriptionParentsResponse.data
        : (Array.isArray(chefSuscriptionParentsResponse.data?.data)
          ? chefSuscriptionParentsResponse.data.data
          : []);
      parentRows.forEach((parent) => {
        const parentId = Number(parent.id ?? parent.Id);
        if (!parentId) return;
        customerBySuscriptionId.set(parentId, {
          customerName: parent.customerName || parent.CustomerName || '',
          customerLastName: parent.customerLastName || parent.CustomerLastName || '',
        });
      });

      // ListReservationSuscription no trae nombre: completar con ListSuscriptionById
      const suscriptionIdsNeedingCustomer = [
        ...new Set(
          (chefSuscriptionResponse.success && Array.isArray(chefSuscriptionResponse.data)
            ? chefSuscriptionResponse.data
            : []
          )
            .map((item) => Number(item.suscriptionId ?? item.SuscriptionId))
            .filter((id) => id && !customerBySuscriptionId.get(id)?.customerName),
        ),
      ];

      if (suscriptionIdsNeedingCustomer.length > 0) {
        const parentDetails = await Promise.all(
          suscriptionIdsNeedingCustomer.map((id) => apiService.getSuscriptionById(id)),
        );
        parentDetails.forEach((response, index) => {
          const raw = response?.data;
          const parent = Array.isArray(raw) ? raw[0] : raw;
          if (!response?.success || !parent) return;
          customerBySuscriptionId.set(suscriptionIdsNeedingCustomer[index], {
            customerName: parent.customerName || parent.CustomerName || '',
            customerLastName: parent.customerLastName || parent.CustomerLastName || '',
          });
        });
      }

      const withSuscriptionCustomer = (item) => {
        const suscriptionId = Number(item.suscriptionId ?? item.SuscriptionId);
        const fromParent = customerBySuscriptionId.get(suscriptionId);
        return {
          ...item,
          customerName: item.customerName || item.CustomerName || fromParent?.customerName || '',
          customerLastName: item.customerLastName || item.CustomerLastName || fromParent?.customerLastName || '',
        };
      };

      const isUpcomingItem = (item) => isReservationUpcomingInPeru(item.dateReservation, item.hourReservation, now);
      const isPastItem = (item) => isReservationPastInPeru(item.dateReservation, item.hourReservation, now);

      let pastForDisplay = [];

      if (confirmedResponse.success && confirmedResponse.data) {
        const allEligible = confirmedResponse.data
          .filter((reservation) => pastEligibleStatuses.has(reservation.statusReservation))
          .map((reservation) => ({ ...reservation, tipo: 'reserva' }));

        confirmedForDisplay = allEligible
          .filter((reservation) => confirmedStatuses.has(reservation.statusReservation) && isUpcomingItem(reservation))
          .sort((a, b) => compareByDateTime(a, b));

        pastForDisplay = allEligible
          .filter((reservation) => {
            if (reservation.statusReservation === StatusReservation.Completada) return true;
            return confirmedStatuses.has(reservation.statusReservation) && isPastItem(reservation);
          })
          .sort((a, b) => compareByDateTime(a, b, -1));
      } else {
        confirmedForDisplay = [];
        pastForDisplay = [];
      }

      // Suscripciones asignadas a la chef (antes no se cargaban → “desaparecían” al aceptar)
      const chefSuscriptionsMapped = chefSuscriptionResponse.success && chefSuscriptionResponse.data
        ? chefSuscriptionResponse.data
            .filter((item) => {
              const status = item.suscriptionStatus ?? item.statusReservation;
              return pastEligibleStatuses.has(status);
            })
            .map((item) => withSuscriptionCustomer({
              ...item,
              tipo: 'suscripcion',
              dateReservation: item.dateReservation,
              hourReservation: item.hourReservation,
              statusReservation: item.suscriptionStatus ?? item.statusReservation,
            }))
        : [];

      const upcomingSuscriptions = chefSuscriptionsMapped
        .filter((item) => {
          const status = item.suscriptionStatus ?? item.statusReservation;
          return confirmedStatuses.has(status) && isUpcomingItem(item);
        })
        .sort((a, b) => compareByDateTime(a, b));

      const pastSuscriptions = chefSuscriptionsMapped
        .filter((item) => {
          const status = item.suscriptionStatus ?? item.statusReservation;
          if (status === StatusReservation.Completada) return true;
          return confirmedStatuses.has(status) && isPastItem(item);
        })
        .sort((a, b) => compareByDateTime(a, b, -1));

      confirmedForDisplay = [...confirmedForDisplay, ...upcomingSuscriptions];
      pastForDisplay = [...pastForDisplay, ...pastSuscriptions];

      const normalRequests = requestsResponse.success && requestsResponse.data
        ? requestsResponse.data
            .filter((reservation) => isPendingRequest(
              reservation,
              reservation.statusReservation
            ))
            .map((reservation) => ({ ...reservation, tipo: 'reserva' }))
        : [];

      const suscriptionRequests = suscriptionResponse.success && suscriptionResponse.data
        ? suscriptionResponse.data
            .filter((reservation) => isPendingRequest(
              reservation,
              reservation.suscriptionStatus ?? reservation.statusReservation
            ))
            .map((reservation) => withSuscriptionCustomer({
              ...reservation,
              tipo: 'suscripcion',
              // Normalizar IDs: algunos payloads usan reservationSuscriptionId
              id: reservation.id ?? reservation.reservationSuscriptionId ?? reservation.Id,
              suscriptionId: reservation.suscriptionId ?? reservation.SuscriptionId,
            }))
        : [];

      const eventRequests = eventsResponse.success && eventsResponse.data
        ? eventsResponse.data
            .filter((event) => isPendingRequest(
              event,
              event.statusReservationEvent ?? event.statusEvent
            ))
            .map((event) => ({
              ...event,
              tipo: 'evento',
              dateReservation: event.dateReservationEvent ?? event.dateEvent ?? event.dateReservation,
              hourReservation: event.hourReservationEvent ?? event.hourEvent ?? event.hourReservation,
            }))
        : [];

      const dietRequests = asList(dietResponse)
        .filter((item) => {
          if (!isUnassignedChef(item)) return false;
          const status = getDietStatusValue(item);
          // App DTO puede traer StatusReservation o StatusDiet
          if (pendingRequestStatuses.has(status)) return true;
          return [
            DIET_STATUS.Draft,
            DIET_STATUS.EnRevision,
            DIET_STATUS.Confirmada,
          ].includes(status);
        })
        .map((item) => ({
          ...item,
          tipo: 'dieta',
          customerName: item.customerName || item.CustomerName || '',
          customerLastName: item.customerLastName || item.CustomerLastName || '',
          dateReservation: getDietDateValue(item),
          hourReservation: getDietHourValue(item),
        }));

      const serviceTaskRequests = asList(serviceTaskResponse)
        .filter((item) => isPendingRequest(
          item,
          item.statusReservationServiceTask ?? item.statusServiceTask ?? item.statusReservation
        ))
        .map((item) => ({
          ...item,
          tipo: 'tarea',
          dateReservation: item.dateReservationServiceTask ?? item.dateService ?? item.dateReservation,
          hourReservation: item.hourReservationServiceTask ?? item.hourService ?? item.hourReservation,
        }));

      const chefEventsMapped = chefEventsResponse.success && chefEventsResponse.data
        ? chefEventsResponse.data
            .filter((event) => {
              if (event.chefId === null) return false;
              const status = event.statusEvent ?? event.statusReservation;
              return pastEligibleStatuses.has(status);
            })
            .map((event) => ({
              ...event,
              tipo: 'evento',
              dateReservation: event.dateEvent || event.dateReservationEvent || event.dateReservation,
              hourReservation: event.hourEvent || event.hourReservationEvent || event.hourReservation,
            }))
        : [];

      const upcomingEvents = chefEventsMapped
        .filter((event) => {
          const status = event.statusEvent ?? event.statusReservation;
          return confirmedStatuses.has(status) && isUpcomingItem(event);
        })
        .sort((a, b) => compareByDateTime(a, b));

      const pastEvents = chefEventsMapped
        .filter((event) => {
          const status = event.statusEvent ?? event.statusReservation;
          if (status === StatusReservation.Completada) return true;
          return confirmedStatuses.has(status) && isPastItem(event);
        })
        .sort((a, b) => compareByDateTime(a, b, -1));

      // Dietas asignadas (StatusDiet, no StatusReservation). ByChef ya filtra por chef.
      const chefDietsMapped = asList(chefDietsResponse)
        .filter((item) => {
          const status = getDietStatusValue(item);
          return status !== DIET_STATUS.Cancelada && status !== StatusReservation.Cancelada;
        })
        .map((item) => ({
          ...item,
          tipo: 'dieta',
          customerName: item.customerName || item.CustomerName || '',
          customerLastName: item.customerLastName || item.CustomerLastName || '',
          dateReservation: getDietDateValue(item),
          hourReservation: getDietHourValue(item),
          statusDiet: getDietStatusValue(item),
        }));

      const upcomingDiets = chefDietsMapped
        .filter((item) => {
          const status = item.statusDiet;
          if (status === DIET_STATUS.Completada || status === StatusReservation.Completada) return false;
          // Activas / confirmadas / en curso (StatusDiet o StatusReservation tras asignación)
          const isActiveDiet = [
            DIET_STATUS.EnRevision,
            DIET_STATUS.Confirmada,
            DIET_STATUS.Activa,
            StatusReservation.Aceptada,
            StatusReservation.Actualizada,
            StatusReservation.EnCompra,
            StatusReservation.EnTrayecto,
            StatusReservation.EnCocina,
          ].includes(status);
          if (!isActiveDiet && status !== DIET_STATUS.Draft) return false;
          if (!item.dateReservation) return true;
          return isUpcomingItem(item);
        })
        .sort((a, b) => compareByDateTime(a, b));

      const pastDiets = chefDietsMapped
        .filter((item) => {
          const status = item.statusDiet;
          if (status === DIET_STATUS.Completada || status === StatusReservation.Completada) return true;
          if (!item.dateReservation) return false;
          return isPastItem(item);
        })
        .sort((a, b) => compareByDateTime(a, b, -1));

      // Tareas asignadas (Mise en place / aderezos). Usan StatusReservation.
      const chefServiceTasksMapped = asList(chefServiceTasksResponse)
        .filter((item) => {
          if (isUnassignedChef(item)) return false;
          return pastEligibleStatuses.has(item.statusReservation ?? item.StatusReservation);
        })
        .map((item) => ({
          ...item,
          tipo: 'tarea',
          customerName: item.customerName || item.CustomerName || '',
          customerLastName: item.customerLastName || item.CustomerLastName || '',
          dateReservation: item.dateService || item.dateReservationServiceTask || item.dateReservation,
          hourReservation: item.hourService || item.hourReservationServiceTask || item.hourReservation,
          statusReservation: item.statusReservation ?? item.StatusReservation,
        }));

      const upcomingServiceTasks = chefServiceTasksMapped
        .filter((item) => confirmedStatuses.has(item.statusReservation) && isUpcomingItem(item))
        .sort((a, b) => compareByDateTime(a, b));

      const pastServiceTasks = chefServiceTasksMapped
        .filter((item) => {
          if (item.statusReservation === StatusReservation.Completada) return true;
          return confirmedStatuses.has(item.statusReservation) && isPastItem(item);
        })
        .sort((a, b) => compareByDateTime(a, b, -1));

      const combinedConfirmed = [...confirmedForDisplay, ...upcomingEvents, ...upcomingDiets, ...upcomingServiceTasks]
        .sort((a, b) => compareByDateTime(a, b));
      const combinedPast = [...pastForDisplay, ...pastEvents, ...pastDiets, ...pastServiceTasks]
        .sort((a, b) => compareByDateTime(a, b, -1));

      const allRequests = [
        ...normalRequests,
        ...suscriptionRequests,
        ...eventRequests,
        ...dietRequests,
        ...serviceTaskRequests,
      ].sort((a, b) => compareByDateTime(a, b));

      setConfirmedReservations(combinedConfirmed);
      setPastReservations(combinedPast);
      setRequestReservations(allRequests);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setConfirmedReservations([]);
      setPastReservations([]);
      setRequestReservations([]);
    } finally {
      setLoading(false);
    }
  }, [chefId]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  useSignalR(() => {
    void loadReservations();
  }, { playSound: false });

  const listCountLabel = useMemo(() => {
    if (listFilter === 'pasadas') {
      const count = pastReservations.length;
      return `${count} ${count === 1 ? 'pasada' : 'pasadas'}`;
    }
    const count = confirmedReservations.length;
    return `${count} ${count === 1 ? 'próxima' : 'próximas'}`;
  }, [listFilter, confirmedReservations, pastReservations]);

  const calendarReservations = useMemo(() => {
    // Calendario: todas las reservas confirmadas/pasadas, solo con dateReservation
    const merged = [...confirmedReservations, ...pastReservations];
    const seen = new Set();
    return merged.filter((item) => {
      const key = normalizeDateKey(item.dateReservation);
      if (!key) return false;
      const idKey = `${item.tipo || 'reserva'}-${item.id}`;
      if (seen.has(idKey)) return false;
      seen.add(idKey);
      return true;
    });
  }, [confirmedReservations, pastReservations]);

  const listaReservations = useMemo(() => {
    if (activeTab !== 'confirmed') return [];
    return listFilter === 'pasadas' ? pastReservations : confirmedReservations;
  }, [activeTab, listFilter, confirmedReservations, pastReservations]);

  const groupedLista = useMemo(() => {
    if (activeTab !== 'confirmed') return [];
    return groupReservationsByDay(listaReservations);
  }, [activeTab, listaReservations]);

  const requestFilterTabs = useMemo(() => ([
    { id: 'all', label: 'Todas', count: requestReservations.length },
    { id: 'reserva', label: 'Reservas', count: requestReservations.filter((r) => r.tipo === 'reserva').length },
    { id: 'suscripcion', label: 'Suscripciones', count: requestReservations.filter((r) => r.tipo === 'suscripcion').length },
    { id: 'evento', label: 'Eventos', count: requestReservations.filter((r) => r.tipo === 'evento').length },
    { id: 'dieta', label: 'Dietas', count: requestReservations.filter((r) => r.tipo === 'dieta').length },
    { id: 'tarea', label: 'Aderezos', count: requestReservations.filter((r) => r.tipo === 'tarea').length },
  ]), [requestReservations]);

  const filteredRequests = useMemo(() => {
    if (requestTypeFilter === 'all') return requestReservations;
    return requestReservations.filter((item) => item.tipo === requestTypeFilter);
  }, [requestReservations, requestTypeFilter]);

  const handleViewReservation = (reservation, isRequest = false) => {
    const originTab = isRequest ? 'requests' : 'confirmed';
    const keepHistoryExpanded = !isRequest && listFilter === 'pasadas';

    if (reservation.tipo === 'evento') {
      navigate(`/reservation-event/${reservation.id}`, {
        state: {
          eventId: reservation.id,
          isActive: false,
          isRequest,
          source: 'reservation',
          originTab,
          showPast: keepHistoryExpanded,
          reservationData: reservation,
        },
      });
      return;
    }

    if (reservation.tipo === 'dieta') {
      navigate(`/reservation-diet/${reservation.id}`, {
        state: {
          reservationDietId: reservation.id,
          isActive: false,
          isRequest,
          source: 'reservation',
          originTab,
          showPast: keepHistoryExpanded,
          reservationData: reservation,
        },
      });
      return;
    }

    if (reservation.tipo === 'tarea') {
      navigate(`/reservation-tarea/${reservation.id}`, {
        state: {
          reservationServiceTaskId: reservation.id,
          isActive: false,
          isRequest,
          source: 'reservation',
          originTab,
          showPast: keepHistoryExpanded,
          reservationData: reservation,
        },
      });
      return;
    }

    if (reservation.tipo === 'suscripcion') {
      const reservationSuscriptionId = reservation.id
        ?? reservation.reservationSuscriptionId
        ?? reservation.Id;
      navigate(`/reservation-suscription/${reservationSuscriptionId}`, {
        state: {
          reservationSuscriptionId,
          suscriptionId: reservation.suscriptionId ?? reservation.SuscriptionId,
          isActive: false,
          isSuscription: true,
          isRequest,
          source: 'reservation',
          originTab,
          showPast: keepHistoryExpanded,
          reservationData: {
            ...reservation,
            id: reservationSuscriptionId,
            suscriptionId: reservation.suscriptionId ?? reservation.SuscriptionId,
            tipo: 'suscripcion',
          },
        },
      });
      return;
    }

    const status = reservation.statusReservation;
    const isActive = status === StatusReservation.EnCocina || status === StatusReservation.EnTrayecto;

    navigate(`/reservation/${reservation.id}`, {
      state: {
        reservationId: reservation.id,
        isActive,
        isRequest,
        source: 'reservation',
        originTab,
        showPast: keepHistoryExpanded,
        reservationData: reservation,
      },
    });
  };

  const renderListaCard = (reservation, isRequest = false) => (
    <button
      key={`${reservation.tipo || 'reserva'}-${reservation.id}`}
      type="button"
      style={styles.listaCard}
      onClick={() => handleViewReservation(reservation, isRequest)}
    >
      <div style={{ ...styles.listaTile, background: getReservationTileBg(reservation.tipo) }}>
        {getReservationEmoji(reservation.tipo)}
      </div>
      <div style={styles.listaBody}>
        <div style={styles.listaName}>{formatCustomerName(reservation.customerName, reservation.customerLastName, isRequest)}</div>
        <div style={styles.listaSub}>{getReservationSubline(reservation, isRequest)}</div>
      </div>
      <div style={styles.listaRight}>
        <div style={styles.listaTime}>{formatCardTime(reservation.dateReservation, reservation.hourReservation)}</div>
        <span style={{ ...styles.listaStatus, ...getTypeBadgeStyle(reservation.tipo) }}>
          {getTypeLabel(reservation)}
        </span>
      </div>
    </button>
  );

  const renderSolicitudCard = (reservation) => {
    // getRequestServiceAmount y no getRequestPriceText: para suscripcion el monto
    // de la cocinera sale de jsonPaymentChef, que getRequestPriceText no mira.
    // Antes esa tarjeta caia a totalPrice y mostraba el precio del CLIENTE.
    const price = getRequestServiceAmount(reservation);
    const ctaColor = reservation.tipo === 'evento' ? '#7A4FD0' : '#1763C9';

    return (
      <button
        key={`${reservation.tipo || 'reserva'}-${reservation.id}`}
        type="button"
        style={styles.solicitudCard}
        onClick={() => handleViewReservation(reservation, true)}
      >
        <div style={styles.solicitudTop}>
          <div style={{ ...styles.listaTile, background: getReservationTileBg(reservation.tipo) }}>
            {getReservationEmoji(reservation.tipo)}
          </div>
          <div style={styles.listaBody}>
            <div style={styles.solicitudTitleRow}>
              <span style={styles.listaName}>{getRequestServiceTitle(reservation.tipo)}</span>
              {reservation.tipo === 'evento' && <span style={styles.eventBadge}>🎉 EVENTO</span>}
              <span style={styles.pendingBadge}>Pendiente</span>
            </div>
            <div style={styles.listaSub}>{getRequestCustomerName(reservation)}</div>
            <div style={styles.listaSub}>{getRequestCardSubtitle(reservation)}</div>
          </div>
          {price && <div style={styles.solicitudPrice}>{price}</div>}
        </div>
        <div style={styles.solicitudFooter}>
          <span style={{ ...styles.solicitudCta, color: ctaColor }}>
            {reservation.tipo === 'evento' ? 'Revisar y cotizar' : 'Revisar y aceptar'}
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ctaColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (activeTab === 'requests') {
    return (
      <div className="coci-page-wrap coci-page-wrap--requests coci-solicitudes-layout">
        <div style={styles.requestsBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
          </svg>
          Por revisar · aún no son reservas
        </div>
        <h1 style={mockup.screenTitle}>Solicitudes</h1>
        <p style={{ ...mockup.screenSubtitle, marginBottom: 16 }}>
          {filteredRequests.length > 0
            ? `${filteredRequests.length} ${filteredRequests.length === 1 ? 'solicitud por revisar' : 'solicitudes por revisar'}`
            : 'No tienes solicitudes por revisar'}
        </p>

        <div className="coci-solicitudes-filters" style={styles.requestTabsRow}>
          {requestFilterTabs.map((tab) => {
            const isActive = requestTypeFilter === tab.id;
            const showCount = tab.count > 0;
            return (
              <button
                key={tab.id}
                type="button"
                style={isActive ? mockup.chipActive : mockup.chipInactive}
                onClick={() => setRequestTypeFilter(tab.id)}
              >
                {tab.label}
                {showCount ? (
                  <span style={isActive ? styles.requestTabCountActive : styles.requestTabCount}>
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {filteredRequests.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyEmoji}>📥</div>
            <p style={styles.emptyTitle}>No tienes solicitudes pendientes</p>
            <p style={styles.emptyText}>Las nuevas solicitudes aparecerán aquí.</p>
          </div>
        ) : (
          <div className="coci-solicitudes-list" style={styles.solicitudesList}>
            {filteredRequests.map((reservation) => renderSolicitudCard(reservation))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="coci-page-wrap">
      <div className="coci-reservas-header" style={styles.reservasHeader}>
        <div style={styles.reservasHeaderText}>
          <h1 style={styles.reservasTitle}>Mis reservas</h1>
          <p style={mockup.screenSubtitle}>{listCountLabel}</p>
        </div>
        <div className="coci-view-toggle-mobile" style={styles.viewToggle}>
          <button type="button" style={viewMode === 'lista' ? mockup.tabPillActive : mockup.tabPillInactive} onClick={() => setViewMode('lista')}>
            Lista
          </button>
          <button type="button" style={viewMode === 'calendario' ? mockup.tabPillActive : mockup.tabPillInactive} onClick={() => setViewMode('calendario')}>
            Calendario
          </button>
        </div>
      </div>

      <div className={`coci-reservas-split mode-${viewMode}`}>
        <div className="coci-reservas-list-col">
          <div style={styles.chipRow}>
            <button type="button" style={listFilter === 'proximas' ? mockup.chipActive : mockup.chipInactive} onClick={() => setListFilter('proximas')}>
              Próximas
            </button>
            <button type="button" style={listFilter === 'pasadas' ? mockup.chipActive : mockup.chipInactive} onClick={() => setListFilter('pasadas')}>
              Pasadas
            </button>
          </div>

          {listaReservations.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyEmoji}>🗓️</div>
              <p style={styles.emptyTitle}>
                {listFilter === 'pasadas' ? 'No tienes reservas pasadas' : 'No tienes reservas confirmadas'}
              </p>
              <p style={styles.emptyText}>
                {listFilter === 'pasadas'
                  ? 'Tu historial aparecerá aquí.'
                  : 'Tus reservas aparecerán aquí cuando se confirmen.'}
              </p>
            </div>
          ) : (
            <div style={styles.groupedList}>
              {groupedLista.map((group) => (
                <div key={group.date}>
                  <div style={mockup.dayGroupTitle}>{group.dayUpper}</div>
                  {group.items.map((reservation) => renderListaCard(reservation, false))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="coci-reservas-cal-col">
          <div className="calendar-card-sticky">
            <ReservationsCalendar
              reservations={calendarReservations}
              onSelectReservation={(reservation) => handleViewReservation(reservation, false)}
              renderDayReservations={(dayItems) => (
                <div style={styles.groupedList}>
                  {dayItems
                    .slice()
                    .sort((a, b) => compareByDateTime(a, b))
                    .map((reservation) => renderListaCard(reservation, false))}
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  loadingContainer: {
    minHeight: '60vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    border: `4px solid ${theme.spinnerBorder}`,
    borderTop: `4px solid ${theme.spinnerAccent}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  requestsBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    background: '#E1EBFA',
    color: theme.link,
    borderRadius: 999,
    padding: '5px 12px 5px 10px',
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 11.5,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  reservasHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'nowrap',
    marginBottom: 20,
  },
  reservasHeaderText: {
    flex: '1 1 auto',
    minWidth: 0,
  },
  reservasTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 24,
    letterSpacing: -0.5,
    color: theme.textPrimary,
    margin: 0,
    lineHeight: 1.15,
  },
  viewToggle: {
    display: 'flex',
    gap: 4,
    background: '#fff',
    borderRadius: 999,
    padding: 4,
    boxShadow: '0 3px 12px rgba(27, 52, 92, 0.07)',
    flexShrink: 0,
    alignSelf: 'flex-end',
  },
  chipRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
    overflowX: 'auto',
    paddingBottom: 2,
  },
  groupedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  listaCard: {
    width: '100%',
    textAlign: 'left',
    background: '#fff',
    boxShadow: theme.cardShadow,
    border: 'none',
    borderRadius: 20,
    padding: '16px 18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  listaTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  },
  listaBody: {
    flex: 1,
    minWidth: 0,
  },
  listaName: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 15.5,
    color: theme.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  listaSub: {
    fontSize: 13,
    color: theme.textCaption,
    marginTop: 3,
  },
  listaRight: {
    textAlign: 'right',
    flexShrink: 0,
  },
  listaTime: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 16,
    color: '#4F4F4F',
  },
  listaStatus: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    padding: '4px 11px',
    marginTop: 6,
  },
  solicitudesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  solicitudCard: {
    width: '100%',
    textAlign: 'left',
    background: '#fff',
    boxShadow: theme.cardShadow,
    border: 'none',
    borderRadius: 22,
    padding: 18,
    cursor: 'pointer',
  },
  solicitudTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 13,
  },
  solicitudPrice: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 17,
    color: theme.link,
    flexShrink: 0,
    marginTop: 2,
  },
  pendingBadge: {
    fontFamily: theme.fontHeading,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.3,
    color: theme.link,
    background: '#E1EBFA',
    borderRadius: 999,
    padding: '4px 11px',
  },
  requestTabsRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 18,
    overflowX: 'auto',
    paddingBottom: 2,
  },
  requestTabCount: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: 800,
    color: theme.link,
    background: '#E1EBFA',
    borderRadius: 999,
    padding: '2px 7px',
  },
  requestTabCountActive: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: 800,
    color: '#fff',
    background: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    padding: '2px 7px',
  },
  solicitudTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  eventBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: theme.fontHeading,
    fontSize: 11.5,
    fontWeight: 800,
    letterSpacing: 0.3,
    color: '#fff',
    background: '#7A4FD0',
    borderRadius: 999,
    padding: '4px 11px',
    boxShadow: '0 4px 10px rgba(122, 79, 208, 0.3)',
  },
  solicitudFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTop: `1px solid ${theme.divider}`,
  },
  solicitudCta: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 13.5,
    color: theme.link,
  },
  emptyState: {
    background: '#fff',
    borderRadius: 22,
    padding: '44px 24px',
    textAlign: 'center',
    boxShadow: theme.cardShadowSoft,
  },
  emptyEmoji: {
    fontSize: 38,
    marginBottom: 10,
  },
  emptyTitle: {
    margin: 0,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 15.5,
    color: theme.textPrimary,
  },
  emptyText: {
    margin: '8px 0 0',
    fontSize: 13.5,
    color: theme.textMuted,
    lineHeight: '20px',
  },
  calendarCard: {
    background: '#fff',
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 6px 20px rgba(27, 52, 92, 0.07)',
  },
  calendarTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 18,
    marginBottom: 8,
  },
  calendarHint: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 1.5,
    margin: '0 0 16px',
  },
  calendarNextBtn: {
    width: '100%',
    border: 'none',
    borderRadius: 14,
    padding: '14px 16px',
    background: theme.accentSoft,
    color: theme.accent,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  typeBadgeReservation: {
    color: '#3158A3',
    backgroundColor: '#E8EEFF',
  },
  typeBadgeSuscription: {
    color: '#A36117',
    backgroundColor: '#FFF1DA',
  },
  typeBadgeEvento: {
    color: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  typeBadgeDieta: {
    color: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  typeBadgeTarea: {
    color: '#B45309',
    backgroundColor: '#FEF3C7',
  },
};

export default ReservationScreen;