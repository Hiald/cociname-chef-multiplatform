import { API_CONFIG, GEO_CONFIG } from '../config';
import { getPeruDateTimeFilters } from '../utils/peruDate';

// ── Geografía multi-país (ver specs/geography.yaml) ─────────────────────────
export interface GeoDivisionDto {
  id: number;
  countryId: number;
  parentId: number | null;
  level: number;       // 1..3 (3 = Distrito PE / Comuna CL)
  name: string;
  status: boolean;
}

export interface CountryDto {
  id: number;
  isoCode: string;
  name: string;
  phonePrefix: string;
  currencyCode: string;
  currencySymbol: string;
  timeZoneId: string;
  level1Label: string;
  level2Label: string;
  level3Label: string;
  status: boolean;
}
import {
  BaseResponseGeneric,
  LoginRequestDto,
  LoginChefResponseDto,
  RegisterRequestDto,
  RegisterChefResponseDto,
  ListReservationChefResponse,
  GetPendingReservationParams,
  PendingReservationResponse,
  ChefResponse,
  ReservationDetailResponse,
  ReservationRecipeResponse,
  IngredientResponse,
  MasterRecipeResponse,
  SuscriptionResponse,
  ReservationSuscriptionResponse,
  IngredientChecklistResponse,
  IngredientData,
  ReservationSuscriptionData,
  SuscriptionData,
  ChefReservationResponse,
  GetPendingEventReservationParams,
  ReservationEventResponse,
  ReservationEventData,
  AppPendingReservationResponse,
  AppPendingReservationData,
  ReservationAssignmentRequestDto,
  MarkStartRequest,
  MarkEndRequest,
  AvailabilityListResponse,
  GetAvailabilityByWeekAndDateParams,
  AvailabilityRequestDto,
  ChefData,
  ChefRatingData,
  ChefDocumentationData,
  MenuData,
  MasterRecipeData,
  RecipeFeedbackData,
  PendingReceipt,
  ChefReceiptData
} from '../types';

const AUTH_EXPIRED_EVENT = 'auth:expired';

