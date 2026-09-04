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
      google: () => getApiUrl('/auth/google'),
      forgotPassword: () => getApiUrl('/auth/forgot-password'),
      resetPassword: () => getApiUrl('/auth/reset-password'),
      changePassword: () => getApiUrl('/auth/change-password'),
    },
    documents: {
      list: (params = '') => getApiUrl(`/documents${params}`),
      upload: () => getApiUrl('/documents/upload'),
      dashboardStats: () => getApiUrl('/documents/dashboard-stats'),  // ✓ matches backend
      byId: (id) => getApiUrl(`/documents/${id}`),
      versions: (id) => getApiUrl(`/documents/${id}/versions`),
      restoreVersion: (id, versionNumber) => getApiUrl(`/documents/${id}/versions/${versionNumber}/restore`),
    },
    audios: {
      list: (params = '') => getApiUrl(`/audios${params}`),
      upload: () => getApiUrl('/audios'),
      byId: (id) => getApiUrl(`/audios/${id}`),
      download: (id) => getApiUrl(`/audios/${id}/download`),
      delete: (id) => getApiUrl(`/audios/${id}`),
    },
    assets: {
      updateState: (type, id) => getApiUrl(`/assets/${type}/${id}/state`),
      report: () => getApiUrl('/assets/report'),
      reportExport: () => getApiUrl('/assets/report/export'),
    },
    admin: {
      dashboardStats: () => getApiUrl('/admin/dashboard/stats'),       // ✓ fixed: was /admin/dashboard-stats
      users: () => getApiUrl('/admin/users'),
      subscriptionAccess: (userId) => getApiUrl(`/admin/users/${userId}/subscription-access`),
      tenants: () => getApiUrl('/admin/tenants'),
      tenantStorageLimit: (tenantId) => getApiUrl(`/admin/tenants/${tenantId}/storage-limit`),
      activityLogs: (params = '') => getApiUrl(`/admin/activities${params}`),
      systemHealth: () => getApiUrl('/admin/system/health'),
    },
    notifications: {
      list: () => getApiUrl('/notifications'),
      unreadCount: () => getApiUrl('/notifications/unread-count'),
    },
    comments: {
      list: (documentId) => getApiUrl(`/comments/document/${documentId}`),
      create: (documentId) => getApiUrl(`/comments/document/${documentId}`),
      listVideo: (videoId) => getApiUrl(`/comments/video/${videoId}`),
      createVideo: (videoId) => getApiUrl(`/comments/video/${videoId}`),
      listAudio: (audioId) => getApiUrl(`/comments/audio/${audioId}`),
      createAudio: (audioId) => getApiUrl(`/comments/audio/${audioId}`),
      update: (commentId) => getApiUrl(`/comments/${commentId}`),
      delete: (commentId) => getApiUrl(`/comments/${commentId}`),
    },
    workspaces: {
      list: () => getApiUrl('/workspaces'),
      create: () => getApiUrl('/workspaces'),
      terminology: () => getApiUrl('/workspaces/terminology'),
      branding: () => getApiUrl('/workspaces/settings/branding'),
      byId: (id) => getApiUrl(`/workspaces/${id}`),
      delete: (id) => getApiUrl(`/workspaces/${id}`),
      archive: (id) => getApiUrl(`/workspaces/${id}/archive`),
      rework: (id) => getApiUrl(`/workspaces/${id}/rework`),
      invite: (id) => getApiUrl(`/workspaces/${id}/invite`),
      members: (id) => getApiUrl(`/workspaces/${id}/members`),
      addInternalMember: (id) => getApiUrl(`/workspaces/${id}/members/internal`),
      addGuestMember: (id) => getApiUrl(`/workspaces/${id}/members/guest`),
      updateMember: (id, memberId) => getApiUrl(`/workspaces/${id}/members/${memberId}`),
      removeMember: (id, memberId) => getApiUrl(`/workspaces/${id}/members/${memberId}`),
    },
    messages: {
      list: (params = '') => getApiUrl(`/messages${params}`),
      publicContact: () => getApiUrl('/messages/public'),
    },
    users: {
      profile: () => getApiUrl('/users/profile'),
      subscriptionPlans: () => getApiUrl('/users/subscription-plans'),
      updateSubscriptionPlan: () => getApiUrl('/users/subscription-plan'),
    },
    billing: {
      invoices: (params = '') => getApiUrl(`/billing/invoices${params}`),
      invoice: (id) => getApiUrl(`/billing/invoices/${id}`),
      invoicePdf: (id) => getApiUrl(`/billing/invoices/${id}/pdf`),
      generateInvoice: () => getApiUrl('/billing/invoices/generate'),
    },
    health: () => getApiUrl('/health'),
  }
};
