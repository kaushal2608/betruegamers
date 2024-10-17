
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
      config.data = data; // Use `data` for POST/PUT requests
    }

    const response = await axiosInstance(config);

    // Check for custom error code in response, if present
    if (response.data.code === 0) {
      throw new Error(response.data.message || 'Request failed');
    }

    return response; // Return full response for further processing in action
  } catch (error) {
    // Re-throw the error with a clear message for catching in the action
    throw new Error(error.response?.data?.message || 'API request failed');
  }
};

  