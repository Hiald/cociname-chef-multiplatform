import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';

const DAY_NAMES = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const getStartOfWeek = (date) => {
	const result = new Date(date);
	const day = result.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	result.setDate(result.getDate() + diff);
	result.setHours(0, 0, 0, 0);
	return result;
};

const formatDateKey = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const formatDayLabel = (date) => `${date.getDate()} ${date.toLocaleString('es-PE', { month: 'short' })}`;

const DEFAULT_START_TIME = '07:00';
const DEFAULT_END_TIME = '20:00';

const buildDefaultDays = (weekStartDate) => {
	return DAY_NAMES.map((name, index) => {
		const currentDate = new Date(weekStartDate);
		currentDate.setDate(weekStartDate.getDate() + index);

		return {
			id: formatDateKey(currentDate),
			name,
			label: formatDayLabel(currentDate),
			enabled: false,
			startTime: DEFAULT_START_TIME,
			endTime: DEFAULT_END_TIME,
		};
	});
};

const normalizeTimeValue = (value, fallback) => {
	if (typeof value !== 'string') return fallback;
	const trimmed = value.trim();
	if (!/^\d{2}:\d{2}$/.test(trimmed)) return fallback;
	return trimmed;
};

const timeToMinutes = (value) => {
	const [hours, minutes] = value.split(':').map(Number);
	return hours * 60 + minutes;
};

const validateDaysBeforeSave = (days) => {
	for (const day of days) {
		if (!day.enabled) continue;

		const startTime = normalizeTimeValue(day.startTime, '');
		const endTime = normalizeTimeValue(day.endTime, '');

		if (!startTime || !endTime) {
			return `Completa el horario de ${day.name}`;
		}

		if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
			return `En ${day.name}, la hora de inicio debe ser menor que la de fin`;
		}
	}

	return null;
};

const extractAvailabilityId = (response) => {
	const data = response?.data;
	if (data == null) return null;
	if (typeof data === 'number' && Number.isFinite(data)) return data;
	if (typeof data === 'object') {
		const rawId = data.id ?? data.Id ?? data.availabilityId;
		const parsed = Number(rawId);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
	}
	return null;
};

const getWeekStorageKey = (weekStartDate) => `availability-week-${formatDateKey(weekStartDate)}`;

const formatDateForApi = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const formatDateTimeForApi = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getWeekNumber = (date) => {
	const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = utcDate.getUTCDay() || 7;
	utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
	return Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
};

const parseHourRange = (hourRange) => {
	if (!hourRange || typeof hourRange !== 'string') {
		return { enabled: false, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME };
	}

	const [start, end] = hourRange.split(',');
	const startTime = normalizeTimeValue(start, '');
	const endTime = normalizeTimeValue(end, '');
	if (!startTime || !endTime) {
		return { enabled: false, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME };
	}

	return {
		enabled: true,
		startTime,
		endTime,
	};
};

const applyAvailabilityToDays = (weekStartDate, availabilityRow) => {
	const baseDays = buildDefaultDays(weekStartDate);
	const dayMap = [
		availabilityRow?.hourMonday,
		availabilityRow?.hourTuesday,
		availabilityRow?.hourWednesday,
		availabilityRow?.hourThursday,
		availabilityRow?.hourFriday,
		availabilityRow?.hourSaturday,
		availabilityRow?.hourSunday,
	];

	return baseDays.map((day, index) => {
		const parsed = parseHourRange(dayMap[index]);
		if (availabilityRow?.isWorking === 0) {
			return {
				...day,
				enabled: false,
				startTime: parsed.startTime,
				endTime: parsed.endTime,
			};
		}

		return {
			...day,
			...parsed,
		};
	});
};

