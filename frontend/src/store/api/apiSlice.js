import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api');

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include', // Sends HTTP cookies automatically with all API requests
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token || Cookies.get('btg_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),

  tagTypes: [
    'User',
    'Profile',
    'Game',
    'Coach',
    'Friend',
    'FriendRequest',
    'Conversation',
    'Message',
    'Notification',
    'CoachingSession',
    'Review',
    'AdminStats'
  ],
  endpoints: () => ({})
});
