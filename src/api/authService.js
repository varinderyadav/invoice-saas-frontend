import api from "./axios";

const persistTokens = ({ access, refresh }) => {
  if (access) {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("access", access);
  }
  if (refresh) {
    localStorage.setItem("refreshToken", refresh);
    localStorage.setItem("refresh", refresh);
  }
};

const extractErrorMessage = (error) => {
  // Check for field-specific errors
  if (error?.response?.data) {
    const data = error.response.data;
    if (data.username && Array.isArray(data.username)) {
      return data.username[0];
    }
    if (data.email && Array.isArray(data.email)) {
      return data.email[0];
    }
    if (data.password && Array.isArray(data.password)) {
      return data.password[0];
    }
    if (data.detail) {
      return data.detail;
    }
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      return data.non_field_errors[0];
    }
  }
  return "Authentication request failed.";
};

export async function login(username, password) {
  try {
    const response = await api.post("auth/login/", { username, password });
    persistTokens(response.data);
    return { success: true, data: response.data };
  } catch (primaryError) {
    try {
      const fallbackResponse = await api.post("token/", { username, password });
      persistTokens(fallbackResponse.data);
      return { success: true, data: fallbackResponse.data };
    } catch (fallbackError) {
      return { success: false, message: extractErrorMessage(fallbackError || primaryError) };
    }
  }
}

export async function refreshToken() {
  const refresh = localStorage.getItem("refreshToken") || localStorage.getItem("refresh");
  if (!refresh) {
    return { success: false, message: "Refresh token not found." };
  }

  try {
    const response = await api.post("auth/refresh/", { refresh });
    persistTokens(response.data);
    return { success: true, data: response.data };
  } catch (primaryError) {
    try {
      const fallbackResponse = await api.post("token/refresh/", { refresh });
      persistTokens(fallbackResponse.data);
      return { success: true, data: fallbackResponse.data };
    } catch (fallbackError) {
      logout();
      return { success: false, message: extractErrorMessage(fallbackError || primaryError) };
    }
  }
}

export async function register(firstName, lastName, email, password) {
  try {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const fallbackUsername = [firstName, lastName]
      .filter(Boolean)
      .join(".")
      .replace(/\s+/g, "")
      .toLowerCase();
    const username = normalizedEmail || fallbackUsername;
    const response = await api.post("auth/register/", {
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: extractErrorMessage(error) };
  }
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}
