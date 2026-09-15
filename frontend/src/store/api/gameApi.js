import { apiSlice } from './apiSlice';

export const gameApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGames: builder.query({
      query: (params) => ({
        url: '/games',
        params
      }),
      providesTags: ['Game']
    }),

    getGameBySlug: builder.query({
      query: (slug) => `/games/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Game', id: slug }]
    }),

    createGame: builder.mutation({
      query: (gameData) => ({
        url: '/games',
        method: 'POST',
        body: gameData
      }),
      invalidatesTags: ['Game']
    })
  })
});

export const {
  useGetGamesQuery,
  useGetGameBySlugQuery,
  useCreateGameMutation
} = gameApi;
