// ═══════════════════════════════════════════════════════════════
// Tipos base de respuesta de la API
// ═══════════════════════════════════════════════════════════════

export interface BaseResponse {
  success: boolean;
  errorMessage?: string;
}

export interface BaseResponseGeneric<T> extends BaseResponse {
  data: T | null;
}

// ═══════════════════════════════════════════════════════════════
// LOGIN - POST /api/users/LoginChef
// ═══════════════════════════════════════════════════════════════

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginChefResponseDto {
  token: string;
  expirationDate: string;
  chefId: number;
}

// ═══════════════════════════════════════════════════════════════
// REGISTER - POST /api/users/RegisterChef
// ═══════════════════════════════════════════════════════════════

export interface RegisterRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  bornDate: string;
  documentType: number;
  age: number;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  address: string;
  reference: string;
  gmapsLink: string;
  latitude: string;
  longitude: string;
  allergies: string;
  district: number;
  gender: number;
  foodPreferences: string;
}

export interface RegisterChefResponseDto {
  userId: string;
  chefId: number;
  token: string;
  expirationDate: string;
}

// ═══════════════════════════════════════════════════════════════
// Tipos de Navegación (5 vistas)
// ═══════════════════════════════════════════════════════════════

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Reservation: undefined;
  Profile: undefined;
};
