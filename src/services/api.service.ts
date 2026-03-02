import { API_CONFIG } from '../config';
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
  MarkStartRequest,
  MarkEndRequest
} from '../types'; 

// ═══════════════════════════════════════════════════════════════
// Servicio API REST para Cociname
// ═══════════════════════════════════════════════════════════════

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Guarda el token de autenticación
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Limpia el token (logout)
   */
  clearToken() {
    this.token = null;
  }

  /**
   * Método genérico para hacer peticiones HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BaseResponseGeneric<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Agregar token si existe
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
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
        return {
          success: false,
          errorMessage: data.errorMessage || `Error: ${response.status}`,
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ChefResponse = await response.json();

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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('getReservationSuscriptionById response status:', response.status);

      const data: ReservationSuscriptionResponse = await response.json();

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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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
      reservationId: 0,
      suscriptionId,
      reservationSuscriptionId,
      status: true,
      createdById: chefId.toString(),
      createdAt: now.toISOString(),
    };

    console.log('Calling updateReservationSuscriptionAssignment:', endpoint, requestBody);

    return this.request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
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
