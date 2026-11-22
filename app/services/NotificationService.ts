import axios from 'axios';
import { Notification } from '../types/types';


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // if using cookies for auth
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
  config.url = `${prefix}${config.url || '/'}`;
  return config;
});

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
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("The API URL is not configured.");

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
