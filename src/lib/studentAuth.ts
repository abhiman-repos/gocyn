const hasJwtShape = (token: string | null): token is string =>
  Boolean(token && token !== "undefined" && token !== "null" && token.split(".").length === 3);

const clearStudentTokens = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
};

async function performAccessTokenRefresh(apiBase: string): Promise<string> {
  const refresh = localStorage.getItem("refresh");
  if (!hasJwtShape(refresh)) {
    clearStudentTokens();
    throw new Error("Your session has expired. Sign in again.");
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not refresh your session. Check your connection and retry.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !hasJwtShape(data.access)) {
    clearStudentTokens();
    throw new Error("Your session has expired. Sign in again.");
  }

  localStorage.setItem("token", data.access);
  if (hasJwtShape(data.refresh)) localStorage.setItem("refresh", data.refresh);
  return data.access;
}

let refreshInFlight: Promise<string> | null = null;

export function refreshStudentAccessToken(apiBase: string): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = performAccessTokenRefresh(apiBase).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
export async function authenticatedStudentFetch(
  apiBase: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  let access = localStorage.getItem("token");
  if (!hasJwtShape(access)) access = await refreshStudentAccessToken(apiBase);

  const send = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  };

  let response = await send(access);
  if (response.status !== 401) return response;

  access = await refreshStudentAccessToken(apiBase);
  response = await send(access);
  if (response.status === 401) {
    clearStudentTokens();
    throw new Error("Your session has expired. Sign in again.");
  }
  return response;
}
