import { apiSlice } from './apiSlice';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({
        url: '/notifications',
        params
      }),
      providesTags: ['Notification']
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Notification']
    }),

    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST'
      }),
      invalidatesTags: ['Notification']
    })
  })
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation
} = notificationApi;
