import { apiSlice } from './apiSlice';

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: () => '/conversations',
      providesTags: ['Conversation']
    }),

    startConversation: builder.mutation({
      query: (recipientId) => ({
        url: '/conversations',
        method: 'POST',
        body: { recipientId }
      }),
      invalidatesTags: ['Conversation']
    }),

    getMessages: builder.query({
      query: ({ conversationId, limit, offset }) => ({
        url: `/conversations/${conversationId}/messages`,
        params: { limit, offset }
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId }
      ],
      keepUnusedDataFor: 0
    }),

    sendMessage: builder.mutation({
      query: ({ conversationId, content }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'POST',
        body: { content }
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        'Conversation',
        { type: 'Message', id: conversationId }
      ]
    }),

    markConversationAsRead: builder.mutation({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/read`,
        method: 'PATCH'
      }),
      async onQueryStarted(conversationId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          chatApi.util.updateQueryData('getConversations', undefined, (draft) => {
            if (draft?.data) {
              const conv = draft.data.find((c) => c.id === conversationId);
              if (conv) {
                conv.unread_count = 0;
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Conversation']
    })
  })
});

export { useSearchUsersQuery } from './userApi';

export const {
  useGetConversationsQuery,
  useStartConversationMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useMarkConversationAsReadMutation
} = chatApi;
