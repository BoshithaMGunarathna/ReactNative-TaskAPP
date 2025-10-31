import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
  },
});

export const { addMessage } = messagesSlice.actions;
export default messagesSlice.reducer;
