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

// ═══════════════════════════════════════════════════════════════
// PENDING RESERVATIONS - GET /api/Reservation/GetPendingReservation
// ═══════════════════════════════════════════════════════════════

export interface GetPendingReservationParams {
  dateFilter?: string;
  timeFilter?: string;
  Page?: number;
  RecordsPerPage?: number;
}

export interface PendingReservationResponse {
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
  preparationTime?: number;
  description?: string;
  isDuplicated?: boolean;
  order?: number;
  isOptional?: number;
  image1?: string;
  masterRecipeId?: number;
  masterRecipeTitle?: string | null;
  id?: number;
  status?: boolean;
  createdById?: string;
  createdAt?: string;
  updatedById?: string | null;
  updatedAt?: string | null;
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
// SUSCRIPTION - GET /api/suscription/ListSuscriptionById
// ═══════════════════════════════════════════════════════════════

export interface SuscriptionData {
  suscriptionCode: string;
  autoRenew: boolean;
  visitsPerMonth: number;
  visitWeekday: number;
  startDate: string;
  endDate: string;
  diner: number;
  type: number;
  totalPortion: number;
  portionperDay: number;
  puchaseIngredients: boolean;
  pricePurchaseIngredients: number;
  preparationTime: number;
  costPerHour: number;
  totalPrice: number;
  commissiontoChef: number;
  percentageCommision: number;
  reprogramated: number;
  comments: string;
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
  statusSuscription: number;
  payMethod: number;
  isPayed: number;
  searchStatus: number;
  customerId: number;
  customerName: string;
  customerLastName: string;
  customerPhone: string;
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

export interface SuscriptionResponse {
  data: SuscriptionData;
  success: boolean;
  errorMessage: string | null;
}

// ═══════════════════════════════════════════════════════════════
// RESERVATION SUSCRIPTION - GET /api/reservationSuscription/ListReservationSuscriptionById
// ═══════════════════════════════════════════════════════════════

export interface ReservationSuscriptionData {
  comment: string;
  jsonRequest: string;
  jsonOptional: string;
  suscriptionStatus: number;
  suscriptionCount: number;
  reservationSuscriptionCode: string;
  securityCode: string;
  isAdditionalReservation: boolean;
  additionalReservationPrice: number;
  diner: number;
  type: number;
  totalPortion: number;
  portionperDay: number;
  puchaseIngredients: boolean;
  preparationTime: number;
  dateReservation: string;
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
  suscriptionId: number;
  suscriptionCode: string;
  autoRenew: boolean;
  visitsPerMonth: number;
  visitWeekday: number;
  startDate: string;
  endDate: string;
  suscriptiondiner: number;
  suscriptionType: number;
  suscriptionTotalPortion: number;
  suscriptionPortionperDay: number;
  suscriptionUbication: string;
  suscriptionLatitude: string;
  suscriptionLongitude: string;
  suscriptionProvince: number;
  suscriptionDistrict: number;
  suscriptionCity: number;
  suscriptionDirection: string;
  suscriptionNumberClient: string;
  suscriptionReference: string;
  suscriptionNumberCustomer: string;
  jsonPaymentChef: string;
  id: number;
  status: boolean;
  createdById: string;
  createdAt: string;
  updatedById: string | null;
  updatedAt: string | null;
}

export interface ReservationSuscriptionResponse {
  data: ReservationSuscriptionData;
  success: boolean;
  errorMessage: string | null;
}

// ═══════════════════════════════════════════════════════════════
// INGREDIENT CHECKLIST - GET /api/reservationIngredientChecklist/filterbyReservation
// ═══════════════════════════════════════════════════════════════

export interface IngredientChecklistItem {
  id: number;
  reservationId?: number;
  reservationSuscriptionId?: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  category: number;
  isChecked: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface IngredientChecklistResponse {
  data: IngredientChecklistItem[];
  success: boolean;
  errorMessage: string | null;
}

// ═══════════════════════════════════════════════════════════════
// CHEF RESERVATION - Marcaciones de Chef
// ═══════════════════════════════════════════════════════════════

export interface ChefReservationData {
  id: number;
  reservationId?: number;
  reservationSuscriptionId?: number;
  chefId: number;
  arrivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  status: boolean;
  createdById: string;
  createdAt: string;
  updatedById?: string | null;
  updatedAt?: string | null;
}

export interface ChefReservationResponse {
  data: ChefReservationData[];
  success: boolean;
  errorMessage: string | null;
}

export interface MarkStartRequest {
  securityCode: string;
  dateReservationStart: string;
  hourReservationStart: string;
  image1Start?: string;
  commentStart?: string;
  latitudeStart: string;
  longitudeStart: string;
  isEmergency?: number;
  emergencyComment?: string;
  chefId: number;
  reservationId: number;
  reservationSuscriptionId?: number;
  startAt: string;
}

export interface MarkEndRequest {
  preparationTime: number;
  dateReservationEnd: string;
  hourReservationEnd: string;
  image1End?: string;
  commentEnd?: string;
  latitudeEnd: string;
  longitudeEnd: string;
  chefId: number;
  customerId: number;
  reservationId: number;
  reservationSuscriptionId?: number;
  finishedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Tipos de Navegación (6 vistas)
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
  SuscriptionDetail: {
    suscriptionId: number;
  };
};
