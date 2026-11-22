
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";

import { User } from "@/app/types/types";
import { authenticatedStudentFetch } from "@/src/lib/studentAuth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const API = process.env.APP_URL?.replace(/\/+$/, "");

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep React state and Local Storage synchronized
  const setUser = useCallback<Dispatch<SetStateAction<User | null>>>(
    (value) => {
      setUserState((previousUser) => {
        const nextUser =
          typeof value === "function"
            ? value(previousUser)
            : value;

        if (nextUser) {
          localStorage.setItem("user", JSON.stringify(nextUser));
        } else {
          localStorage.removeItem("user");
        }

        return nextUser;
      });
    },
    []
  );

  // Normalize Django API response
  const normalizeUser = (data: any): User => {
    const apiUser = data.user ?? data;

    return {
      user_id: apiUser.user_id,
      full_name: apiUser.full_name ?? "",
      email: apiUser.email ?? "",
      provider: apiUser.provider,
      email_verified: apiUser.email_verified ?? false,

      profile: {
        ...(data.profile ?? apiUser.profile ?? {}),
        avatar_url:
          data.profile?.avatar_url ??
          apiUser.profile?.avatar_url ??
          null,
      },

      profile_completed:
        data.profile_completed !== undefined
          ? data.profile_completed
          : apiUser.profile_completed ?? null,

      is_profile_completed:
        data.is_profile_completed ??
        (data.profile_completed !== undefined
          ? data.profile_completed !== null
          : apiUser.profile_completed != null),
    };
  };

  // Fetch authenticated user from Django
  const fetchUser = useCallback(async () => {
    if (!API) {
      console.error("APP_URL is not configured.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    const refreshToken = localStorage.getItem("refresh");
    if ((!token || token === "undefined" || token === "null") && (!refreshToken || refreshToken === "undefined" || refreshToken === "null")) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authenticatedStudentFetch(API, `${API}/api/auth/me/`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        setUser(null);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
          `Failed to fetch user. Status: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Invalid user response from server.");
      }

      const authenticatedUser = normalizeUser(data);

      if (!authenticatedUser.user_id || !authenticatedUser.email) {
        throw new Error("User ID or email missing from API response.");
      }

      setUser(authenticatedUser);

      console.log("Authenticated user loaded:", authenticatedUser);

    } catch (error) {
      if (!localStorage.getItem("token") && !localStorage.getItem("refresh")) setUser(null);
      console.error("Auth fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  // Initial authentication check
  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      // Admin sessions use their own token and must not be cleared when the
      // regular user endpoint rejects that token during an admin page refresh.
      setUser(null);
      setLoading(false);
      return;
    }
    void fetchUser();
  }, [fetchUser, pathname, setUser]);

  // Refresh latest user from backend
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  // Logout
  const logout = useCallback(async () => {
    const token = localStorage.getItem("token");

    try {
      if (API && token && token !== "undefined" && token !== "null") {
        const response = await fetch(`${API}/api/auth/logout/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          console.warn("Backend logout returned:", response.status);
        }
      }
    } catch (error) {
      console.error("Backend logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      setUser(null);

      window.location.href = "/login";
    }
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom authentication hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}
