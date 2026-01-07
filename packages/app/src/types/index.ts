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
// RESERVATION DETAIL - GET /api/Reservation/ListReservationById
// ═══════════════════════════════════════════════════════════════

export interface ReservationDetailData {
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
  dateReservation: string;
  hourReservation: string;
  reprogramated: number;
  comments: string | null;
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
  customerName: string;
  customerLastName: string;
  customerPhone: string;
  jsonPaymentChef: string;
  chefId: number;
  chefName: string;
  chefLastName: string;
  chefPhone: string;
  couponId: number;
  id: number;
  status: boolean;
  createdById: string;
  createdAt: string;
  updatedById: string | null;
  updatedAt: string | null;
}

export interface ReservationDetailResponse {
  data: ReservationDetailData;
  success: boolean;
  errorMessage: string | null;
}

// ═══════════════════════════════════════════════════════════════
// RESERVATION RECIPES - GET /api/reservationMasterRecipe/ReservationMasterRecipeSearchId
// ═══════════════════════════════════════════════════════════════

export interface ReservationRecipeData {
  id: number;
  reservationId: number;
  masterRecipeId: number;
  diner: number;
  portionperDay: number;
  portionSubTotal: number;
  typePortionperDay: number;
  jsonRequest: string;
  jsonOptional: string;
  comment: string | null;
  status: boolean;
  createdById: string;
  createdAt: string;
  updatedById: string | null;
  updatedAt: string | null;
}

export interface RecipeMenuItem {
  MenuId: string;
  MenuNombre: string;
  MasterRecipeId: string;
  MasterRecipeNombre: string;
  iCantidadPlatos: number;
  iMasterRecipeId: number;
  sPasos?: string;
  key: string;
}

export interface ReservationRecipeResponse {
  data: ReservationRecipeData[];
  success: boolean;
  errorMessage: string | null;
}

// ═══════════════════════════════════════════════════════════════
// INGREDIENTS - GET /api/ingredient/IngredientByMasterRecipeId
// ═══════════════════════════════════════════════════════════════

export interface IngredientData {
  category: number;
  type: number;
  name: string;
  size: string;
  reference: string;
  unit: number;
  uM_value: number;
  price: number;
}

export interface IngredientResponse {
  data: IngredientData[];
  success: boolean;
  errorMessage: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MASTER RECIPE - GET /api/masterRecipe/{id}
// ═══════════════════════════════════════════════════════════════

export interface MasterRecipeData {
  id: number;
  title: string;
  description: string;
  versionOfRecipe: number;
  isOriginalVersion: boolean;
  timePreparation: number;
  tags: string | null;
  lifeofTime: string | null;
  lifeofTimeDescription: string | null;
  type: string | null;
  origin: string | null;
  subTypeOrigin: string | null;
  protein: string | null;
  menuId: number;
  menuTitle: string;
  menuImg: string;
  status: boolean;
  createdById: string;
  createdAt: string;
  updatedById: string | null;
  updatedAt: string | null;
}

export interface MasterRecipeResponse {
  data: MasterRecipeData;
  success: boolean;
  errorMessage: string | null;
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
  ReservationDetail: {
    reservationId: number;
    isActive?: boolean;
  };
};
