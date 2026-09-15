import { apiSlice } from './apiSlice';

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['AdminStats']
    }),

    getAdminUsers: builder.query({
      query: (params) => ({
        url: '/admin/users',
        params
      }),
      providesTags: ['User']
    }),

    toggleBlockUser: builder.mutation({
      query: ({ id, isBlocked }) => ({
        url: `/admin/users/${id}/block`,
        method: 'PATCH',
        body: { isBlocked }
      }),
      invalidatesTags: ['User', 'AdminStats']
    }),

    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PATCH',
        body: { role }
      }),
      invalidatesTags: ['User', 'Coach', 'AdminStats', 'Profile']
    })
  })
});

export const {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useToggleBlockUserMutation,
  useUpdateUserRoleMutation
} = adminApi;
