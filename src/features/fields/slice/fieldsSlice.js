import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fieldsService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchFields = createAsyncThunk(
  'fields/fetchFields',
  async (_, { rejectWithValue }) => {
    try {
      return await fieldsService.fetchFields();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveField = createAsyncThunk(
  'fields/saveField',
  async (field, { rejectWithValue }) => {
    try {
      return await fieldsService.saveField(field);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateField = createAsyncThunk(
  'fields/updateField',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await fieldsService.updateField(id, updates);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteField = createAsyncThunk(
  'fields/deleteField',
  async (id, { rejectWithValue }) => {
    try {
      await fieldsService.deleteField(id);
      return id;
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
  saving: false,
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

    builder
      .addCase(saveField.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveField.fulfilled, (state, action) => {
        state.saving = false;
        state.fields.push(action.payload);
      })
      .addCase(saveField.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateField.fulfilled, (state, action) => {
        const idx = state.fields.findIndex((f) => f.id === action.payload.id);
        if (idx >= 0) state.fields[idx] = { ...state.fields[idx], ...action.payload };
      });

    builder
      .addCase(deleteField.fulfilled, (state, action) => {
        state.fields = state.fields.filter((f) => f.id !== action.payload);
        if (state.selectedField?.id === action.payload) state.selectedField = null;
      });
  },
});

export const { selectField, clearSelectedField } = fieldsSlice.actions;
export default fieldsSlice.reducer;
