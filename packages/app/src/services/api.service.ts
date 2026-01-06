import { API_CONFIG } from '../config';
import {
  BaseResponseGeneric,
  LoginRequestDto,
  LoginChefResponseDto,
  RegisterRequestDto,
  RegisterChefResponseDto,
  ListReservationChefResponse,
  ChefResponse,
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
}

// Exporta una instancia única del servicio (Singleton)
export const apiService = new ApiService();
