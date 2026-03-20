import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spacing } from '../styles';

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

const buildDefaultDays = (weekStartDate) => {
	return DAY_NAMES.map((name, index) => {
		const currentDate = new Date(weekStartDate);
		currentDate.setDate(weekStartDate.getDate() + index);

		return {
			id: formatDateKey(currentDate),
			name,
			label: formatDayLabel(currentDate),
			enabled: index === 1 || index === 2,
			startTime: '07:00',
			endTime: '20:00',
		};
	});
};

const getWeekStorageKey = (weekStartDate) => `availability-week-${formatDateKey(weekStartDate)}`;

const getDaysForWeek = (weekStartDate) => {
	const baseDays = buildDefaultDays(weekStartDate);
	const savedRaw = window.localStorage.getItem(getWeekStorageKey(weekStartDate));

	if (!savedRaw) {
		return baseDays;
	}

	try {
		const savedData = JSON.parse(savedRaw);
		return baseDays.map(day => ({
			...day,
			...(savedData[day.id] || {}),
		}));
	} catch (error) {
		console.error('No se pudo leer disponibilidad guardada', error);
		return baseDays;
	}
};

const AvailabilityScreen = () => {
	const navigate = useNavigate();
	const [weekStartDate, setWeekStartDate] = useState(() => getStartOfWeek(new Date()));
	const [days, setDays] = useState(() => getDaysForWeek(getStartOfWeek(new Date())));
	const [savedMessage, setSavedMessage] = useState('');

	const weekStorageKey = useMemo(() => getWeekStorageKey(weekStartDate), [weekStartDate]);

	const weekTitle = useMemo(() => {
		const start = new Date(weekStartDate);
		const end = new Date(weekStartDate);
		end.setDate(weekStartDate.getDate() + 6);

		return `Semana del ${start.getDate()} al ${end.getDate()} de ${MONTH_NAMES[end.getMonth()]}`;
	}, [weekStartDate]);

	const handleToggleDay = (id) => {
		setDays(prev => prev.map(day => (
			day.id === id ? { ...day, enabled: !day.enabled } : day
		)));
	};

	const handleTimeChange = (id, field, value) => {
		setDays(prev => prev.map(day => (
			day.id === id ? { ...day, [field]: value } : day
		)));
	};

	const moveWeek = (direction) => {
		setSavedMessage('');
		setWeekStartDate(prev => {
			const next = new Date(prev);
			next.setDate(prev.getDate() + (direction * 7));
			setDays(getDaysForWeek(next));
			return next;
		});
	};

	const handleSaveAvailability = () => {
		const payload = days.reduce((acc, day) => {
			acc[day.id] = {
				enabled: day.enabled,
				startTime: day.startTime,
				endTime: day.endTime,
			};
			return acc;
		}, {});

		window.localStorage.setItem(weekStorageKey, JSON.stringify(payload));
		setSavedMessage('Disponibilidad semanal guardada localmente');
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
									}}
									onClick={() => handleToggleDay(day.id)}
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
										value={day.startTime}
										onChange={(event) => handleTimeChange(day.id, 'startTime', event.target.value)}
										style={styles.timeInput}
									/>
									<span style={styles.toLabel}>hasta</span>
									<input
										type="time"
										value={day.endTime}
										onChange={(event) => handleTimeChange(day.id, 'endTime', event.target.value)}
										style={styles.timeInput}
									/>
								</div>
							)}
						</div>
					))}
				</div>

				<button style={styles.saveButton} onClick={handleSaveAvailability}>
					Guardar disponibilidad semanal
				</button>

				{savedMessage ? (
					<p style={styles.savedText}>{savedMessage}</p>
				) : null}
			</div>
		</div>
	);
};

const styles = {
	screen: {
		minHeight: '100%',
		width: '100%',
		backgroundColor: '#F3F4F6',
		padding: `${spacing.medium}px ${spacing.medium}px 84px`,
		boxSizing: 'border-box',
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
	savedText: {
		marginTop: spacing.small,
		textAlign: 'center',
		color: '#059669',
		fontSize: 14,
		fontWeight: '600',
	},
};

export default AvailabilityScreen;
