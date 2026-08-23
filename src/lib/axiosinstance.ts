const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
};

async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = API_BASE_URL.replace(/\/$/, "");

  const target = url.startsWith("http")
    ? url
    : `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;

  console.log("API Request:", target);

  const response = await fetch(target, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      text || `Request failed with status ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

const axiosInstance = {
  get: <T>(url: string): Promise<T> => {
    return request<T>(url, {
      method: "GET",
    });
  },

  post: <T>(
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> => {
    return request<T>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  },

  put: <T>(
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> => {
    return request<T>(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  },

  delete: <T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<T> => {
    return request<T>(url, {
      method: "DELETE",
      headers,
    });
  },
};

export default axiosInstance;