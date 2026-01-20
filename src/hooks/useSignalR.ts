import { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { API_CONFIG } from '../config';
import { useAuth } from './useAuth';
import notificationSound from '../assets/sound/notification.mp3';

export const useSignalR = (onReservationReceived?: () => void) => {
    const { token, isAuthenticated } = useAuth();
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const callbackRef = useRef(onReservationReceived);

    useEffect(() => {
        callbackRef.current = onReservationReceived;
    }, [onReservationReceived]);

    useEffect(() => {
        if (!isAuthenticated || !token) return;

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
    }, [token, isAuthenticated]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('🟢 SignalR Conectado exitosamente');

                    connection.on("ReceiveNewReservation", (reservationId) => {
                        console.log("🔔 Notificación recibida. Reserva ID:", reservationId);
                        try {
                            //const audio = new Audio(notificationSound);
                            //audio.play().catch(e => console.warn("El navegador bloqueó el audio automático", e));
                            console.log("navegador bloqueó notificación");
                        } catch (err) {
                            console.error("Error audio", err);
                        }
                        //alert(`¡Nueva solicitud de reserva recibida! ID: ${reservationId}`);
                          console.log("notificación");
                        if (callbackRef.current) {
                            callbackRef.current();
                        }
                    });
                })
                .catch(error => console.error('🔴 Error al conectar SignalR:', error));

            return () => {
                connection.off("ReceiveNewReservation");
                connection.stop();
            };
        }
    }, [connection]);
};