// ═══════════════════════════════════════════════════════════════
// Servicio API REST para Cociname
// ═══════════════════════════════════════════════════════════════

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  private notifyAuthExpired() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
  }

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    try {
      this.token = localStorage.getItem('auth_token');
    } catch (error) {
      this.token = null;
    }
  }

  /**
   * Obtiene el token actual desde localStorage (evita desincronización)
   */
  private getToken(): string | null {
    try {
      return localStorage.getItem('auth_token') || this.token;
    } catch (error) {
      return this.token;
    }
  }

  /**
   * Guarda el token de autenticación
   */
  setToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  /**
   * Limpia el token (logout)
   */
  clearToken() {
    this.token = null;
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  /**
   * Método genérico para hacer peticiones HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BaseResponseGeneric<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Multi-país: fallback de x-country-resolution (el claim del JWT manda
      // cuando existe; este header cubre los flujos previos al login).
      'X-Country-Id': String(GEO_CONFIG.COUNTRY_ID),
      ...(options.headers as Record<string, string>),
    };

    // Agregar token si existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Verificar si la respuesta tiene contenido antes de parsear JSON
      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType && contentType.includes('application/json');
      
      // Para errores 401 o 403, manejar respuestas vacías
      if (!response.ok && (response.status === 401 || response.status === 403)) {
        let errorMessage = '';
        
        if (response.status === 401) {
          errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
          this.notifyAuthExpired();
        } else if (response.status === 403) {
          errorMessage = 'No tienes permisos para realizar esta acción.';
        }
        
        // Intentar obtener más detalles si hay JSON
        if (hasJsonContent) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.errorMessage || errorMessage;
          } catch (e) {
            // Si falla el parseo, usar el mensaje por defecto
          }
        }
        
        return {
          success: false,
          errorMessage,
          data: null,
        };
      }

      const data = await response.json();

      if (!response.ok) {
        const validationErrors = data?.errors
          ? Object.entries(data.errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ')
          : '';
        return {
          success: false,
          errorMessage: data.errorMessage || validationErrors || data.title || `Error: ${response.status}`,
          data: null,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
        data: null,
      };
    }
  }

  /**
   * Método para peticiones públicas (sin autenticación)
   */
  private async publicRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BaseResponseGeneric<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Multi-país: en peticiones anónimas el header es la única fuente del país
      'X-Country-Id': String(GEO_CONFIG.COUNTRY_ID),
      ...(options.headers as Record<string, string>),
    };

    // NO agregar Authorization header para peticiones públicas

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        let errorData = null;
        
        if (hasJsonContent) {
          try {
            errorData = await response.json();
            errorMessage = errorData.errorMessage || errorMessage;
            console.error(`Public request error (${response.status}):`, errorData);
          } catch (e) {
            console.error(`Public request error (${response.status}): Could not parse JSON`);
          }
        }
        
        return {
          success: false,
          errorMessage,
          data: null,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Public request exception:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
        data: null,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/users/LoginChef
   * Login para cocineros
   */
  async loginChef(
    username: string,
    password: string
  ): Promise<BaseResponseGeneric<LoginChefResponseDto>> {
    const request: LoginRequestDto = { username, password };

    const result = await this.request<LoginChefResponseDto>('users/LoginChef', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    // Si el login es exitoso, guarda el token
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  /**
   * POST /api/users/login-google
   * Login/Register con Google para chef enviando idToken + role
   */
  async loginGoogleChef(
    idToken: string
  ): Promise<BaseResponseGeneric<LoginChefResponseDto>> {
    const role = 'Chef';
    const result = await this.publicRequest<LoginChefResponseDto>('users/login-google', {
      method: 'POST',
      body: JSON.stringify({ idToken, role }),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  /**
   * POST /api/users/RegisterChef
   * Registro de cocineros
   */
  async registerChef(
    request: RegisterRequestDto
  ): Promise<BaseResponseGeneric<RegisterChefResponseDto>> {
    return this.request<RegisterChefResponseDto>('users/RegisterChef', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * GET /api/geodivision — catálogo geográfico público (multi-país).
   * level 3 = Distritos (PE) / Comunas (CL) del país del despliegue.
   * Ver specs/geography.yaml.
   */
  async getGeoDivisions(
    level: number = 3,
    parentId: number = 0
  ): Promise<BaseResponseGeneric<GeoDivisionDto[]>> {
    return this.publicRequest<GeoDivisionDto[]>(
      `geodivision?countryId=${GEO_CONFIG.COUNTRY_ID}&level=${level}&parentId=${parentId}`,
      { method: 'GET' }
    );
  }

  /**
   * GET /api/country — países activos (multi-país, público).
   */
  async getCountries(): Promise<BaseResponseGeneric<CountryDto[]>> {
    return this.publicRequest<CountryDto[]>('country', { method: 'GET' });
  }

  /**
   * POST /api/users/send-onboarding-code
   * Envía código de 6 dígitos al correo para onboarding de chef
   */
  async sendOnboardingChefCode(
    tokenLink: string,
    nuevoCorreo: string
  ): Promise<BaseResponseGeneric<any>> {
    const requestBody = {
      tokenLink,
      nuevoCorreo,
    };

    console.log('Calling sendOnboardingChefCode:', requestBody);

    return this.publicRequest<any>('users/send-onboarding-chef-code', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * POST /api/users/complete-chef-onboarding
   * Completa el onboarding del chef con código de verificación y contraseña
   */
  async completeChefOnboarding(
    tokenLink: string,
    codigo6Digitos: string,
    nuevaPassword: string
  ): Promise<BaseResponseGeneric<any>> {
    const requestBody = {
      tokenLink,
      codigo6Digitos,
      nuevaPassword,
    };

    console.log('Calling completeChefOnboarding:', { tokenLink, codigo6Digitos, nuevaPassword: '***' });

    return this.publicRequest<any>('users/complete-chef-onboarding', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * POST /api/users/complete-onboarding-chefapp
   * Completa el onboarding del chef desde la app con código de verificación
   */
  async completeOnboardingChefApp(
    email: string,
    code: string
  ): Promise<BaseResponseGeneric<any>> {
    const requestBody = {
      email,
      code,
    };

    console.log('Calling completeOnboardingChefApp:', requestBody);

    return this.publicRequest<any>('users/complete-onboarding-chefapp', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // RESERVAS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/Reservation/ListReservationByChefId?ChefId={chefId}
   * Lista todas las reservas de un chef
   */
  async listReservationByChefId(
    chefId: number
  ): Promise<ListReservationChefResponse> {
    const endpoint = `Reservation/ListReservationByChefId?ChefId=${chefId}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ListReservationChefResponse = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/Reservation/ListReservationById?id={reservationId}
   * Obtiene el detalle de una reserva específica
   */
  async getReservationById(
    reservationId: number
  ): Promise<ReservationDetailResponse> {
    const endpoint = `Reservation/ListReservationById?id=${reservationId}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ReservationDetailResponse = await response.json();

      if (!response.ok) {
        return {
          data: {} as any,
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        data: {} as any,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET public reservation by id (no authentication)
   * Some public flows provide an encrypted token and must fetch reservation
   * details without requiring the user's bearer token.
   */
  async publicGetReservationById(
    reservationId: number
  ): Promise<any> {
    const endpoint = `Reservation/ListReservationById?id=${reservationId}`;
    return this.publicRequest<any>(endpoint);
  }

  /**
   * GET public reservation by link token endpoint (legacy, uses integer ID)
   * Endpoint: Reservation/ListReservationByLink?id={entityId}
   * @deprecated Use publicGetReservationByToken instead
   */
  async publicGetReservationByLink(
    entityId: number
  ): Promise<any> {
    const endpoint = `Reservation/ListReservationByLink?id=${entityId}`;
    return this.publicRequest<any>(endpoint);
  }

  /**
   * GET public reservation by GUID token — no expone IDs enteros en la red
   * Endpoint: CustomerApp/AppReservation/ByToken/{token}
   */
  async publicGetReservationByToken(
    token: string
  ): Promise<any> {
    const endpoint = `CustomerApp/AppReservation/ByToken/${token}`;
    return this.publicRequest<any>(endpoint);
  }

  /**
   * GET public subscription reservation by link token endpoint (legacy)
   * Endpoint: reservationSuscription/ListReservationSuscriptionByIdLink?id={entityId}
   * @deprecated Use publicGetReservationSuscriptionByToken instead
   */
  async publicGetReservationSuscriptionByLink(
    entityId: number
  ): Promise<any> {
    const endpoint = `reservationSuscription/ListReservationSuscriptionByIdLink?id=${entityId}`;
    return this.publicRequest<any>(endpoint);
  }

  /**
   * GET /api/FichaPublica/resolve/{token}
   * Resuelve un GUID público al tipo de reserva e ID numérico
   */
  async resolvePublicLink(token: string): Promise<BaseResponseGeneric<{ tipoReserva: number; reservaId: number }>> {
    return this.publicRequest<{ tipoReserva: number; reservaId: number }>(`FichaPublica/resolve/${token}`);
  }

  /**
   * GET /api/AppReservationDiet/ListReservationDietByLink?id={id}
   */
  async publicGetReservationDietByLink(entityId: number): Promise<BaseResponseGeneric<AppPendingReservationData>> {
    return this.publicRequest<AppPendingReservationData>(`AppReservationDiet/ListReservationDietByLink?id=${entityId}`);
  }

  /**
   * GET /api/AppReservationServiceTask/ListReservationTaskByLink?id={id}
   */
  async publicGetReservationServiceTaskByLink(entityId: number): Promise<BaseResponseGeneric<AppPendingReservationData>> {
    return this.publicRequest<AppPendingReservationData>(`AppReservationServiceTask/ListReservationTaskByLink?id=${entityId}`);
  }

  /**
   * PUT /api/reservationDiet/UpdateClientCommentary
   */
  async updateReservationDietClientCommentary(id: number, comments: string): Promise<BaseResponseGeneric<any>> {
    const query = new URLSearchParams({
      id: String(id),
      comments,
    });
    return this.publicRequest<any>(`reservationDiet/UpdateClientCommentary?${query.toString()}`, {
      method: 'PUT',
    });
  }

  /**
   * PUT /api/AppReservationServiceTask/UpdateClientCommentary
   */
  async updateReservationServiceTaskClientCommentary(id: number, comments: string): Promise<BaseResponseGeneric<any>> {
    const query = new URLSearchParams({
      id: String(id),
      comments,
    });
    return this.publicRequest<any>(`AppReservationServiceTask/UpdateClientCommentary?${query.toString()}`, {
      method: 'PUT',
    });
  }

  /**
   * GET public subscription by GUID token — no expone IDs enteros en la red
   * Endpoint: AppReservationSuscription/ByToken/{token}
   */
  async publicGetReservationSuscriptionByToken(
    token: string
  ): Promise<any> {
    const endpoint = `AppReservationSuscription/ByToken/${token}`;
    return this.publicRequest<any>(endpoint);
  }

  /**
   * GET public event reservation by link (legacy)
   * Endpoint: reservationEvent/Link/{id}
   * @deprecated Use publicGetReservationEventByToken instead
   */
  async publicGetReservationEventByLink(
    entityId: number
  ): Promise<any> {
    const endpoint = `reservationEvent/Link/${entityId}`;
    return this.publicRequest<any>(endpoint);
  }

  /**
   * GET public event by GUID token — no expone IDs enteros en la red
   * Endpoint: AppReservationEvent/ByToken/{token}
   */
  async publicGetReservationEventByToken(
    token: string
  ): Promise<any> {
    const endpoint = `AppReservationEvent/ByToken/${token}`;
    return this.publicRequest<any>(endpoint);
  }

  /**
   * GET /api/Reservation/GetPendingReservation
   * Obtiene las reservas pendientes con filtros opcionales
   */
  async getPendingReservations(
    params?: GetPendingReservationParams
  ): Promise<PendingReservationResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.dateFilter) {
      queryParams.append('dateFilter', params.dateFilter);
    }
    if (params?.timeFilter) {
      queryParams.append('timeFilter', params.timeFilter);
    }
    if (params?.Page !== undefined) {
      queryParams.append('Page', params.Page.toString());
    }
    if (params?.RecordsPerPage !== undefined) {
      queryParams.append('RecordsPerPage', params.RecordsPerPage.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `Reservation/GetPendingReservation${queryString ? `?${queryString}` : ''}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: PendingReservationResponse = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/reservationSuscription/GetPendingReservationSuscription
   * Obtiene las reservas de suscripción pendientes con filtros opcionales
   */
  async getPendingReservationSuscription(
    params?: GetPendingReservationParams
  ): Promise<PendingReservationResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.dateFilter) {
      queryParams.append('dateFilter', params.dateFilter);
    }
    if (params?.timeFilter) {
      queryParams.append('timeFilter', params.timeFilter);
    }
    if (params?.Page !== undefined) {
      queryParams.append('Page', params.Page.toString());
    }
    if (params?.RecordsPerPage !== undefined) {
      queryParams.append('RecordsPerPage', params.RecordsPerPage.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `reservationSuscription/GetPendingReservationSuscription${queryString ? `?${queryString}` : ''}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Country-Id': String(GEO_CONFIG.COUNTRY_ID),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: PendingReservationResponse = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/AppReservationEvent/GetPendingReservationEvent
   * Obtiene eventos pendientes con filtros opcionales
   */
  async getPendingEventReservation(
    params?: GetPendingEventReservationParams
  ): Promise<ReservationEventResponse> {
    return this.getAppPendingReservations('AppReservationEvent/GetPendingReservationEvent', params);
  }

  private async getAppPendingReservations(
    path: string,
    params?: GetPendingReservationParams
  ): Promise<AppPendingReservationResponse> {
    const queryParams = new URLSearchParams();

    if (params?.dateFilter) {
      queryParams.append('dateFilter', params.dateFilter);
    }
    if (params?.timeFilter) {
      queryParams.append('timeFilter', params.timeFilter);
    }
    if (params?.Page !== undefined) {
      queryParams.append('Page', params.Page.toString());
    }
    if (params?.RecordsPerPage !== undefined) {
      queryParams.append('RecordsPerPage', params.RecordsPerPage.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `${path}${queryString ? `?${queryString}` : ''}`;
    const result = await this.request<AppPendingReservationData[]>(endpoint);

    if (!result.success) {
      if (result.errorMessage?.toLowerCase().includes('permisos')) {
        console.warn(
          `[API] 403 en ${path}: el backend debe autorizar el rol Chef en este controlador (igual que AppReservationEvent).`
        );
      }

      return {
        data: [],
        success: false,
        errorMessage: result.errorMessage ?? null,
      };
    }

    const payload = result as unknown as AppPendingReservationResponse;

    return {
      data: Array.isArray(payload.data) ? payload.data : [],
      success: payload.success ?? true,
      errorMessage: payload.errorMessage ?? null,
    };
  }

  /**
   * GET /api/AppReservationDiet/GetPendingReservationDiet
   */
  async getPendingReservationDiet(
    params?: GetPendingReservationParams
  ): Promise<AppPendingReservationResponse> {
    return this.getAppPendingReservations('AppReservationDiet/GetPendingReservationDiet', params);
  }

  /**
   * GET /api/AppReservationServiceTask/GetPendingReservationServiceTask
   */
  async getPendingReservationServiceTask(
    params?: GetPendingReservationParams
  ): Promise<AppPendingReservationResponse> {
    return this.getAppPendingReservations('AppReservationServiceTask/GetPendingReservationServiceTask', params);
  }

  /**
   * GET /api/reservationEvent/Chef/{chefId}
   * Obtiene eventos asignados a una chef con paginación
   */
  async getReservationEventsByChefId(
    chefId: number,
    page = 1,
    recordsPerPage = 10
  ): Promise<ReservationEventResponse> {
    const endpoint = `reservationEvent/Chef/${chefId}?Page=${page}&RecordsPerPage=${recordsPerPage}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ReservationEventResponse = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/reservationEvent/{id}
   * Obtiene el detalle de un evento específico
   */
  async getReservationEventById(
    eventId: number
  ): Promise<BaseResponseGeneric<ReservationEventData>> {
    const endpoint = `reservationEvent/${eventId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: BaseResponseGeneric<ReservationEventData> | null = null;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('getReservationEventById: failed to parse JSON response', parseError);
      }

      if (!response.ok) {
        console.error('getReservationEventById: response error', { status: response.status, body: data });
        return {
          data: null,
          success: false,
          errorMessage: (data && (data as any).errorMessage) || `Error: ${response.status}`,
        };
      }

      console.log('getReservationEventById: success', { data });
      return data as BaseResponseGeneric<ReservationEventData>;
    } catch (error) {
      console.error('getReservationEventById: exception', error);
      return {
        data: null,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/reservationMasterRecipe/ReservationMasterRecipeSearchId?ReservationId={reservationId}
   * Obtiene las recetas/platos de una reserva
   */
  async getReservationRecipes(
    reservationId: number
  ): Promise<ReservationRecipeResponse> {
    const endpoint = `reservationMasterRecipe/ReservationMasterRecipeSearchId?ReservationId=${reservationId}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ReservationRecipeResponse = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/reservationMasterRecipe/ReservationMasterRecipeSearchId?ReservationSuscriptionId={reservationSuscriptionId}
   * Obtiene las recetas/platos de una reserva de suscripción
   */
  async getReservationSuscriptionRecipes(
    reservationSuscriptionId: number
  ): Promise<ReservationRecipeResponse> {
    const endpoint = `reservationMasterRecipe/ReservationMasterRecipeSearchId?ReservationSuscriptionId=${reservationSuscriptionId}`;
    
    console.log('Calling getReservationSuscriptionRecipes:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ReservationRecipeResponse = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/ingredient/IngredientByMasterRecipeId?search={masterRecipeId}
   * Obtiene los ingredientes de una receta
   */
  async getIngredientsByRecipeId(
    masterRecipeId: number,
    page: number = 1,
    recordsPerPage: number = 20
  ): Promise<IngredientResponse> {
    const endpoint = `ingredient/IngredientByMasterRecipeId?search=${masterRecipeId}&Page=${page}&RecordsPerPage=${recordsPerPage}`;
    
    console.log('Calling ingredients API:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Ingredients API response status:', response.status);

      const data: IngredientResponse = await response.json();
      
      console.log('Ingredients API response data:', data);

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('Ingredients API error:', error);
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/ingredient/{id}
   * Obtiene los detalles de un ingrediente por ID
   */
  async getIngredientById(
    ingredientId: number
  ): Promise<BaseResponseGeneric<IngredientData>> {
    const endpoint = `ingredient/${ingredientId}`;
    
    console.log('Calling getIngredientById:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('getIngredientById error:', error);
      return {
        data: null,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHEF
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/Chef/{id}
   * Obtiene los datos de un chef por ID
   */
  async getChef(chefId: number): Promise<ChefResponse> {
    const endpoint = `Chef/${chefId}`;
    const result = await this.request<ChefData>(endpoint, {
      method: 'GET',
    });

    return {
      data: (result.data ?? {}) as ChefData,
      success: result.success,
      errorMessage: result.errorMessage ?? null,
    };
  }

  /**
   * GET /api/chefRating/chef/{chefId}
   * Reseñas recibidas por una cocinera (las que dejan los clientes en el
   * catálogo público de la webapp). Paginado; el API no filtra por Status,
   * así que las borradas se descartan en la pantalla.
   */
  async getChefRatings(
    chefId: number,
    page: number = 1,
    recordsPerPage: number = 100
  ): Promise<BaseResponseGeneric<ChefRatingData[]>> {
    return this.request<ChefRatingData[]>(
      `chefRating/chef/${chefId}?Page=${page}&RecordsPerPage=${recordsPerPage}`,
      { method: 'GET' }
    );
  }

  /**
   * GET /api/chefRating/chef/{chefId}/average
   * Promedio oficial de la cocinera (el API sí filtra las reseñas borradas).
   */
  async getChefRatingAverage(chefId: number): Promise<BaseResponseGeneric<number>> {
    return this.request<number>(`chefRating/chef/${chefId}/average`, {
      method: 'GET',
    });
  }

  /**
   * POST /api/chefDocumentation/UploadMyDocument — multipart.
   * El ChefId lo resuelve el API desde el token, por eso no se envía en el form.
   * No se fija Content-Type a propósito: el navegador debe generar el boundary.
   */
  async uploadChefDocument(params: {
    file: File;
    documentType: number;
    commentsChef?: string;
    dateStart?: string;
    dateEnd?: string;
  }): Promise<BaseResponseGeneric<number>> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('documentType', String(params.documentType));
    if (params.commentsChef) formData.append('commentsChef', params.commentsChef);
    if (params.dateStart) formData.append('dateStart', params.dateStart);
    if (params.dateEnd) formData.append('dateEnd', params.dateEnd);

    const token = this.getToken();
    const headers: Record<string, string> = {
      'X-Country-Id': String(GEO_CONFIG.COUNTRY_ID),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${this.baseUrl}chefDocumentation/UploadMyDocument`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      const data = contentType && contentType.includes('application/json')
        ? await response.json()
        : null;

      if (!response.ok) {
        if (response.status === 401) this.notifyAuthExpired();
        return {
          success: false,
          errorMessage: data?.errorMessage
            || (response.status === 401 ? 'Sesión expirada. Por favor inicia sesión nuevamente.' : null)
            || (response.status === 403 ? 'No tienes permisos para subir documentos.' : null)
            || `Error: ${response.status}`,
          data: null,
        } as BaseResponseGeneric<number>;
      }

      return data as BaseResponseGeneric<number>;
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
        data: null,
      } as BaseResponseGeneric<number>;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RECIBOS POR HONORARIOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/chefReceipt/pending — servicios terminados sin recibo.
   * El API filtra por la fecha de corte (Receipts:StartDate).
   */
  async getPendingReceipts(): Promise<BaseResponseGeneric<PendingReceipt[]>> {
    return this.request<PendingReceipt[]>('chefReceipt/pending', { method: 'GET' });
  }

  /** GET /api/chefReceipt/mine — recibos ya enviados y su estado. */
  async getMyReceipts(
    page: number = 1,
    recordsPerPage: number = 50
  ): Promise<BaseResponseGeneric<ChefReceiptData[]>> {
    return this.request<ChefReceiptData[]>(
      `chefReceipt/mine?Page=${page}&RecordsPerPage=${recordsPerPage}`,
      { method: 'GET' }
    );
  }

  /**
   * POST /api/chefReceipt/upload — multipart.
   * No se fija Content-Type a propósito: el navegador debe poner el boundary.
   */
  async uploadReceipt(params: {
    file: File;
    serviceType: number;
    serviceId: number;
    receiptNumber: string;
    commentsChef?: string;
  }): Promise<BaseResponseGeneric<number>> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('serviceType', String(params.serviceType));
    formData.append('serviceId', String(params.serviceId));
    formData.append('receiptNumber', params.receiptNumber);
    if (params.commentsChef) formData.append('commentsChef', params.commentsChef);

    const token = this.getToken();
    const headers: Record<string, string> = {
      'X-Country-Id': String(GEO_CONFIG.COUNTRY_ID),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${this.baseUrl}chefReceipt/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      const data = contentType && contentType.includes('application/json')
        ? await response.json()
        : null;

      if (!response.ok) {
        if (response.status === 401) this.notifyAuthExpired();
        return {
          success: false,
          errorMessage: data?.errorMessage
            || (response.status === 401 ? 'Sesión expirada. Por favor inicia sesión nuevamente.' : null)
            || (response.status === 403 ? 'No tienes permisos para subir recibos.' : null)
            || `Error: ${response.status}`,
          data: null,
        } as BaseResponseGeneric<number>;
      }

      return data as BaseResponseGeneric<number>;
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
        data: null,
      } as BaseResponseGeneric<number>;
    }
  }

  /**
   * GET /api/reservationDiet/ByChef/{chefId}
   * Planes dietéticos ASIGNADOS a la cocinera. Sin esto, una dieta desaparecía
   * de su app apenas se le asignaba: solo se listaban las pendientes.
   * Ojo: usa StatusDiet (0..5), no StatusReservation.
   */
  async getDietsByChefId(
    chefId: number,
    page: number = 1,
    recordsPerPage: number = 100
  ): Promise<BaseResponseGeneric<any[]>> {
    const result = await this.request<any[]>(
      `reservationDiet/ByChef/${chefId}?Page=${page}&RecordsPerPage=${recordsPerPage}`,
      { method: 'GET' }
    );

    if (!result.success) {
      return {
        data: [],
        success: false,
        errorMessage: result.errorMessage ?? undefined,
      };
    }

    const payload = result.data as unknown;
    const rows = Array.isArray(payload)
      ? payload
      : (Array.isArray((payload as any)?.data)
        ? (payload as any).data
        : (Array.isArray((payload as any)?.items) ? (payload as any).items : []));

    return {
      data: rows,
      success: true,
      errorMessage: result.errorMessage ?? undefined,
    };
  }

  /**
   * GET /api/reservationServiceTask/Chef/{chefId}
   * Tareas ASIGNADAS a la cocinera. Mismo bug que las dietas: antes solo se
   * pedían las pendientes, así que al asignarle una tarea desaparecía de su app.
   * A diferencia de las dietas, sí usa StatusReservation (0..10).
   */
  async getServiceTasksByChefId(
    chefId: number,
    page: number = 1,
    recordsPerPage: number = 100
  ): Promise<BaseResponseGeneric<any[]>> {
    const result = await this.request<any[]>(
      `reservationServiceTask/Chef/${chefId}?Page=${page}&RecordsPerPage=${recordsPerPage}`,
      { method: 'GET' }
    );

    if (!result.success) {
      return {
        data: [],
        success: false,
        errorMessage: result.errorMessage ?? undefined,
      };
    }

    const payload = result.data as unknown;
    const rows = Array.isArray(payload)
      ? payload
      : (Array.isArray((payload as any)?.data)
        ? (payload as any).data
        : (Array.isArray((payload as any)?.items) ? (payload as any).items : []));

    return {
      data: rows,
      success: true,
      errorMessage: result.errorMessage ?? undefined,
    };
  }

  /**
   * GET /api/chefDocumentation/filterbyChef
   * Documentos de la cocinera (antecedentes, sanidad, CV, DNI) con su estado.
   * El endpoint solo exige estar autenticado, sin filtro de rol.
   */
  async getChefDocumentation(
    chefId: number,
    page: number = 1,
    recordsPerPage: number = 50
  ): Promise<BaseResponseGeneric<ChefDocumentationData[]>> {
    return this.request<ChefDocumentationData[]>(
      `chefDocumentation/filterbyChef?ChefId=${chefId}&Page=${page}&RecordsPerPage=${recordsPerPage}`,
      { method: 'GET' }
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // CATÁLOGO DE PLATOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/menu/GetbyFilters — catálogo de platos.
   * El query filter global de Menu ya restringe a BusinessLine=1 y al país
   * del despliegue, así que no hace falta filtrar eso aquí.
   */
  async getMenuCatalog(params: {
    name?: string;
    typeFood?: number;
    proteins?: string;
    origin?: number;
    page?: number;
    recordsPerPage?: number;
  } = {}): Promise<BaseResponseGeneric<MenuData[]>> {
    const query = new URLSearchParams();
    if (params.name) query.set('Name', params.name);
    if (params.typeFood) query.set('typeFood', String(params.typeFood));
    if (params.proteins) query.set('proteins', params.proteins);
    if (params.origin) query.set('origin', String(params.origin));
    query.set('Page', String(params.page ?? 1));
    query.set('RecordsPerPage', String(params.recordsPerPage ?? 200));

    return this.request<MenuData[]>(`menu/GetbyFilters?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * GET /api/masterRecipe/ListMasterRecipeByMenuId — versiones de un plato.
   */
  async getMasterRecipesByMenuId(
    menuId: number,
    page: number = 1,
    recordsPerPage: number = 50
  ): Promise<BaseResponseGeneric<MasterRecipeData[]>> {
    return this.request<MasterRecipeData[]>(
      `masterRecipe/ListMasterRecipeByMenuId?MenuId=${menuId}&Page=${page}&RecordsPerPage=${recordsPerPage}`,
      { method: 'GET' }
    );
  }

  /**
   * POST /api/recipeFeedback — la cocinera reporta una corrección de receta.
   * El ChefId lo resuelve el API desde el token.
   */
  async sendRecipeFeedback(params: {
    masterRecipeId: number;
    menuId: number;
    reasonType: number;
    comment: string;
  }): Promise<BaseResponseGeneric<RecipeFeedbackData>> {
    return this.request<RecipeFeedbackData>('recipeFeedback', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // AQUÍ AGREGAREMOS MÁS MÉTODOS PARA RECETAS, INGREDIENTES, ETC.
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/masterRecipe/{id}
   * Obtiene el detalle de una receta maestra por ID
   */
  async getMasterRecipeById(id: number): Promise<MasterRecipeResponse> {
    console.log(`Calling getMasterRecipeById with id: ${id}`);
    const response = await this.request<MasterRecipeResponse['data']>(
      `masterRecipe/${id}`,
      { method: 'GET' }
    );
    console.log('getMasterRecipeById response:', response);
    return response as MasterRecipeResponse;
  }

  // ═══════════════════════════════════════════════════════════════
  // SUSCRIPCIONES
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/suscription/ListSuscriptionById?id={id}&Page={page}&RecordsPerPage={records}
   * Obtiene los datos de una suscripción por ID
   */
  async getSuscriptionById(
    id: number,
    page: number = 1,
    recordsPerPage: number = 1
  ): Promise<SuscriptionResponse> {
    const endpoint = `suscription/ListSuscriptionById?id=${id}&Page=${page}&RecordsPerPage=${recordsPerPage}`;
    
    console.log('Calling getSuscriptionById:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('getSuscriptionById response status:', response.status);

      const data: SuscriptionResponse = await response.json();

      if (!response.ok) {
        return {
          data: {} as any,
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('getSuscriptionById error:', error);
      return {
        data: {} as any,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/suscription/ListSuscriptionByChefId?ChefId={chefId}
   * Obtiene las suscripciones de un chef
   */
  async getSuscriptionsByChefId(
    chefId: number
  ): Promise<{ data: SuscriptionData[]; success: boolean; errorMessage: string | null }> {
    const endpoint = `suscription/ListSuscriptionByChefId?ChefId=${chefId}`;
    
    console.log('Calling getSuscriptionsByChefId:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('getSuscriptionsByClientId response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('getSuscriptionsByClientId error:', error);
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/reservationSuscription/ListReservationSuscriptionByChefId?ChefId={chefId}
   * Visitas de suscripción asignadas a la cocinera.
   * Sin esto las suscripciones no aparecían en "Mis reservas" confirmadas.
   */
  async listReservationSuscriptionByChefId(
    chefId: number
  ): Promise<{ data: ReservationSuscriptionData[]; success: boolean; errorMessage: string | null }> {
    const endpoint = `reservationSuscription/ListReservationSuscriptionByChefId?ChefId=${chefId}`;
    console.log('Calling listReservationSuscriptionByChefId:', endpoint);

    const result = await this.request<ReservationSuscriptionData[]>(endpoint);

    if (!result.success) {
      return {
        data: [],
        success: false,
        errorMessage: result.errorMessage ?? null,
      };
    }

    const payload = result as unknown as {
      data: ReservationSuscriptionData[] | null;
      success: boolean;
      errorMessage: string | null;
    };

    return {
      data: Array.isArray(payload.data) ? payload.data : [],
      success: true,
      errorMessage: payload.errorMessage ?? null,
    };
  }

  /**
   * GET /api/reservationSuscription/ListReservationSuscriptionById?id={id}
   * Obtiene el detalle de una reserva de suscripción por ID
   */
  async getReservationSuscriptionById(
    id: number
  ): Promise<ReservationSuscriptionResponse> {
    const endpoint = `reservationSuscription/ListReservationSuscriptionById?id=${id}`;
    
    console.log('Calling getReservationSuscriptionById:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Country-Id': String(GEO_CONFIG.COUNTRY_ID),
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('getReservationSuscriptionById response status:', response.status);

      const rawBody = await response.text();
      let data: ReservationSuscriptionResponse = {
        data: {} as any,
        success: false,
        errorMessage: null,
      };

      if (rawBody) {
        try {
          data = JSON.parse(rawBody) as ReservationSuscriptionResponse;
        } catch (parseError) {
          console.error('getReservationSuscriptionById parse error:', parseError, rawBody);
        }
      }

      if (!response.ok) {
        return {
          data: {} as any,
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('getReservationSuscriptionById error:', error);
      return {
        data: {} as any,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/reservationSuscription/ListReservationSuscrBySuscriptionId?SuscriptionId={id}
   * Obtiene las reservas hijas de una suscripción
   */
  async getReservationsBySuscriptionId(
    suscriptionId: number
  ): Promise<{ data: ReservationSuscriptionData[]; success: boolean; errorMessage: string | null }> {
    const endpoint = `reservationSuscription/ListReservationSuscrBySuscriptionId?SuscriptionId=${suscriptionId}`;
    
    console.log('Calling getReservationsBySuscriptionId:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('getReservationsBySuscriptionId response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('getReservationsBySuscriptionId error:', error);
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/reservationIngredientChecklist/filterbyReservation
   * Obtiene la lista de ingredientes para una reserva
   */
  async getIngredientChecklistByReservation(
    idReservation: number,
    page: number = 1,
    recordsPerPage: number = 100
  ): Promise<IngredientChecklistResponse> {
    const endpoint = `reservationIngredientChecklist/filterbyReservation?IdReservation=${idReservation}&Page=${page}&RecordsPerPage=${recordsPerPage}`;
    
    console.log('Calling getIngredientChecklistByReservation:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          errorMessage: data.errorMessage || `HTTP error! status: ${response.status}`,
          data: [],
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching ingredient checklist by reservation:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      };
    }
  }

  /**
   * GET /api/reservationIngredientChecklist/filterbyReservationSuscription
   * Obtiene la lista de ingredientes para una reserva de suscripción
   */
  async getIngredientChecklistByReservationSuscription(
    idReservationSuscription: number,
    page: number = 1,
    recordsPerPage: number = 100
  ): Promise<IngredientChecklistResponse> {
    const endpoint = `reservationIngredientChecklist/filterbyReservationSuscription?IdReservationSuscription=${idReservationSuscription}&Page=${page}&RecordsPerPage=${recordsPerPage}`;
    
    console.log('Calling getIngredientChecklistByReservationSuscription:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          errorMessage: data.errorMessage || `HTTP error! status: ${response.status}`,
          data: [],
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching ingredient checklist by reservation suscription:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DISPONIBILIDAD
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/Availability/GetAvailabilityByWeekAndDateAsync
   * Obtiene disponibilidad semanal por chef y semana del anio
   */
  async getAvailabilityByWeekAndDate(
    params: GetAvailabilityByWeekAndDateParams
  ): Promise<AvailabilityListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('ChefId', params.ChefId.toString());
    queryParams.append('WorkShift', params.WorkShift.toString());
    queryParams.append('DateStart', params.DateStart);
    queryParams.append('DateEnd', params.DateEnd);
    queryParams.append('Page', String(params.Page ?? 1));
    queryParams.append('RecordsPerPage', String(params.RecordsPerPage ?? 10));

    const endpoint = `Availability/GetAvailabilityByWeekAndDateAsync?${queryParams.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: AvailabilityListResponse = await response.json();

      if (!response.ok) {
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * POST /api/Availability
   * Crea disponibilidad semanal
   */
  async createAvailability(
    request: AvailabilityRequestDto
  ): Promise<BaseResponseGeneric<any>> {
    return this.request<any>('Availability', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * PUT /api/Availability/{id}
   * Actualiza disponibilidad semanal existente
   */
  async updateAvailability(
    availabilityId: number,
    request: AvailabilityRequestDto
  ): Promise<BaseResponseGeneric<any>> {
    return this.request<any>(`Availability/${availabilityId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ASIGNACIÓN DE RESERVAS
  // ═══════════════════════════════════════════════════════════════

  /**
   * PUT /api/reservationAssignment/Reservation/{chefId}
   * Acepta o rechaza una reserva normal
   */
  async updateReservationAssignment(
    chefId: number,
    reservationId: number,
    assignmentStatus: number,
    rejectionReason?: string
  ): Promise<BaseResponseGeneric<any>> {
    const endpoint = `reservationAssignment/Reservation/${chefId}`;
    
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const timeString = now.toTimeString().split(' ')[0].substring(0, 5);

    const requestBody = {
      priority: 0,
      assignmentStatus,
      notifiedAt: dateString,
      hourNotifiedAt: timeString,
      responseAt: dateString,
      hourResponseAt: timeString,
      rejectionReason: rejectionReason || '',
      chefId,
      reservationId,
      suscriptionId: 0,
      reservationSuscriptionId: 0,
      status: true,
      createdById: chefId.toString(),
      createdAt: now.toISOString(),
    };

    console.log('Calling updateReservationAssignment:', endpoint, requestBody);

    return this.request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * PUT /api/reservationAssignment/ReservationSuscription/{chefId}
   * Acepta o rechaza una reserva de suscripción
   */
  async updateReservationSuscriptionAssignment(
    chefId: number,
    reservationSuscriptionId: number,
    suscriptionId: number,
    assignmentStatus: number,
    rejectionReason?: string
  ): Promise<BaseResponseGeneric<any>> {
    const endpoint = `reservationAssignment/ReservationSuscription/${chefId}`;
    const { dateFilter, timeFilter } = getPeruDateTimeFilters();

    // Mismo shape que Reservation/assignment (probado en app), adaptado a suscripción.
    const requestBody = {
      priority: 0,
      assignmentStatus,
      notifiedAt: dateFilter,
      hourNotifiedAt: timeFilter,
      responseAt: dateFilter,
      hourResponseAt: timeFilter,
      rejectionReason: rejectionReason || '',
      chefId,
      reservationId: 0,
      suscriptionId,
      reservationSuscriptionId,
      status: assignmentStatus === 1,
      createdById: String(chefId),
      createdAt: new Date().toISOString(),
    };

    console.log('Calling updateReservationSuscriptionAssignment:', endpoint, requestBody);

    return this.request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * PUT /api/reservationAssignment/ReservationEvent/{chefId}
   * Registra la asignación de un evento de reserva a una chef
   */
  async updateReservationEventAssignment(
    chefId: number,
    request: ReservationAssignmentRequestDto
  ): Promise<BaseResponseGeneric<any>> {
    return this.putReservationAssignment('ReservationEvent', chefId, request);
  }

  /**
   * PUT /api/reservationAssignment/ReservationDiet/{chefId}
   * Acepta o rechaza un plan nutricional
   */
  async updateReservationDietAssignment(
    chefId: number,
    request: ReservationAssignmentRequestDto
  ): Promise<BaseResponseGeneric<any>> {
    return this.putReservationAssignment('ReservationDiet', chefId, request);
  }

  /**
   * PUT /api/reservationAssignment/ReservationServiceTask/{chefId}
   * Acepta o rechaza una actividad de cocina
   */
  async updateReservationServiceTaskAssignment(
    chefId: number,
    request: ReservationAssignmentRequestDto
  ): Promise<BaseResponseGeneric<any>> {
    return this.putReservationAssignment('ReservationServiceTask', chefId, request);
  }

  private async putReservationAssignment(
    resourcePath: string,
    chefId: number,
    request: ReservationAssignmentRequestDto
  ): Promise<BaseResponseGeneric<any>> {
    const endpoint = `reservationAssignment/${resourcePath}/${chefId}`;

    const requestBody = {
      ...request,
      chefId,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Country-Id': String(GEO_CONFIG.COUNTRY_ID),
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: BaseResponseGeneric<any> | null = null;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error(`putReservationAssignment(${resourcePath}): failed to parse JSON response:`, text);
      }

      if (!response.ok) {
        console.error(`putReservationAssignment(${resourcePath}): response error`, { status: response.status, body: data });
        const validationErrors = data && (data as any).errors
          ? Object.entries((data as any).errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ')
          : '';
        return {
          data: null,
          success: false,
          errorMessage:
            (data && (data as any).errorMessage)
            || validationErrors
            || (data && (data as any).title)
            || `Error: ${response.status}`,
        };
      }

      return data as BaseResponseGeneric<any>;
    } catch (error) {
      console.error(`putReservationAssignment(${resourcePath}): exception`, error);
      return {
        data: null,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/AppReservationDiet/{id}
   */
  async getReservationDietById(
    reservationDietId: number
  ): Promise<BaseResponseGeneric<AppPendingReservationData>> {
    return this.request<AppPendingReservationData>(`AppReservationDiet/${reservationDietId}`);
  }

  /**
   * GET /api/AppReservationDiet/ListReservationDietByLink?id={id}
   */
  async getReservationDietByLink(
    reservationDietId: number
  ): Promise<BaseResponseGeneric<AppPendingReservationData>> {
    return this.request<AppPendingReservationData>(`AppReservationDiet/ListReservationDietByLink?id=${reservationDietId}`);
  }

  /**
   * GET /api/AppReservationServiceTask/{id}
   */
  async getReservationServiceTaskById(
    reservationServiceTaskId: number
  ): Promise<BaseResponseGeneric<AppPendingReservationData>> {
    return this.request<AppPendingReservationData>(`AppReservationServiceTask/${reservationServiceTaskId}`);
  }

  /**
   * GET /api/AppReservationServiceTask/ListReservationTaskByLink?id={id}
   */
  async getReservationServiceTaskByLink(
    reservationServiceTaskId: number
  ): Promise<BaseResponseGeneric<AppPendingReservationData>> {
    return this.request<AppPendingReservationData>(`AppReservationServiceTask/ListReservationTaskByLink?id=${reservationServiceTaskId}`);
  }

  /**
   * POST /api/reservationSuscription/AddSuscriptionForClientApp
   * Acepta una reserva de suscripción y la convierte en una suscripción activa
   */
  async addSuscriptionForClientApp(reservationData: any): Promise<BaseResponseGeneric<any>> {
    const endpoint = 'reservationSuscription/AddSuscriptionForClientApp';
    
    console.log('Calling addSuscriptionForClientApp:', endpoint, reservationData);

    return this.request<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // MARCACIONES DE CHEF
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/ChefReservation/ListChefReservationByReservId?ReservationId={reservationId}
   * Obtiene las marcaciones de una reserva independiente
   */
  async getChefReservationByReservationId(
    reservationId: number
  ): Promise<ChefReservationResponse> {
    const endpoint = `ChefReservation/ListChefReservationByReservId?ReservationId=${reservationId}`;
    
    console.log('Calling getChefReservationByReservationId:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ChefReservationResponse = await response.json();

      if (!response.ok) {
        console.error('getChefReservationByReservationId error:', response.status, data);
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('getChefReservationByReservationId exception:', error);
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * GET /api/ChefReservation/ListChefReservationByReservSuscrId?ReservationSuscriptionId={reservationSuscriptionId}
   * Obtiene las marcaciones de una reserva de suscripción
   */
  async getChefReservationByReservationSuscriptionId(
    reservationSuscriptionId: number
  ): Promise<ChefReservationResponse> {
    const endpoint = `ChefReservation/ListChefReservationByReservSuscrId?ReservationSuscriptionId=${reservationSuscriptionId}`;
    
    console.log('Calling getChefReservationByReservationSuscriptionId:', endpoint);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ChefReservationResponse = await response.json();

      if (!response.ok) {
        console.error('getChefReservationByReservationSuscriptionId error:', response.status, data);
        return {
          data: [],
          success: false,
          errorMessage: data.errorMessage || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('getChefReservationByReservationSuscriptionId exception:', error);
      return {
        data: [],
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error de red',
      };
    }
  }

  /**
   * PUT /api/ChefReservation/mark-start/{id}
   * Marca el inicio del servicio (llegada al domicilio)
   */
  async markReservationStart(
    chefReservationId: number,
    request: MarkStartRequest
  ): Promise<BaseResponseGeneric<any>> {
    const endpoint = `ChefReservation/mark-start/${chefReservationId}`;
    
    console.log('Calling markReservationStart:', endpoint, request);
    
    return this.request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  /**
   * PUT /api/ChefReservation/mark-end/{id}
   * Marca el fin del servicio (culminación del servicio)
   */
  async markReservationEnd(
    chefReservationId: number,
    request: MarkEndRequest
  ): Promise<BaseResponseGeneric<any>> {
    const endpoint = `ChefReservation/mark-end/${chefReservationId}`;

    console.log('Calling markReservationEnd:', endpoint, request);

    return this.request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // ── Push Notifications ──────────────────────────────────────────────────────

  async getPushVapidPublicKey(): Promise<BaseResponseGeneric<{ publicKey: string }>> {
    return this.request<{ publicKey: string }>('Push/vapid-public-key');
  }

  async subscribePush(dto: {
    chefId: number;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }): Promise<BaseResponseGeneric<{ success: boolean }>> {
    return this.request<{ success: boolean }>('Push/subscribe', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async unsubscribePush(endpoint: string): Promise<BaseResponseGeneric<{ success: boolean }>> {
    return this.request<{ success: boolean }>('Push/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    });
  }

  /**
   * POST /api/users/forgot-password-chef-link
   * Envía email con link de recuperación a socia.cociname.pe (exclusivo cocineras).
   */
  async forgotPasswordChefLink(email: string): Promise<BaseResponseGeneric<boolean>> {
    return this.publicRequest<boolean>('users/forgot-password-chef-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * POST /api/users/verify-reset-link
   * Verifica que el token del link de recuperación sea válido.
   */
  async verifyResetLink(tokenLink: string): Promise<BaseResponseGeneric<boolean>> {
    return this.publicRequest<boolean>('users/verify-reset-link', {
      method: 'POST',
      body: JSON.stringify({ tokenLink }),
    });
  }

  /**
   * POST /api/users/complete-password-reset-link
   * Guarda la nueva contraseña usando el token del link.
   */
  async completePasswordResetLink(tokenLink: string, nuevaPassword: string): Promise<BaseResponseGeneric<boolean>> {
    return this.publicRequest<boolean>('users/complete-password-reset-link', {
      method: 'POST',
      body: JSON.stringify({ tokenLink, nuevaPassword }),
    });
  }
}

// Exporta una instancia única del servicio (Singleton)
export const apiService = new ApiService();

// ═══════════════════════════════════════════════════════════════
// EJEMPLO DE USO: GetPendingReservation
// ═══════════════════════════════════════════════════════════════
/*
// Ejemplo 1: Sin filtros (obtiene todas las reservas pendientes)
const response = await apiService.getPendingReservations();

// Ejemplo 2: Con filtro de fecha
const response = await apiService.getPendingReservations({
  dateFilter: '2026-01-15'
});

// Ejemplo 3: Con filtros de fecha y hora
const response = await apiService.getPendingReservations({
  dateFilter: '2026-01-15',
  timeFilter: '14:00'
});

// Ejemplo 4: Con paginación
const response = await apiService.getPendingReservations({
  Page: 1,
  RecordsPerPage: 10
});

// Ejemplo 5: Con todos los parámetros
const response = await apiService.getPendingReservations({
  dateFilter: '2026-01-15',
  timeFilter: '14:00',
  Page: 1,
  RecordsPerPage: 10
});

// Manejo de respuesta
if (response.success && response.data) {
  console.log('Reservas pendientes:', response.data);
  // response.data es un array de tipo Datum[]
} else {
  console.error('Error:', response.errorMessage);
}
*/

