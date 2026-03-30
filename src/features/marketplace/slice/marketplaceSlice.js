import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { marketplaceService } from '../../../services/api';
import { MOCK_CHATS } from '../mock/marketplaceMockData';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchListings = createAsyncThunk(
  'marketplace/fetchListings',
  async (_, { rejectWithValue }) => {
    try {
      return await marketplaceService.fetchListings();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMandiPrices = createAsyncThunk(
  'marketplace/fetchMandiPrices',
  async (_, { rejectWithValue }) => {
    try {
      return await marketplaceService.fetchMandiPrices();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMyListings = createAsyncThunk(
  'marketplace/fetchMyListings',
  async (_, { rejectWithValue }) => {
    try {
      return await marketplaceService.fetchMyListings();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createListing = createAsyncThunk(
  'marketplace/createListing',
  async (listingData, { rejectWithValue }) => {
    try {
      return await marketplaceService.createListing(listingData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  listings: [],
  mandiPrices: [],
  myListings: [],
  priceAlerts: [],
  chats: MOCK_CHATS,
  selectedCategory: 'all',
  loading: false,
  error: null,
};

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    addPriceAlert: (state, action) => {
      const { commodity, targetPrice } = action.payload;
      const existing = state.priceAlerts.findIndex((a) => a.commodity === commodity);
      if (existing >= 0) {
        state.priceAlerts[existing].targetPrice = targetPrice;
      } else {
        state.priceAlerts.push({ commodity, targetPrice });
      }
    },
    removePriceAlert: (state, action) => {
      state.priceAlerts = state.priceAlerts.filter((a) => a.commodity !== action.payload);
    },
    initChat: (state, action) => {
      const { chatId, listing, otherUser } = action.payload;
      if (!state.chats[chatId]) {
        state.chats[chatId] = {
          chatId,
          listing,
          otherUser,
          messages: [],
        };
      }
    },
    sendMessage: (state, action) => {
      const { chatId, text, sender } = action.payload;
      if (state.chats[chatId]) {
        state.chats[chatId].messages.push({
          id: `msg-${Date.now()}`,
          text,
          sender,
          timestamp: new Date().toISOString(),
        });
      }
    },
  },
  extraReducers: (builder) => {
    // fetchListings
    builder
      .addCase(fetchListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload;
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchMandiPrices
    builder
      .addCase(fetchMandiPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMandiPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.mandiPrices = action.payload;
      })
      .addCase(fetchMandiPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchMyListings
    builder
      .addCase(fetchMyListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyListings.fulfilled, (state, action) => {
        state.loading = false;
        state.myListings = action.payload;
      })
      .addCase(fetchMyListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createListing
    builder
      .addCase(createListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createListing.fulfilled, (state, action) => {
        state.loading = false;
        state.myListings.unshift(action.payload);
        state.listings.unshift(action.payload);
      })
      .addCase(createListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCategory, addPriceAlert, removePriceAlert, initChat, sendMessage } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
