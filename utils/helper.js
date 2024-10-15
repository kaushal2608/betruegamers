
export const commonRequest = async (axiosInstance, route, data = {}, method = 'GET', headers = {}) => {
    try {
      const config = {
        method,
        url: route,
        headers,
      };
  
      if (method.toUpperCase() === 'GET') {
        config.params = data; // Use `params` for GET requests
      } else {
        config.data = data; // Use `data` for other methods (POST, PUT, etc.)
      }
  
      const response = await axiosInstance(config);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  };
  