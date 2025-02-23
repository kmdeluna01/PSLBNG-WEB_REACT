import axios from 'axios';

const API_URL = 'https://pslbng-mobile-1.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LoginResponse {
  status: string;
  data: {
    token: string;
    vendor: {
      _id: string;
      name: string;
      email: string;
    };
  };
}

export interface VendorRegisterData {
  name: string;
  email: string;
  number: string;
  location: {
    latitude: number;
    longitude: number;
  };
  password: string;
}

export const vendorAuth = {
  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/merchant-login', {
      email,
      password,
    });
    return response.data;
  },
  register: async (data: VendorRegisterData) => {
    const response = await api.post('/merchant-register', data);
    return response.data;
  },
};

export const vendorProfile = {
  getProfile: async (vendorId: string) => {
    const response = await api.get(`/profile/merchant/${vendorId}`);
    return response.data;
  },
  updateProfile: async (vendorId: string, data: Partial<VendorRegisterData>) => {
    const response = await api.post(`/updateProfile/merchant/${vendorId}`, data);
    return response.data;
  },
};

export const products = {
  getVendorProducts: async (vendorId: string) => {
    const response = await api.get(`/merchant/${vendorId}/get-products`);
    return response.data;
  },
  uploadProduct: async (formData: FormData) => {
    const response = await api.post('/upload-product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  editProduct: async (productId: string, formData: FormData) => {
    const response = await api.put(`/merchant/${productId}/edit-products`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteProduct: async (productId: string) => {
    const response = await api.delete(`/merchant/${productId}/delete`);
    return response.data;
  },
};

export const orders = {
  getPendingOrders: async (vendorId: string) => {
    const response = await api.get(`/merchant/${vendorId}/orders/pending`);
    return response.data;
  },
};