import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithEmail(email, password);
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
      return response;
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
  },
  extraReducers: (builder) => {
    // loginWithEmail
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loginWithPhone
    builder
      .addCase(loginWithPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginWithPhone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loginWithUsername
    builder
      .addCase(loginWithUsername.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithUsername.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginWithUsername.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // logout
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

export const { setLoginMethod, clearError } = authSlice.actions;
export default authSlice.reducer;
