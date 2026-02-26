import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockDelay } from '../../../utils/mockDelay';
import {
  MOCK_FIELDS,
  MOCK_FIELD_GROWTH_DATA,
} from '../mock/fieldsMockData';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchFields = createAsyncThunk(
  'fields/fetchFields',
  async (_, { rejectWithValue }) => {
    try {
      await mockDelay(600);
      return {
        fields: [...MOCK_FIELDS],
        growthData: [...MOCK_FIELD_GROWTH_DATA],
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  fields: [],
  selectedField: null,
  growthData: [],
  loading: false,
  error: null,
};

const fieldsSlice = createSlice({
  name: 'fields',
  initialState,
  reducers: {
    selectField: (state, action) => {
      state.selectedField = action.payload;
    },
    clearSelectedField: (state) => {
      state.selectedField = null;
    },
  },
  extraReducers: (builder) => {
    // fetchFields
    builder
      .addCase(fetchFields.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        state.loading = false;
        state.fields = action.payload.fields;
        state.growthData = action.payload.growthData;
      })
      .addCase(fetchFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { selectField, clearSelectedField } = fieldsSlice.actions;
export default fieldsSlice.reducer;
