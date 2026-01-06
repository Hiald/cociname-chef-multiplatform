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

export interface ListReservationChefResponse {
  data: Datum[];
  success: boolean;
  errorMessage: string | null;
}

export interface Datum {
  reservationCode: string;
  securityCode: string;
  diner: number;
  preparationTime: number;
  type: number;
  totalPortion: number;
  portionperDay: number;
  puchaseIngredients: boolean;
  costPerHour: number;
  totalPrice: number;
  commissiontoChef: number;
  percentageCommision: number;
  dateReservation: Date;
  hourReservation: string;
  reprogramated: number;
  comments: string;
  commentClient: string;
  ubication: string;
  latitude: string;
  longitude: string;
  province: number;
  district: number;
  city: number;
  direction: string;
  numberClient: string;
  reference: string;
  numberCustomer: string;
  statusReservation: number;
  payMethod: number;
  isPayed: number;
  searchStatus: number;
  customerId: number;
  customerName: string | null;
  customerLastName: string | null;
  customerPhone: string | null;
  jsonPaymentChef: string;
  chefId: number;
  chefName: string | null;
  chefLastName: string | null;
  chefPhone: string | null;
  couponId: number;
  id: number;
  status: boolean;
  createdById: string;
  createdAt: Date;
  updatedById: string | null;
  updatedAt: Date | null;
}

export enum StatusReservation {
  Draft = 0,
  Creada = 1,
  Actualizada = 2,
  Aceptada = 3,
  EnCompra = 4,
  EnTrayecto = 5,
  EnCocina = 6,
  Completada = 7,
  Cancelada = 8,
  Reprogramada = 9,
  ReasignacionCocinera = 10,
}

// ═══════════════════════════════════════════════════════════════
// CHEF - GET /api/Chef/{id}
// ═══════════════════════════════════════════════════════════════

export interface ChefData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  genderId: number;
  experience: string;
  processDetailtoCooking: string;
  disponibilitytoWork: string;
  imageFileName1: string;
  imageFileName2: string;
  imageFileName3: string;
  description: string;
  specialty: string;
  rating: number;
  nationality: number;
  province: number;
  district: number;
  city: number;
  address: string;
  reference: string;
  deviceToken: string | null;
  baseLatitude: string | null;
  baseLongitude: string | null;
  coverageRadiusKm: number;
  tags: string | null;
  id: number;
  status: boolean;
  createdById: string | null;
  createdAt: string | null;
  updatedById: string | null;
  updatedAt: string | null;
  userUID: string;
}

export interface ChefResponse {
  data: ChefData;
  success: boolean;
  errorMessage: string | null;
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
  MainTabs: undefined;
};
