import Cookies from 'js-cookie';
import { apiSlice } from './apiSlice';
import { setCredentials, logout } from '../slices/authSlice';
import { setThemeMode, setUnreadNotificationsCount, setUnreadMessagesCount } from '../slices/uiSlice';
import { socketService } from '@/services/socket.service';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data?.token) {
            // Disconnect old socket session
            socketService.disconnect();
            // Reset entire RTK Query cache so previous user's data does not linger
            dispatch(apiSlice.util.resetApiState());
            dispatch(setCredentials({ user: data.data.user, token: data.data.token }));
            if (data.data.user?.theme) {
              dispatch(setThemeMode(data.data.user.theme));
            }
          }
        } catch (err) {
          // handled by caller
        }
      },
      invalidatesTags: ['User', 'Profile']
    }),

    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData
      })
    }),

    verifyOtp: builder.mutation({
      query: (verifyData) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: verifyData
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data?.token) {
            socketService.disconnect();
            dispatch(apiSlice.util.resetApiState());
            dispatch(setCredentials({ user: data.data.user, token: data.data.token }));
            if (data.data.user?.theme) {
              dispatch(setThemeMode(data.data.user.theme));
            }
          }
        } catch (err) {
          // handled by caller
        }
      },
      invalidatesTags: ['User', 'Profile']
    }),

    resendOtp: builder.mutation({
      query: (emailData) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body: emailData
      })
    }),

    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data
      })
    }),

    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data
      })
    }),

    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User', 'Profile'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data) {
            dispatch(setCredentials({ user: data.data, token: Cookies.get('btg_token') }));
            if (data.data?.theme) {
              dispatch(setThemeMode(data.data.theme));
            }
          }
        } catch (err) {
          socketService.disconnect();
          dispatch(apiSlice.util.resetApiState());
          dispatch(setUnreadNotificationsCount(0));
          dispatch(setUnreadMessagesCount(0));
          dispatch(logout());
        }
      }
    }),

    logoutUser: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (e) {}
        socketService.disconnect();
        dispatch(apiSlice.util.resetApiState());
        dispatch(setUnreadNotificationsCount(0));
        dispatch(setUnreadMessagesCount(0));
        dispatch(logout());
      }
    })
  })
});

export const {
  useLoginMutation,
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useLogoutUserMutation
} = authApi;

