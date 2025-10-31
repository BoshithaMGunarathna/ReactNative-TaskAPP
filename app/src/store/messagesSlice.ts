import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  senderId: string;
}

interface MessagesState {
  messages: Message[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: MessagesState = {
  messages: [],
  status: 'idle',
};

// Async thunk for fetching messages
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async () => {
    const response = await api.get('/messages');
    return response.data;
  }
);

// Async thunk for posting a message
export const postMessage = createAsyncThunk(
  'messages/postMessage',
  async ({ user_id, text }: { user_id: string; text: string }) => {
    const response = await api.post('/messages', { user_id, text });
    return response.data;
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { addMessage } = messagesSlice.actions;
export default messagesSlice.reducer;
