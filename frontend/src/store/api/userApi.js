import { apiSlice } from './apiSlice';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }]
    }),

    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/users/profile',
        method: 'PATCH',
        body: profileData
      }),
      invalidatesTags: ['User', 'Profile']
    }),

    updateTheme: builder.mutation({
      query: (theme) => ({
        url: '/users/theme',
        method: 'PATCH',
        body: { theme }
      })
    }),

    uploadAvatar: builder.mutation({
      query: (data) => ({
        url: '/users/avatar',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['User', 'Profile']
    }),

    getUserGames: builder.query({
      query: (userId) => `/users/${userId}/games`,
      providesTags: (result, error, userId) => [{ type: 'Game', id: `USER_${userId}` }]
    }),

    addUserGame: builder.mutation({
      query: (gameData) => ({
        url: '/users/games',
        method: 'POST',
        body: gameData
      }),
      invalidatesTags: (result, error, arg) => ['Game', 'User', 'Profile']
    }),

    removeUserGame: builder.mutation({
      query: (gameId) => ({
        url: `/users/games/${gameId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Game', 'User', 'Profile']
    }),

    searchUsers: builder.query({
      query: (params) => {
        if (typeof params === 'string') {
          return {
            url: '/users/search',
            params: params ? { q: params } : {}
          };
        }
        const cleanParams = {};
        if (params && typeof params === 'object') {
          Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '') {
              cleanParams[key] = val;
            }
          });
        }
        return {
          url: '/users/search',
          params: cleanParams
        };
      },
      providesTags: ['User']
    })
  })
});

export const {
  useGetUserByIdQuery,
  useUpdateProfileMutation,
  useUpdateThemeMutation,
  useUploadAvatarMutation,
  useGetUserGamesQuery,
  useAddUserGameMutation,
  useRemoveUserGameMutation,
  useSearchUsersQuery
} = userApi;
