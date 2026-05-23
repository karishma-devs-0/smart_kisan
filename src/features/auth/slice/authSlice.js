import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../../services/api';
import { persistSession, clearSession } from '../../../services/secureAuth';
import cache from '../../../services/cache';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithEmail(email, password);
      await persistSession(response.user, response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const loginWithPhone = createAsyncThunk(
  'auth/loginWithPhone',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithPhone(phone, otp);
      await persistSession(response.user, response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const loginWithUsername = createAsyncThunk(
  'auth/loginWithUsername',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithUsername(username, password);
      await persistSession(response.user, response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      await persistSession(response.user, response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (idToken, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithGoogle(idToken);
      await persistSession(response.user, response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      // Profile updates are local-only for now. When the backend grows a
      // PUT /api/users/me endpoint, call it here.
      return profileData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      await Promise.all([
        clearSession(),
        cache.flush(),
      ]);
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  loginMethod: 'email',
  sessionRestored: false, // true once we've checked for existing session
};

const handleLoginPending = (state) => {
  state.loading = true;
  state.error = null;
};

const handleLoginFulfilled = (state, action) => {
  state.loading = false;
  state.isAuthenticated = true;
  state.user = action.payload.user;
  state.token = action.payload.token;
};

const handleLoginRejected = (state, action) => {
  state.loading = false;
  state.error = action.payload;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoginMethod: (state, action) => {
      state.loginMethod = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    restoreSession: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.sessionRestored = true;
      state.loading = false;
    },
    sessionCheckComplete: (state) => {
      state.sessionRestored = true;
    },
    resetAuthState: () => ({
      ...initialState,
      sessionRestored: true,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithEmail.pending, handleLoginPending)
      .addCase(loginWithEmail.fulfilled, handleLoginFulfilled)
      .addCase(loginWithEmail.rejected, handleLoginRejected);

    builder
      .addCase(loginWithPhone.pending, handleLoginPending)
      .addCase(loginWithPhone.fulfilled, handleLoginFulfilled)
      .addCase(loginWithPhone.rejected, handleLoginRejected);

    builder
      .addCase(loginWithUsername.pending, handleLoginPending)
      .addCase(loginWithUsername.fulfilled, handleLoginFulfilled)
      .addCase(loginWithUsername.rejected, handleLoginRejected);

    builder
      .addCase(loginWithGoogle.pending, handleLoginPending)
      .addCase(loginWithGoogle.fulfilled, handleLoginFulfilled)
      .addCase(loginWithGoogle.rejected, handleLoginRejected);

    builder
      .addCase(register.pending, handleLoginPending)
      .addCase(register.fulfilled, handleLoginFulfilled)
      .addCase(register.rejected, handleLoginRejected);

    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setLoginMethod,
  clearError,
  restoreSession,
  sessionCheckComplete,
  resetAuthState,
} = authSlice.actions;

export default authSlice.reducer;
