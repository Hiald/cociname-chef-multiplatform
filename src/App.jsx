import React, { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import Navigator from "./routes";
import { AuthProvider } from "./hooks/useAuth";
import "./App.css";

/**
 * Interceptor para manejar URLs sin hash (/ruta -> /#/ruta)
 * Necesario porque el backend genera URLs sin hash pero la app usa HashRouter
 */
function HashRouteInterceptor() {
  useEffect(() => {
    // Si la URL apunta a onboarding público, normaliza siempre al hash correcto
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    
    if (
      pathname.startsWith('/evento/') ||
      pathname.startsWith('/inicio/') ||
      pathname.startsWith('/onboarding/') ||
      pathname.startsWith('/reserva/') ||
      pathname.startsWith('/suscripcion/') ||
      pathname.startsWith('/dieta/') ||
      pathname.startsWith('/tarea/')
    ) {
      const normalizedHash = pathname + window.location.search;

      if (hash !== `#${normalizedHash}`) {
        window.location.hash = normalizedHash;
      }
      return;
    }

    // Si hay pathname pero no hay hash (o hash vacío), redirige
    if (pathname && pathname !== '/' && (!hash || hash === '#')) {
      window.location.hash = pathname + window.location.search;
    }
  }, []);
  
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <HashRouteInterceptor />
        <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
          <Navigator />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
