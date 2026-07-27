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
// RECUPERAR CONTRASEÑA CHEF
// ═══════════════════════════════════════════════════════════════

export interface ForgotPasswordChefRequestDto {
  email: string;
}

export interface VerifyResetLinkRequestDto {
  tokenLink: string;
}

export interface CompletePasswordResetRequestDto {
  tokenLink: string;
  nuevaPassword: string;
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
  district: number;  // GeoDivision nivel 3 (Distrito PE / Comuna CL)
  province: number;  // GeoDivision nivel 2 — derivada del distrito elegido
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

// ═══════════════════════════════════════════════════════════════
// RESERVATION EVENT - GET /api/AppReservationEvent/GetPendingReservationEvent
// ═══════════════════════════════════════════════════════════════

export interface GetPendingEventReservationParams {
  dateFilter?: string;
  timeFilter?: string;
  Page?: number;
  RecordsPerPage?: number;
}

export interface ReservationEventData {
  [key: string]: any;
}

export interface ReservationEventResponse {
  data: ReservationEventData[];
  success: boolean;
  errorMessage: string | null;
}

// ═══════════════════════════════════════════════════════════════
// APP PENDING RESERVATIONS
// GET /api/AppReservationDiet/GetPendingReservationDiet
// GET /api/AppReservationEvent/GetPendingReservationEvent
// GET /api/AppReservationServiceTask/GetPendingReservationServiceTask
// ═══════════════════════════════════════════════════════════════

export interface AppPendingReservationData {
  [key: string]: any;
}

export interface AppPendingReservationResponse {
  data: AppPendingReservationData[];
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
  countryId?: number; // multi-país: 1=Perú, 2=Chile (el API lo devuelve desde jun 2026)
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
  countryId?: number; // multi-país: 1=Perú, 2=Chile (el API lo devuelve desde jun 2026)
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
// CATÁLOGO DE PLATOS - GET /api/menu/GetbyFilters
// El API ya limita a BusinessLine=1 (reservas/suscripciones) y al país del
// request mediante el query filter global de Menu.
// ═══════════════════════════════════════════════════════════════

export interface MenuData {
  id: number;
  name: string;
  description: string;
  recipe: string;
  typeFood: number | null;
  origin: number | null;
  protein: string | null;
  tags: string | null;
  category: number;
  timePreparation: number;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  businessLine: number;
  countryId: number;
  status: boolean;
}

/** Motivos del reporte de receta (mismo orden que el API). */
export const RecipeFeedbackReason = {
  IngredienteIncorrecto: 1,
  CantidadEquivocada: 2,
  PasoConfuso: 3,
  AgregarConsejo: 4,
  Otro: 5,
} as const;

export interface RecipeFeedbackData {
  id: number;
  ticketCode: string;
  reasonType: number;
  comment: string;
  feedbackStatus: number;
  masterRecipeId: number;
  menuId: number;
  chefId: number;
  menuName: string | null;
  masterRecipeTitle: string | null;
  createdAt: string | null;
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
  countryId?: number; // multi-país: 1=Perú, 2=Chile (el API lo devuelve desde jun 2026)
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
// CHEF RATING - GET /api/chefRating/chef/{chefId}
// Reseñas que los clientes dejan desde el catálogo público de la webapp.
// No están ligadas a una reserva: solo traen el nombre que el cliente escribió.
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// CHEF DOCUMENTATION - GET /api/chefDocumentation/filterbyChef
// Documentos de la cocinera. Hoy solo el admin los sube (el POST del API
// exige rol Admin/Operation); la chefapp los consulta.
// ═══════════════════════════════════════════════════════════════

/** DocumentType — mismos ids que el select del admin (Chef/Control.cshtml). */
export const ChefDocumentType = {
  AntecedentesPoliciales: 1,
  CarnetSanidad: 2,
  CV: 3,
  DniPasaporte: 4,
} as const;

/** DocumentStatus — ver GetEstadoDocumento en cociname-admin/_Layout.cshtml. */
export const ChefDocumentStatus = {
  Pendiente: 1,
  Aprobado: 2,
  Rechazado: 3,
  Observado: 4,
} as const;

export interface ChefDocumentationData {
  document: string | null;
  documentStatus: number;
  documentType: number;
  commentsChef: string | null;
  comments: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  chefId: number;
  id: number;
  status: boolean;
  createdById: string | null;
  createdAt: string | null;
  updatedById: string | null;
  updatedAt: string | null;
}

// ═══════════════════════════════════════════════════════════════
// RECIBOS POR HONORARIOS - api/chefReceipt
// La cocinera emite el RxH en SUNAT y lo sube; la app no lo emite.
// ═══════════════════════════════════════════════════════════════

/** Tipo de servicio al que pertenece el recibo. */
export const ReceiptServiceType = {
  Reserva: 1,
  Suscripcion: 2,
  Evento: 3,
  Dieta: 4,
  Tarea: 5,
} as const;

export const ReceiptStatus = {
  Pendiente: 1,
  Aprobado: 2,
  Rechazado: 3,
  Observado: 4,
} as const;

export interface ChefPaymentConcept {
  conceptType: number;
  conceptName: string;
  amount: number;
}

/** Servicio terminado que todavía no tiene recibo. */
export interface PendingReceipt {
  serviceType: number;
  serviceId: number;
  serviceDate: string;
  serviceHour: string | null;
  customerName: string | null;
  /** DNI del cliente: sale de CocinameUserIdentity, no de la tabla Customer. */
  customerDocument: string | null;
  reference: string | null;
  expectedAmount: number;
  concepts: ChefPaymentConcept[];
}

export interface ChefReceiptData {
  id: number;
  receiptNumber: string;
  receiptUrl: string;
  expectedAmount: number;
  amount: number;
  receiptStatus: number;
  source: number;
  serviceType: number;
  adminNotes: string | null;
  commentsChef: string | null;
  reviewedAt: string | null;
  chefId: number;
  serviceDate: string | null;
  customerName: string | null;
  createdAt: string | null;
}

export interface ChefRatingData {
  chefId: number;
  ratingValue: number;
  customerName: string;
  comment: string | null;
  imageFileName1: string | null;
  imageFileName2: string | null;
  imageFileName3: string | null;
  id: number;
  status: boolean;
  createdById: string | null;
  createdAt: string | null;
  updatedById: string | null;
  updatedAt: string | null;
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
  countryId?: number; // multi-país: 1=Perú, 2=Chile (el API lo devuelve desde jun 2026)
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
  countryId?: number; // multi-país: 1=Perú, 2=Chile (el API lo devuelve desde jun 2026)
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

export interface ReservationAssignmentRequestDto {
  priority?: number;
  assignmentStatus?: number;
  notifiedAt?: string | null;
  hourNotifiedAt?: string | null;
  responseAt?: string | null;
  hourResponseAt?: string | null;
  rejectionReason?: string | null;
  chefId?: number | null;
  reservationId?: number | null;
  suscriptionId?: number | null;
  reservationSuscriptionId?: number | null;
  eventReservationId?: number | null;
  reservationDietId?: number | null;
  reservationServiceTaskId?: number | null;
  status?: boolean;
  createdById?: string | null;
  createdAt?: string | null;
}

/** @deprecated Usar ReservationAssignmentRequestDto */
export type ReservationEventAssignmentRequestDto = ReservationAssignmentRequestDto;

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
// AVAILABILITY - GET/POST/PUT /api/Availability
// ═══════════════════════════════════════════════════════════════

export interface GetAvailabilityByWeekAndDateParams {
  ChefId: number;
  WorkShift: number;
  DateStart: string;
  DateEnd: string;
  Page?: number;
  RecordsPerPage?: number;
}

export interface AvailabilityData {
  dayOfTheWeek: number;
  isWorking: number;
  name: string;
  description: string;
  hourMonday?: string | null;
  hourTuesday?: string | null;
  hourWednesday?: string | null;
  hourThursday?: string | null;
  hourFriday?: string | null;
  hourSaturday?: string | null;
  hourSunday?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  workShift: number;
  valuesofWeek?: string | null;
  baseLatitude?: string | null;
  baseLongitude?: string | null;
  coverageRadiusKm: number;
  chefId: number;
  id: number;
  status: boolean;
  createdById?: string | null;
  createdAt?: string | null;
}

export interface AvailabilityListResponse {
  data: AvailabilityData[];
  success: boolean;
  errorMessage: string | null;
}

export interface AvailabilityRequestDto {
  dayOfTheWeek: number;
  isWorking: number;
  name: string;
  description: string;
  hourMonday?: string | null;
  hourTuesday?: string | null;
  hourWednesday?: string | null;
  hourThursday?: string | null;
  hourFriday?: string | null;
  hourSaturday?: string | null;
  hourSunday?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  workShift: number;
  valuesofWeek?: string | null;
  baseLatitude?: string | null;
  baseLongitude?: string | null;
  coverageRadiusKm: number;
  chefId: number;
  id?: number;
  status: boolean;
  createdById?: string | null;
  createdAt?: string | null;
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
