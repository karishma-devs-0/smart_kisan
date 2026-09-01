import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { onboardingService } from '../../../services/api';
import { logout, updateProfile } from '../../auth/slice/authSlice';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const loadOnboardingStatus = createAsyncThunk(
  'onboarding/loadStatus',
  async (_, { getState }) => {
    const userId = getState().auth?.user?.id;
    const profile = await onboardingService.loadProfile(userId);
    return profile; // null if not yet onboarded
  },
);

export const completeOnboarding = createAsyncThunk(
  'onboarding/complete',
  async (profileData, { getState }) => {
    const userId = getState().auth?.user?.id;
    return await onboardingService.saveProfile(profileData, userId);
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  completed: false,
  loaded: false,
  loading: false,
  profile: null, // { farmName, farmType, farmSize, location, language }
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    resetOnboarding: () => initialState,
  },
  extraReducers: (builder) => {
    // loadOnboardingStatus
    builder
      .addCase(loadOnboardingStatus.fulfilled, (state, action) => {
        state.loaded = true;
        if (action.payload) {
          state.completed = true;
          state.profile = action.payload;
        }
      })
      .addCase(loadOnboardingStatus.rejected, (state) => {
        state.loaded = true;
      });

    // completeOnboarding
    builder
      .addCase(completeOnboarding.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        state.loading = false;
        state.completed = true;
        state.profile = action.payload;
      })
      .addCase(completeOnboarding.rejected, (state) => {
        state.loading = false;
      });

    // The profile screen edits the farm name and location, which live here
    // rather than on the user. Without this the save succeeds server-side but
    // the dashboard and farm map widget keep showing the old values until the
    // app is restarted.
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      const farm = action.payload?.farm;
      if (farm && state.profile) {
        state.profile = { ...state.profile, ...farm };
      }
    });

    // Reset on logout
    builder.addCase(logout.fulfilled, () => initialState);
  },
});

export const { resetOnboarding } = onboardingSlice.actions;
export default onboardingSlice.reducer;
