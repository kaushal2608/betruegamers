import { apiSlice } from './apiSlice';

export const coachApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCoaches: builder.query({
      query: (params) => ({
        url: '/coaches',
        params
      }),
      providesTags: ['Coach']
    }),

    getCoachById: builder.query({
      query: (id) => `/coaches/${id}`,
      providesTags: (result, error, id) => [{ type: 'Coach', id }]
    })
  })
});

export const {
  useGetCoachesQuery,
  useGetCoachByIdQuery
} = coachApi;
