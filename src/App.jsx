import React from "react";
import { HashRouter } from "react-router-dom";
import Navigator from "./routes";
import { AuthProvider } from "./hooks/useAuth";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
          <Navigator />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
