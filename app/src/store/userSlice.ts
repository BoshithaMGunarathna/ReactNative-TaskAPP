import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

interface UserState {
  id: string | null;
  name: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  suggestions: string[];
  requiresPassword: boolean;
  lastReadMessageId: number | null;
}

const initialState: UserState = {
  id: null,
  name: null,
  status: 'idle',
  error: null,
  suggestions: [],
  requiresPassword: false,
  lastReadMessageId: null,
};


export const loginUser = createAsyncThunk(
  'user/loginUser',
  async ({ name, password }: { name: string; password: string }, { rejectWithValue }) => {
    try {
      // First check if user exists
      const checkResponse = await api.post('/users/check', { name });
      
      if (checkResponse.data.requiresPassword) {
        //  login with password
        const loginResponse = await api.post('/users/login', { name, password });
        return loginResponse.data;
      } else {
        //  register
        const registerResponse = await api.post('/users', { name, password });
        return registerResponse.data;
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue({
          message: error.response.data.message || 'Login failed',
          error: error.response.data.error,
          requiresPassword: error.response.data.requiresPassword
        });
      }
      return rejectWithValue({
        message: 'Failed to login. Please try again.',
        error: 'unknown'
      });
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
    },
    clearError: (state) => {
      state.error = null;
      state.suggestions = [];
      state.status = 'idle';
    },
    setRequiresPassword: (state, action: PayloadAction<boolean>) => {
      state.requiresPassword = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.suggestions = [];
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.id = action.payload.id;
        state.name = action.payload.name;
        state.lastReadMessageId = action.payload.last_read_message_id || null;
        state.error = null;
        state.suggestions = [];
        state.requiresPassword = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        const payload = action.payload as any;
        state.error = payload?.message || 'Login failed';
        state.suggestions = payload?.suggestions || [];
        state.requiresPassword = payload?.requiresPassword || false;
      });
  },
});

export const { setUser, clearError, setRequiresPassword } = userSlice.actions;
export default userSlice.reducer;
