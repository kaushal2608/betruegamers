import axios from 'axios';
import Cookies from 'js-cookie';

const apiWithAuth = axios.create({
  baseURL: 'https://api.yourdomain.com', // Replace with your actual API base URL
  timeout: 10000, // 10 seconds timeout
});

// Attach Authorization header to every request if the token is available
apiWithAuth.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token'); // Get the auth token from cookies
    
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
