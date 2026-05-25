const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export const apiFetch = (url, options = {}) => {
  return fetch(`${API_BASE}${url}`, options);
};