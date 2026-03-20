import { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { API_CONFIG } from '../config';
import { useAuth } from './useAuth';
import notificationSound from '../assets/sound/notification.mp3';

interface UseSignalROptions {
    playSound?: boolean;
    listenEvents?: string[];
    soundEvents?: string[];
    enabled?: boolean;
}

export const useSignalR = (
    onReservationReceived?: (reservationId?: number | string, eventName?: string) => void,
    options: UseSignalROptions = {}
) => {
    const { token, isAuthenticated } = useAuth();
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const callbackRef = useRef(onReservationReceived);
    const playSoundRef = useRef(Boolean(options.playSound));
    const listenEventsRef = useRef<string[]>(options.listenEvents ?? ['ReceiveNewReservation']);
    const soundEventsRef = useRef<string[]>(options.soundEvents ?? []);
    const enabledRef = useRef(options.enabled ?? true);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        callbackRef.current = onReservationReceived;
    }, [onReservationReceived]);

    useEffect(() => {
        playSoundRef.current = Boolean(options.playSound);
    }, [options.playSound]);

    useEffect(() => {
        listenEventsRef.current = options.listenEvents ?? ['ReceiveNewReservation'];
    }, [options.listenEvents]);

    useEffect(() => {
        soundEventsRef.current = options.soundEvents ?? [];
    }, [options.soundEvents]);

    useEffect(() => {
        enabledRef.current = options.enabled ?? true;
    }, [options.enabled]);

    useEffect(() => {
        const audio = new Audio(notificationSound);
        audio.preload = 'auto';
        audio.volume = 0.9;
        notificationAudioRef.current = audio;

        return () => {
            if (notificationAudioRef.current) {
                notificationAudioRef.current.pause();
                notificationAudioRef.current = null;
            }
        };
    }, []);

    const playNotificationAudio = async () => {
        if (!playSoundRef.current) {
            return;
        }

        try {
            const audio = notificationAudioRef.current ?? new Audio(notificationSound);
            audio.currentTime = 0;
            await audio.play();
        } catch (err) {
            console.warn('No se pudo reproducir el audio de notificacion', err);
        }
    };

    useEffect(() => {
        if (!enabledRef.current || !isAuthenticated || !token) {
            setConnection(null);
            return;
        }

        const newConnection = new HubConnectionBuilder()
            .withUrl(API_CONFIG.HUB_URL, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();
        setConnection(newConnection);
        return () => {
            setConnection(null);
        };
    }, [token, isAuthenticated, options.enabled]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('🟢 SignalR Conectado exitosamente');

                    listenEventsRef.current.forEach((eventName) => {
                        connection.on(eventName, (reservationId) => {
                            console.log('🔔 Notificación recibida.', { eventName, reservationId });

                            if (playSoundRef.current && soundEventsRef.current.includes(eventName)) {
                                void playNotificationAudio();
                            }

                            if (callbackRef.current) {
                                callbackRef.current(reservationId, eventName);
                            }
                        });
                    });
                })
                .catch(error => {
                    const message = String(error?.message || error || '');
                    if (message.includes('401')) {
                        console.warn('SignalR deshabilitado por autenticacion invalida (401).');
                        return;
                    }
                    console.error('🔴 Error al conectar SignalR:', error);
                });

            return () => {
                listenEventsRef.current.forEach((eventName) => {
                    connection.off(eventName);
                });
                connection.stop();
            };
        }
    }, [connection]);
};