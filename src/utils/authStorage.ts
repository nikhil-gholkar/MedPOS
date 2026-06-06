import type { AuthUser } from "../types/auth.types";

const STORAGE_KEY = "medpos_user";

export const saveUser = (
  user: AuthUser
): void => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(user)
  );
};

export const getUser = (): AuthUser | null => {
  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const clearUser = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};