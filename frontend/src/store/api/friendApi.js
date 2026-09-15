import { apiSlice } from './apiSlice';

export const friendApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFriends: builder.query({
      query: () => '/friends',
      providesTags: ['Friend']
    }),

    searchFriends: builder.query({
      query: (q) => `/friends/search?q=${encodeURIComponent(q)}`,
      providesTags: ['Friend']
    }),

    getFriendRequests: builder.query({
      query: () => '/friends/requests',
      providesTags: ['FriendRequest']
    }),

    sendFriendRequest: builder.mutation({
      query: (receiverId) => ({
        url: '/friends/request',
        method: 'POST',
        body: { receiverId }
      }),
      invalidatesTags: ['FriendRequest', 'Friend']
    }),

    acceptFriendRequest: builder.mutation({
      query: (requestId) => ({
        url: `/friends/requests/${requestId}/accept`,
        method: 'POST'
      }),
      invalidatesTags: ['Friend', 'FriendRequest']
    }),

    rejectFriendRequest: builder.mutation({
      query: (requestId) => ({
        url: `/friends/requests/${requestId}/reject`,
        method: 'POST'
      }),
      invalidatesTags: ['FriendRequest']
    }),

    cancelFriendRequest: builder.mutation({
      query: (requestId) => ({
        url: `/friends/requests/${requestId}/cancel`,
        method: 'DELETE'
      }),
      invalidatesTags: ['FriendRequest', 'Friend']
    }),

    removeFriend: builder.mutation({
      query: (friendId) => ({
        url: `/friends/${friendId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Friend']
    })
  })
});

export const {
  useGetFriendsQuery,
  useSearchFriendsQuery,
  useLazySearchFriendsQuery,
  useGetFriendRequestsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useCancelFriendRequestMutation,
  useRemoveFriendMutation
} = friendApi;
