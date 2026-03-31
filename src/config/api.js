// API base URL - includes /v1 prefix
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gravysyncro.org/api/v1';

export const API_URL = API_BASE_URL;

// Helper function to get full API path
export const getApiUrl = (path) => `${API_BASE_URL}${path}`;

export default {
  API_URL,
  getApiUrl,
  endpoints: {
    auth: {
      login: () => getApiUrl('/auth/login'),
      register: () => getApiUrl('/auth/register'),
      forgotPassword: () => getApiUrl('/auth/forgot-password'),
      resetPassword: () => getApiUrl('/auth/reset-password'),
      changePassword: () => getApiUrl('/auth/change-password'),
    },
    documents: {
      list: (params = '') => getApiUrl(`/documents${params}`),
      upload: () => getApiUrl('/documents/upload'),
      dashboardStats: () => getApiUrl('/documents/dashboard-stats'),  // ✓ matches backend
    },
    admin: {
      dashboardStats: () => getApiUrl('/admin/dashboard/stats'),       // ✓ fixed: was /admin/dashboard-stats
      users: () => getApiUrl('/admin/users'),
      tenants: () => getApiUrl('/admin/tenants'),
      activityLogs: (params = '') => getApiUrl(`/admin/activities${params}`),
      systemHealth: () => getApiUrl('/admin/system/health'),
    },
    notifications: {
      list: () => getApiUrl('/notifications'),
      unreadCount: () => getApiUrl('/notifications/unread-count'),
    },
    messages: {
      list: (params = '') => getApiUrl(`/messages${params}`),
    },
    users: {
      profile: () => getApiUrl('/users/profile'),
    },
    health: () => getApiUrl('/health'),
  }
};
