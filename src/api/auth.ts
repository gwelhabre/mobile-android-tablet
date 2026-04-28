import apiClient from './client';
import { User, UserRole } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await apiClient.patch<User>('/auth/profile', data);
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword });
};

export const deleteAccount = async (password: string): Promise<void> => {
  await apiClient.delete('/auth/account', { data: { password } });
};

export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/refresh');
  return response.data;
};
