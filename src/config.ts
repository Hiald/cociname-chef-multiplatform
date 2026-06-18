export const API_CONFIG = {
  BASE_URL: "https://apidev.cociname.pe/api/",
  HUB_URL: "https://apidev.cociname.pe/notificationHub",
  TIMEOUT: 30000, // 30 segundos
};


// Multi-país: la app de cocineras es un despliegue POR PAÍS
// (socia.cociname.pe = 1 Perú; el futuro despliegue chileno usará 2).
// Sobre-escribible por entorno Vite: VITE_COUNTRY_ID, VITE_PHONE_PREFIX, VITE_LEVEL3_LABEL.
// Ver specs/geography.yaml y specs/common.yaml (x-country-resolution).
const viteEnv = (import.meta as any).env || {};
export const GEO_CONFIG = {
  COUNTRY_ID: parseInt(viteEnv.VITE_COUNTRY_ID || '1', 10),
  PHONE_PREFIX: String(viteEnv.VITE_PHONE_PREFIX || '51'),
  LEVEL3_LABEL: String(viteEnv.VITE_LEVEL3_LABEL || 'Distrito'), // Distrito (PE) / Comuna (CL)
};
