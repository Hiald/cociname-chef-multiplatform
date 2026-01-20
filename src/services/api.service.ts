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
   * GET /api/ingredient/IngredientByMasterRecipeId?search={masterRecipeId}
   * Obtiene los ingredientes de una receta
   */
  async getIngredientsByRecipeId(
    masterRecipeId: number
  ): Promise<IngredientResponse> {
    const endpoint = `ingredient/IngredientByMasterRecipeId?search=${masterRecipeId}`;
    
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
      `/masterRecipe/${id}`,
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
