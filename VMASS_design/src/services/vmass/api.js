import { VMASS_ENDPOINTS } from "./endpoints";
import { createVmassHttpClient } from "./http-client";

const defaultClient = createVmassHttpClient();

function applyPathParams(path, pathParams = {}) {
  return String(path || "").replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    if (!(key in pathParams)) {
      throw new Error(`Missing path param: ${key}`);
    }
    return encodeURIComponent(String(pathParams[key]));
  });
}

function appendQuery(path, query = {}) {
  const entries = Object.entries(query).filter(
    ([, value]) => value !== undefined && value !== null,
  );

  if (entries.length === 0) {
    return path;
  }

  const queryString = entries
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map(
            (item) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`,
          )
          .join("&");
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");

  return path.includes("?") ? `${path}&${queryString}` : `${path}?${queryString}`;
}

export async function callVmassEndpoint(key, options = {}) {
  const endpoint = VMASS_ENDPOINTS[key];
  if (!endpoint) {
    throw new Error(`Unknown VMASS endpoint key: ${key}`);
  }

  const {
    client = defaultClient,
    pathParams,
    query,
    body,
    headers,
    methodOverride,
  } = options;

  const method = String(methodOverride || endpoint.method || "GET").toUpperCase();
  const resolvedPath = appendQuery(
    applyPathParams(endpoint.path, pathParams),
    query,
  );

  return client.request({
    method,
    path: resolvedPath,
    body,
    headers,
  });
}

export function createVmassApi(client = defaultClient) {
  return new Proxy(
    {},
    {
      get(_, key) {
        if (typeof key !== "string") {
          return undefined;
        }
        return (options = {}) => callVmassEndpoint(key, { ...options, client });
      },
    },
  );
}

export const vmassApi = createVmassApi();
