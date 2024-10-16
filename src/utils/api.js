// src/utils/api.js
import axios from 'axios';
import Cookies from 'js-cookie'; // Use js-cookie for client-side cookies

const apiWithAuth = axios.create({
  baseURL: 'http://localhost:3232', // Replace with your actual API base URL
  timeout: 10000, // 10 seconds timeout
  withCredentials: true,
});

// Attach Authorization header to every request if the token is available
apiWithAuth.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token'); // Get the auth token from cookies (client-side)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { apiWithAuth };