const getPayloadFromDays = ({ days, weekStartDate, chefId, workShift, currentAvailabilityId, chefData, createdAt }) => {
	const hours = days.map(day => {
		if (!day.enabled) return null;
		const startTime = normalizeTimeValue(day.startTime, DEFAULT_START_TIME);
		const endTime = normalizeTimeValue(day.endTime, DEFAULT_END_TIME);
		return `${startTime},${endTime}`;
	});
	const weekEndDate = new Date(weekStartDate);
	weekEndDate.setDate(weekStartDate.getDate() + 6);

	return {
		dayOfTheWeek: 0,
		isWorking: days.some(day => day.enabled) ? 1 : 0,
		name: '-',
		description: '-',
		hourMonday: hours[0],
		hourTuesday: hours[1],
		hourWednesday: hours[2],
		hourThursday: hours[3],
		hourFriday: hours[4],
		hourSaturday: hours[5],
		hourSunday: hours[6],
		dateStart: formatDateForApi(weekStartDate),
		dateEnd: formatDateForApi(weekEndDate),
		workShift,
		valuesofWeek: days.map(day => (day.enabled ? '1' : '0')).join(','),
		baseLatitude: chefData?.baseLatitude || '0',
		baseLongitude: chefData?.baseLongitude || '0',
		coverageRadiusKm: chefData?.coverageRadiusKm || 1,
		chefId,
		id: currentAvailabilityId || 0,
		status: true,
		createdById: String(chefId),
		createdAt: createdAt || formatDateTimeForApi(new Date()),
	};
};

const getDaysForWeek = (weekStartDate) => {
	const baseDays = buildDefaultDays(weekStartDate);
	const savedRaw = window.localStorage.getItem(getWeekStorageKey(weekStartDate));

	if (!savedRaw) {
		return baseDays;
	}

	try {
		const savedData = JSON.parse(savedRaw);
		return baseDays.map(day => {
			const savedDay = savedData[day.id] || {};
			return {
				...day,
				...savedDay,
				enabled: Boolean(savedDay.enabled),
				startTime: normalizeTimeValue(savedDay.startTime, DEFAULT_START_TIME),
				endTime: normalizeTimeValue(savedDay.endTime, DEFAULT_END_TIME),
			};
		});
	} catch (error) {
		console.error('No se pudo leer disponibilidad guardada', error);
		return baseDays;
	}
};

