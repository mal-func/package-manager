import { httpClient } from "./httpClient";
import type { ApiSuccessEnvelope } from "../types";

/** Query-string params for a GET request — axios serializes these itself. */
type QueryParams = Record<string, string | number | boolean | undefined>;

class ApiClient {
  // `params` stays a separate optional arg (not folded into a general
  // AxiosRequestConfig passthrough) so every caller keeps this same
  // narrow, simple shape rather than reaching for arbitrary axios
  // config on a per-call basis.
  async get<T>(url: string, params?: QueryParams) {
    const response = params
      ? await httpClient.get<ApiSuccessEnvelope<T>>(url, { params })
      : await httpClient.get<ApiSuccessEnvelope<T>>(url);
    return response.data.data;
  }

  async post<T>(url: string, data?: unknown) {
    const response = await httpClient.post<ApiSuccessEnvelope<T>>(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: unknown) {
    const response = await httpClient.put<ApiSuccessEnvelope<T>>(url, data);
    return response.data.data;
  }

  async patch<T>(url: string, data?: unknown) {
    const response = await httpClient.patch<ApiSuccessEnvelope<T>>(url, data);
    return response.data.data;
  }

  async delete<T>(url: string) {
    const response = await httpClient.delete<ApiSuccessEnvelope<T>>(url);
    return response.data.data;
  }
}

export const apiClient = new ApiClient();
