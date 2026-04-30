import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_BASE_URL = "https://server.vmass.vn";
const DEFAULT_TOKEN_KEY = "access_token";

function normalizePath(path) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeBase(baseUrl) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/g, "");
}

export function createVmassHttpClient(options = {}) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    tokenProvider,
    tokenStorageKey = DEFAULT_TOKEN_KEY,
    defaultHeaders = {},
  } = options;

  const resolveToken = async () => {
    if (typeof tokenProvider === "function") {
      return tokenProvider();
    }
    return AsyncStorage.getItem(tokenStorageKey);
  };

  return {
    async request({ method = "GET", path, body, headers = {} }) {
      const token = await resolveToken();
      const mergedHeaders = {
        "Content-Type": "application/json",
        ...defaultHeaders,
        ...headers,
      };

      if (token) {
        mergedHeaders.Authorization = `Bearer ${token}`;
      }

      const requestConfig = {
        method: String(method || "GET").toUpperCase(),
        headers: mergedHeaders,
      };

      if (body !== undefined && body !== null) {
        requestConfig.body =
          typeof body === "string" ? body : JSON.stringify(body);
      }

      const url = `${normalizeBase(baseUrl)}${normalizePath(path)}`;
      const response = await fetch(url, requestConfig);

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message =
          (data && data.responseText) ||
          (typeof data === "string" ? data : "") ||
          `Request failed with status ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    },
  };
}