const AvailabilityScreen = () => {
	const navigate = useNavigate();
	const { chefData } = useAuth();
	const chefId = chefData?.chefId;
	const [weekStartDate, setWeekStartDate] = useState(() => getStartOfWeek(new Date()));
	const [days, setDays] = useState(() => getDaysForWeek(getStartOfWeek(new Date())));
	const [savedMessage, setSavedMessage] = useState('');
	const [isErrorMessage, setIsErrorMessage] = useState(false);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [availabilityId, setAvailabilityId] = useState(null);
	const [createdAt, setCreatedAt] = useState(null);
	const loadRequestIdRef = useRef(0);

	const workShift = useMemo(() => getWeekNumber(weekStartDate), [weekStartDate]);
	const isBusy = loading || submitting;

	const showMessage = useCallback((message, isError = false) => {
		setSavedMessage(message);
		setIsErrorMessage(isError);
	}, []);

	const loadAvailabilityForWeek = useCallback(async (targetWeekStartDate, options = {}) => {
		const { preserveIdOnEmpty = false } = options;

		if (!chefId) {
			setDays(buildDefaultDays(targetWeekStartDate));
			setAvailabilityId(null);
			setCreatedAt(null);
			return { success: false, found: false };
		}

		const weekEndDate = new Date(targetWeekStartDate);
		weekEndDate.setDate(targetWeekStartDate.getDate() + 6);
		const targetShift = getWeekNumber(targetWeekStartDate);
		const requestId = ++loadRequestIdRef.current;

		setLoading(true);
		try {
			const response = await apiService.getAvailabilityByWeekAndDate({
				ChefId: chefId,
				WorkShift: targetShift,
				DateStart: formatDateForApi(targetWeekStartDate),
				DateEnd: formatDateForApi(weekEndDate),
				Page: 1,
				RecordsPerPage: 10,
			});

			if (requestId !== loadRequestIdRef.current) {
				return { success: false, found: false, stale: true };
			}

			if (response.success && response.data && response.data.length > 0) {
				const row = response.data[0];
				setDays(applyAvailabilityToDays(targetWeekStartDate, row));
				setAvailabilityId(row.id || null);
				setCreatedAt(row.createdAt || null);
				return { success: true, found: true, id: row.id || null };
			}

			setDays(getDaysForWeek(targetWeekStartDate));
			if (!preserveIdOnEmpty) {
				setAvailabilityId(null);
				setCreatedAt(null);
			}
			return { success: Boolean(response.success), found: false };
		} catch (error) {
			console.error('Error loading availability:', error);
			if (requestId !== loadRequestIdRef.current) {
				return { success: false, found: false, stale: true };
			}
			setDays(getDaysForWeek(targetWeekStartDate));
			if (!preserveIdOnEmpty) {
				setAvailabilityId(null);
				setCreatedAt(null);
			}
			return { success: false, found: false };
		} finally {
			if (requestId === loadRequestIdRef.current) {
				setLoading(false);
			}
		}
	}, [chefId]);

	useEffect(() => {
		void loadAvailabilityForWeek(weekStartDate);
	}, [weekStartDate, loadAvailabilityForWeek]);

	const weekTitle = useMemo(() => {
		const start = new Date(weekStartDate);
		const end = new Date(weekStartDate);
		end.setDate(weekStartDate.getDate() + 6);

		return `Semana del ${start.getDate()} al ${end.getDate()} de ${MONTH_NAMES[end.getMonth()]}`;
	}, [weekStartDate]);

	const handleToggleDay = (id) => {
		if (isBusy) return;
		setDays(prev => prev.map(day => {
			if (day.id !== id) return day;
			const nextEnabled = !day.enabled;
			return {
				...day,
				enabled: nextEnabled,
				startTime: normalizeTimeValue(day.startTime, DEFAULT_START_TIME),
				endTime: normalizeTimeValue(day.endTime, DEFAULT_END_TIME),
			};
		}));
	};

	const handleTimeChange = (id, field, value) => {
		if (isBusy) return;
		setDays(prev => prev.map(day => (
			day.id === id ? { ...day, [field]: value } : day
		)));
	};

	const moveWeek = (direction) => {
		if (isBusy) return;
		showMessage('');
		setWeekStartDate(prev => {
			const next = new Date(prev);
			next.setDate(prev.getDate() + (direction * 7));
			return next;
		});
	};

	const handleSaveAvailability = async () => {
		if (isBusy) return;

		if (!chefId) {
			showMessage('No se pudo identificar la chef logeada', true);
			return;
		}

		const validationError = validateDaysBeforeSave(days);
		if (validationError) {
			showMessage(validationError, true);
			return;
		}

		const wasUpdate = Boolean(availabilityId);
		const payload = getPayloadFromDays({
			days,
			weekStartDate,
			chefId,
			workShift,
			currentAvailabilityId: availabilityId,
			chefData,
			createdAt,
		});

		setSubmitting(true);
		try {
			const response = wasUpdate
				? await apiService.updateAvailability(availabilityId, payload)
				: await apiService.createAvailability(payload);

			if (response.success) {
				const responseId = extractAvailabilityId(response);
				if (responseId) {
					setAvailabilityId(responseId);
				}

				const successText = wasUpdate
					? 'Disponibilidad semanal actualizada correctamente'
					: 'Disponibilidad semanal guardada correctamente';
				showMessage(successText, false);

				const reload = await loadAvailabilityForWeek(weekStartDate, { preserveIdOnEmpty: true });
				if (!reload.found && !responseId && !wasUpdate) {
					showMessage('Se guardó, pero no se pudo confirmar el registro. Intenta actualizar de nuevo.', true);
				}
			} else {
				showMessage(response.errorMessage || 'No se pudo guardar la disponibilidad', true);
			}
		} catch (error) {
			console.error('Error saving availability:', error);
			showMessage('Error al guardar disponibilidad. Revisa tu conexión e intenta de nuevo.', true);
		} finally {
			setSubmitting(false);
		}
	};

	const handleCopyFromPreviousWeek = async () => {
		if (isBusy) return;

		if (!chefId) {
			showMessage('No se pudo identificar la chef logeada', true);
			return;
		}

		if (availabilityId) {
			showMessage('Esta semana ya tiene disponibilidad. Usa Actualizar disponibilidad.', true);
			return;
		}

		const previousWeekStart = new Date(weekStartDate);
		previousWeekStart.setDate(previousWeekStart.getDate() - 7);
		const previousWeekEnd = new Date(previousWeekStart);
		previousWeekEnd.setDate(previousWeekStart.getDate() + 6);

		setSubmitting(true);
		try {
			const previousResponse = await apiService.getAvailabilityByWeekAndDate({
				ChefId: chefId,
				WorkShift: getWeekNumber(previousWeekStart),
				DateStart: formatDateForApi(previousWeekStart),
				DateEnd: formatDateForApi(previousWeekEnd),
				Page: 1,
				RecordsPerPage: 10,
			});

			if (!previousResponse.success || !previousResponse.data || previousResponse.data.length === 0) {
				showMessage('No existe disponibilidad en la semana anterior para copiar', true);
				return;
			}

			const previousRow = previousResponse.data[0];
			const copiedDays = applyAvailabilityToDays(weekStartDate, previousRow);
			const validationError = validateDaysBeforeSave(copiedDays);
			if (validationError) {
				showMessage(`No se pudo copiar: ${validationError}`, true);
				return;
			}

			const payload = getPayloadFromDays({
				days: copiedDays,
				weekStartDate,
				chefId,
				workShift,
				currentAvailabilityId: 0,
				chefData,
			});

			const createResponse = await apiService.createAvailability(payload);
			if (createResponse.success) {
				const responseId = extractAvailabilityId(createResponse);
				if (responseId) {
					setAvailabilityId(responseId);
				}
				showMessage('Se copió la disponibilidad de la semana pasada', false);
				setDays(copiedDays);
				await loadAvailabilityForWeek(weekStartDate, { preserveIdOnEmpty: true });
			} else {
				showMessage(createResponse.errorMessage || 'No se pudo copiar la semana pasada', true);
			}
		} catch (error) {
			console.error('Error copying previous week availability:', error);
			showMessage('Error al copiar disponibilidad de la semana pasada', true);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div style={styles.screen}>
			<div style={styles.container}>
				<button style={styles.backButton} onClick={() => navigate('/home')}>
					{'<'} Volver
				</button>

				<h1 style={styles.title}>Mi disponibilidad</h1>

				<div style={styles.weekSelector}>
					<button style={styles.arrowButton} onClick={() => moveWeek(-1)}>
						{'<'}
					</button>
					<p style={styles.weekTitle}>{weekTitle}</p>
					<button style={styles.arrowButton} onClick={() => moveWeek(1)}>
						{'>'}
					</button>
				</div>

                <button style={{ ...styles.secondaryButton, ...(isBusy ? styles.disabledButton : {}) }} onClick={handleCopyFromPreviousWeek} disabled={isBusy}>
					{submitting ? 'Procesando...' : 'Igual que la semana pasada'}
				</button>

				{loading ? (
					<p style={styles.loadingText}>Cargando disponibilidad...</p>
				) : null}

				<div style={styles.daysList}>
					{days.map(day => (
						<div
							key={day.id}
							style={{
								...styles.dayCard,
								...(day.enabled ? styles.dayCardActive : {}),
							}}
						>
							<div style={styles.dayHeader}>
								<p style={styles.dayName}>{day.name} <span style={styles.dayLabel}>{day.label}</span></p>
								<button
									style={{
										...styles.switchTrack,
										...(day.enabled ? styles.switchTrackOn : {}),
										...(isBusy ? styles.disabledButton : {}),
									}}
									onClick={() => handleToggleDay(day.id)}
									disabled={isBusy}
									aria-label={`Disponibilidad ${day.name}`}
								>
									<span
										style={{
											...styles.switchThumb,
											...(day.enabled ? styles.switchThumbOn : {}),
										}}
									/>
								</button>
							</div>

							{day.enabled && (
								<div style={styles.timeRow}>
									<input
										type="time"
										value={day.startTime || DEFAULT_START_TIME}
										onChange={(event) => handleTimeChange(day.id, 'startTime', event.target.value)}
										style={styles.timeInput}
										disabled={isBusy}
									/>
									<span style={styles.toLabel}>hasta</span>
									<input
										type="time"
										value={day.endTime || DEFAULT_END_TIME}
										onChange={(event) => handleTimeChange(day.id, 'endTime', event.target.value)}
										style={styles.timeInput}
										disabled={isBusy}
									/>
								</div>
							)}
						</div>
					))}
				</div>

				<button style={{ ...styles.saveButton, ...(isBusy ? styles.disabledButton : {}) }} onClick={handleSaveAvailability} disabled={isBusy}>
					{submitting
						? (availabilityId ? 'Actualizando...' : 'Guardando...')
						: (availabilityId ? 'Actualizar disponibilidad' : 'Guardar disponibilidad')}
				</button>

				{savedMessage ? (
					<p style={{ ...styles.savedText, ...(isErrorMessage ? styles.errorText : {}) }}>{savedMessage}</p>
				) : null}
			</div>
		</div>
	);
};

const styles = {
	screen: {
		position: 'fixed',
		inset: 0,
		zIndex: 3000,
		minHeight: '100vh',
		width: '100vw',
		backgroundColor: '#F3F4F6',
		padding: `${spacing.medium}px ${spacing.medium}px 84px`,
		boxSizing: 'border-box',
		overflowY: 'auto',
	},
	container: {
		maxWidth: 520,
		margin: '0 auto',
	},
	backButton: {
		backgroundColor: '#F3F4F6',
		color: '#111827',
		borderRadius: 8,
		padding: '10px 0px',
		fontSize: 14,
		fontWeight: '500',
		cursor: 'pointer',
		marginBottom: spacing.medium,
	},
	title: {
		margin: 0,
		fontSize: 30,
		fontWeight: '700',
		color: '#111827',
	},
	weekSelector: {
		marginTop: spacing.medium,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: spacing.medium,
	},
	arrowButton: {
		width: 32,
		borderRadius: 16,
		border: 'none',
		backgroundColor: 'transparent',
		color: '#EF4444',
		fontWeight: '700',
		cursor: 'pointer',
		fontSize: 18,
	},
	weekTitle: {
		margin: 0,
		fontSize: 16,
		color: '#111827',
		textAlign: 'center',
		fontWeight: '600',
	},
	weekShiftText: {
		margin: `0 0 ${spacing.small}px 0`,
		fontSize: 13,
		color: '#6B7280',
	},
	loadingText: {
		margin: `0 0 ${spacing.small}px 0`,
		fontSize: 13,
		color: '#6B7280',
	},
	daysList: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.small,
		marginBottom: spacing.large,
	},
	dayCard: {
		borderRadius: 12,
		border: '1px solid #D1D5DB',
		padding: spacing.medium,
	},
	dayCardActive: {
		border: '1px solid #2EBE60',
	},
	dayHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	dayName: {
		margin: 0,
		color: '#111827',
		fontSize: 18,
		fontWeight: '700',
		display: 'flex',
		gap: 6,
		alignItems: 'center',
	},
	dayLabel: {
		fontSize: 16,
		fontWeight: '500',
		color: '#374151',
	},
	switchTrack: {
		width: 46,
		height: 28,
		borderRadius: 14,
		border: 'none',
		backgroundColor: '#D1D5DB',
		position: 'relative',
		cursor: 'pointer',
		padding: 0,
	},
	switchTrackOn: {
		backgroundColor: '#2EBE60',
	},
	switchThumb: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: '#FFFFFF',
		position: 'absolute',
		top: 4,
		left: 4,
		transition: 'left 0.2s ease',
	},
	switchThumbOn: {
		left: 22,
	},
	timeRow: {
		display: 'flex',
		alignItems: 'center',
		gap: spacing.small,
		marginTop: spacing.small,
	},
	timeInput: {
		width: 92,
		border: '1px solid #D1D5DB',
		borderRadius: 8,
		padding: '6px 8px',
		fontSize: 14,
		color: '#111827',
		backgroundColor: '#FFFFFF',
	},
	toLabel: {
		margin: 0,
		color: '#374151',
		fontSize: 16,
		fontWeight: '500',
	},
	saveButton: {
		width: '100%',
		border: 'none',
		borderRadius: 999,
		backgroundColor: '#FF5136',
		color: '#FFFFFF',
		padding: '14px 16px',
		fontSize: 16,
		fontWeight: '700',
		cursor: 'pointer',
	},
	secondaryButton: {
		width: '100%',
		border: '1px solid #FF51361A',
		borderRadius: 999,
		backgroundColor: '#FF51361A',
		color: '#FF5136',
		padding: '12px 16px',
		fontSize: 15,
		fontWeight: '700',
		cursor: 'pointer',
		marginBottom: spacing.medium,
	},
	disabledButton: {
		opacity: 0.6,
		cursor: 'not-allowed',
	},
	savedText: {
		marginTop: spacing.small,
		textAlign: 'center',
		color: '#059669',
		fontSize: 14,
		fontWeight: '600',
	},
	errorText: {
		color: '#DC2626',
	},
};

export default AvailabilityScreen;
