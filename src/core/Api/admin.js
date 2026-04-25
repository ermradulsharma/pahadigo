export const adminApi = (fetcher) => ({
  // Dashboard & Analytics
  stats: {
    getStats: () => fetcher('/api/admin/stats'),
    getAnalytics: (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetcher(`/api/admin/analytics${query}`);
    },
  },

  auditLogs: {
    getAll: (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetcher(`/api/admin/audit-logs${query}`);
    }
  },

  // Profile & Auth
  profile: {
    get: () => fetcher('/api/admin/profile'),
    update: (data) => fetcher('/api/admin/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (data) => fetcher('/api/admin/change-password', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (data) => fetcher('/api/admin/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  },

  // User Management: Travellers
  travellers: {
    getAll: () => fetcher('/api/admin/travellers'),
    create: (data) => fetcher('/api/admin/travellers/create', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetcher(`/api/admin/travellers/${id}/update`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => fetcher(`/api/admin/travellers/${id}/delete`, { method: 'DELETE' }),
  },

  // User Management: Vendors
  vendors: {
    getAll: () => fetcher('/api/admin/vendors'),
    getById: (id) => fetcher(`/api/admin/vendors/${id}`),
    getPackages: (id) => fetcher(`/api/admin/vendors/${id}/packages`),
    create: (data) => fetcher('/api/admin/vendors/create', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetcher(`/api/admin/vendors/${id}/update`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => fetcher(`/api/admin/vendors/${id}/delete`, { method: 'DELETE' }),
    approve: (id) => fetcher(`/api/admin/vendors/${id}/approve`, { method: 'PATCH' }),
    globalApprove: (data) => fetcher('/api/admin/approve-vendor', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Trust & Compliance
  compliance: {
    verifyDocument: (data) => fetcher('/api/admin/verify-document', { method: 'POST', body: JSON.stringify(data) }),
    verifyCategoryDoc: (data) => fetcher('/api/admin/verify-category-document', { method: 'POST', body: JSON.stringify(data) }),
    triggerOCR: (data) => fetcher('/api/admin/trigger-ocr', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Inventory Hub
  packages: {
    getAll: () => fetcher('/api/admin/packages'),
    updateStatus: (id, data) => fetcher(`/api/admin/packages/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    addOnBehalf: (data) => fetcher('/api/admin/packages/add', { method: 'POST', body: JSON.stringify(data) }),
    getItem: (id) => fetcher(`/api/admin/packages/item/${id}`),
    updateItem: (id, data) => fetcher(`/api/admin/packages/item/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Operations Hub
  bookings: {
    getAll: (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetcher(`/api/admin/bookings${query}`);
    },
    getById: (id) => fetcher(`/api/admin/bookings/${id}`),
    sendInvoice: (id) => fetcher(`/api/admin/bookings/${id}/invoice`, { method: 'POST' }),
  },

  payments: {
    getHistory: () => fetcher('/api/admin/payments'),
    payout: (data) => fetcher('/api/admin/payments/payout', { method: 'POST', body: JSON.stringify(data) }),
    refund: (data) => fetcher('/api/admin/payments/refund', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Moderation & Social
  reviews: {
    getPending: () => fetcher('/api/admin/reviews'),
    updateStatus: (id, data) => fetcher(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    reject: (id) => fetcher(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
  },

  disputes: {
    getAll: () => fetcher('/api/admin/disputes'),
    resolve: (id, data) => fetcher(`/api/admin/disputes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getMessages: (id) => fetcher(`/api/admin/disputes/${id}/messages`),
    sendMessage: (id, data) => fetcher(`/api/admin/disputes/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  },

  inquiries: {
    getAll: () => fetcher('/api/admin/inquiries'),
    update: (id, data) => fetcher(`/api/admin/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => fetcher(`/api/admin/inquiries/${id}`, { method: 'DELETE' }),
  },

  // Marketing Hub
  marketing: {
    banners: {
      getAll: () => fetcher('/api/admin/marketing/banners'),
      add: (data) => fetcher('/api/admin/marketing/banners', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => fetcher(`/api/admin/marketing/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => fetcher(`/api/admin/marketing/banners/${id}`, { method: 'DELETE' }),
    },
    coupons: {
      getAll: () => fetcher('/api/admin/marketing/coupons'),
      create: (data) => fetcher('/api/admin/marketing/coupons', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => fetcher(`/api/admin/marketing/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => fetcher(`/api/admin/marketing/coupons/${id}`, { method: 'DELETE' }),
    }
  },

  // Taxonomy Hub
  categories: {
    getAll: () => fetcher('/api/admin/categories'),
    create: (data) => fetcher('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetcher(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetcher(`/api/admin/categories/${id}`, { method: 'DELETE' }),
    seed: () => fetcher('/api/admin/categories/seed', { method: 'POST' }),
  },

  documents: {
    getAll: (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetcher(`/api/admin/category-documents${query}`);
    },
    create: (data) => fetcher('/api/admin/category-documents', { method: 'POST', body: JSON.stringify(data) }),
    getById: (id) => fetcher(`/api/admin/category-documents/${id}`),
    update: (id, data) => fetcher(`/api/admin/category-documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetcher(`/api/admin/category-documents/${id}`, { method: 'DELETE' }),
  },

  // System Configuration
  settings: {
    get: () => fetcher('/api/admin/settings'),
    update: (data) => fetcher('/api/admin/settings', { method: 'POST', body: JSON.stringify(data) }),
  },

  policies: {
    getAll: () => fetcher('/api/admin/policies'),
    save: (data) => fetcher('/api/admin/policies', { method: 'POST', body: JSON.stringify(data) }),
    seed: () => fetcher('/api/admin/policies/seed', { method: 'POST' }),
  },

  // Geography
  locations: {
    createCountry: (data) => fetcher('/api/admin/countries', { method: 'POST', body: JSON.stringify(data) }),
    createState: (data) => fetcher('/api/admin/states', { method: 'POST', body: JSON.stringify(data) }),
  }
});
