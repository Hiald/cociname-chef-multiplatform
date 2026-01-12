import React from "react";
import { BrowserRouter } from "react-router-dom";
import Navigator from "./routes";
import { AuthProvider } from "./hooks/useAuth";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
          <Navigator />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
