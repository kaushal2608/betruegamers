import { apiSlice } from './apiSlice';

export const coachingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserSessions: builder.query({
      query: () => '/coaching/sessions',
      providesTags: ['CoachingSession']
    }),

    getSessionById: builder.query({
      query: (id) => `/coaching/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'CoachingSession', id }]
    }),

    requestSession: builder.mutation({
      query: (sessionData) => ({
        url: '/coaching/sessions',
        method: 'POST',
        body: sessionData
      }),
      invalidatesTags: ['CoachingSession']
    }),

    updateSessionStatus: builder.mutation({
      query: ({ sessionId, status }) => ({
        url: `/coaching/sessions/${sessionId}/status`,
        method: 'PATCH',
        body: { status }
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        'CoachingSession',
        { type: 'CoachingSession', id: sessionId }
      ]
    }),

    submitReview: builder.mutation({
      query: (reviewData) => ({
        url: '/coaching/reviews',
        method: 'POST',
        body: reviewData
      }),
      invalidatesTags: ['Coach', 'CoachingSession']
    })
  })
});

export const {
  useGetUserSessionsQuery,
  useGetSessionByIdQuery,
  useRequestSessionMutation,
  useUpdateSessionStatusMutation,
  useSubmitReviewMutation
} = coachingApi;
