import axios from 'axios';
import { Notification } from '../types/types';
import { refreshStudentAccessToken } from '@/src/lib/studentAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || (
  process.env.NODE_ENV === 'production' ? 'https://api.gocyn.com' : 'http://localhost:8000'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include token if stored in localStorage
api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const mentorToken = localStorage.getItem('mentorToken');
  const userToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
  const instructorAudience = !!mentorToken && (
    window.location.pathname.startsWith('/instructors/dashboard') ||
    new URLSearchParams(window.location.search).get('audience') === 'instructor' ||
    !userToken
  );
  const token = instructorAudience ? mentorToken : userToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const prefix = instructorAudience ? '/api/instructors' : '/api';
  if (!String(config.url || '').startsWith('/api/')) {
    config.url = `${prefix}${config.url || '/'}`;
  }
  return config;
});

// Student access tokens expire after 30 minutes. Refresh and retry notification
// requests once so an expired token does not leave the bell stuck on 401.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const isInstructorRequest = String(config?.url || '').startsWith('/api/instructors/');
    if (error?.response?.status !== 401 || !config || config._notificationRetry || isInstructorRequest) {
      return Promise.reject(error);
    }

    config._notificationRetry = true;
    try {
      const token = await refreshStudentAccessToken(API_BASE_URL);
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      return api.request(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export const getNotifications = async (params?: { page?: number; page_size?: number }) => {
  const response = await api.get('/notifications/', { params });
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count/');
  return response.data.count;
};

export const markNotificationAsRead = async (id: number): Promise<Notification> => {
  const response = await api.patch(`/notifications/${id}/read/`);
  return response.data;
};

export const trackNotificationClick = async (id: number): Promise<void> => {
  await api.post(`/notifications/${id}/click/`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.post('/notifications/mark-all-read/');
};

export const clearNotifications = async (): Promise<void> => {
  await api.delete('/notifications/clear/');
};

export const deleteNotification = async (id: number): Promise<void> => {
  await api.delete(`/notifications/${id}/`);
};

export type NotificationReportReason = "spam" | "misleading" | "inappropriate" | "broken_link" | "duplicate" | "other";

export const reportNotification = async (
  id: number,
  report: { reason: NotificationReportReason; feedback: string },
): Promise<void> => {
  try {
    await api.post(`/notifications/${id}/report/`, report);
  } catch (error: any) {
    const detail = error?.response?.data?.detail;
    throw new Error(detail || "We could not submit your report. Please try again.");
  }
};

export interface NotificationPreferences {
  in_app_enabled: boolean;
}

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get('/notifications/preferences/');
  return response.data;
};

export const updateNotificationPreferences = async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
  const response = await api.patch('/notifications/preferences/', preferences);
  return response.data;
};

async function instructorPreferenceRequest(method: "GET" | "PATCH", preferences?: NotificationPreferences): Promise<NotificationPreferences> {
  if (typeof window === "undefined") throw new Error("Instructor preferences are only available in the browser.");
  const token = localStorage.getItem("mentorToken");
  if (!token) throw new Error("Your instructor session has expired. Please sign in again.");
  const base = API_BASE_URL.replace(/\/+$/, "");

  const response = await fetch(`${base}/api/instructors/notifications/preferences/`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(preferences ? { "Content-Type": "application/json" } : {}),
    },
    ...(preferences ? { body: JSON.stringify(preferences) } : {}),
    cache: "no-store",
  });
  const raw = await response.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
  if (!response.ok) {
    const detail = data.detail || data.error || data.message;
    throw new Error(detail || `Instructor notification preference request failed (HTTP ${response.status}).`);
  }
  return data as NotificationPreferences;
}

export const getInstructorNotificationPreferences = () => instructorPreferenceRequest("GET");
export const updateInstructorNotificationPreferences = (preferences: NotificationPreferences) => instructorPreferenceRequest("PATCH", preferences);
