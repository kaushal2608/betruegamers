import * as authRoutes from "./authRoutes";
import * as dashboardRoutes from "./dashboardRoutes";


export const routesMapping = {
    auth: authRoutes,
    dashboard: dashboardRoutes
    // Add more sections as needed
  };
  
  export const Route = (path) => {
    // You can add logic here to handle different environments (e.g., dev, prod) or base URLs
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''; // Use environment variable for base URL
    return `${baseUrl}${path}`;
  };
  