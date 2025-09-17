import type { NavigateFunction } from 'react-router-dom';

export const fetchWithAuth = async (url: string, options: RequestInit = {}, navigate: NavigateFunction) => {
  const token = localStorage.getItem('auth_token');

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 403 || response.status === 401) {
    localStorage.removeItem('auth_token');
    navigate('/login');
    throw new Error('Unauthorized or Forbidden: Your session has expired.');
  }

  return response;
};