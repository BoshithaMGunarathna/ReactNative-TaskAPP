import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../services/api";
import {
  cacheMessages,
  getCachedMessages,
  addPendingMessage,
  getPendingMessages,
  removePendingMessage,
  PendingMessage,
} from "../utils/storage";
import { getIsOnline } from "../utils/networkStatus";

interface Message {
  id: string;
  text: string;
  timestamp?: number;
  senderId?: string;
  user_id?: string;
  user_name?: string;
  created_at?: number;
  is_read?: boolean;
}

interface MessagesState {
  messages: Message[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  refreshing: boolean;
  isOnline: boolean;
  pendingMessages: PendingMessage[];
  isSyncing: boolean;
}

const initialState: MessagesState = {
  messages: [],
  status: "idle",
  error: null,
  refreshing: false,
  isOnline: true,
  pendingMessages: [],
  isSyncing: false,
};

// Async thunk for fetching messages
export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async (params: { userId?: string } | undefined, { rejectWithValue }) => {
    try {
      const userId = params?.userId;
      // Check if online
      const isOnline = getIsOnline();

      if (!isOnline) {
        const cached = await getCachedMessages();
        return { messages: cached, fromCache: true };
      }

      // Fetch from server if online
      const url = userId ? `/messages?user_id=${userId}` : "/messages";
      const response = await api.get(url);

      // Cache the fetched messages
      await cacheMessages(response.data);

      return { messages: response.data, fromCache: false };
    } catch (error: any) {
      // If fetch fails, try to return cached messages
      const cached = await getCachedMessages();
      if (cached.length > 0) {
        return { messages: cached, fromCache: true };
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch messages"
      );
    }
  }
);

// Async thunk for posting a message (with offline support)
export const postMessage = createAsyncThunk(
  "messages/postMessage",
  async (
    { user_id, text }: { user_id: string; text: string },
    { rejectWithValue }
  ) => {
    try {
      const isOnline = getIsOnline();

      if (!isOnline) {
        // Queue message for later if offline
        const pendingMessage: PendingMessage = {
          tempId: `temp_${Date.now()}_${Math.random()}`,
          text,
          user_id,
          timestamp: Date.now(),
          retryCount: 0,
        };

        await addPendingMessage(pendingMessage);

        // Return a temporary message for immediate display
        return {
          id: pendingMessage.tempId,
          text,
          user_id,
          timestamp: pendingMessage.timestamp,
          senderId: user_id,
          pending: true,
        };
      }

      // Send message if online
      const response = await api.post("/messages", { user_id, text });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message"
      );
    }
  }
);

// Async thunk for syncing pending messages
export const syncPendingMessages = createAsyncThunk(
  "messages/syncPendingMessages",
  async (userId: string, { dispatch }) => {
    try {
      const pendingMessages = await getPendingMessages();
      const results = [];

      for (const pending of pendingMessages) {
        try {
          const response = await api.post("/messages", {
            user_id: pending.user_id,
            text: pending.text,
          });

          // Remove from pending after successful send
          await removePendingMessage(pending.tempId);
          results.push({
            success: true,
            tempId: pending.tempId,
            message: response.data,
          });
        } catch (error) {
          console.error("Failed to sync message:", error);
          results.push({ success: false, tempId: pending.tempId });
        }
      }

      return results;
    } catch (error: any) {
      console.error("Error syncing pending messages:", error);
      return [];
    }
  }
);

// Load cached messages and pending messages on app start
export const loadCachedData = createAsyncThunk(
  "messages/loadCachedData",
  async () => {
    const [cachedMessages, pendingMessages] = await Promise.all([
      getCachedMessages(),
      getPendingMessages(),
    ]);

    return { cachedMessages, pendingMessages };
  }
);

// Async thunk for marking messages as read
export const markMessagesAsRead = createAsyncThunk(
  "messages/markMessagesAsRead",
  async ({ userId, messageId }: { userId: string; messageId: string }) => {
    try {
      const isOnline = getIsOnline();
      if (!isOnline) {
        // Skip marking as read if offline, will sync later
        return { success: false, offline: true };
      }

      const response = await api.post("/messages/mark-read", {
        user_id: userId,
        message_id: messageId,
      });
      return response.data;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return { success: false };
    }
  }
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<any>) => {
      const messageExists = state.messages.some(
        (msg) => msg.id === action.payload.id
      );
      if (!messageExists) {
        state.messages.push(action.payload);
        // Update cache
        cacheMessages(state.messages);
      }
    },
    clearMessageError: (state) => {
      state.error = null;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    removePendingMessageFromState: (state, action: PayloadAction<string>) => {
      state.pendingMessages = state.pendingMessages.filter(
        (msg) => msg.tempId !== action.payload
      );
      state.messages = state.messages.filter(
        (msg) => msg.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        if (!state.refreshing) {
          state.status = "loading";
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.messages = action.payload.messages;
        state.error = null;
        state.refreshing = false;

        if (action.payload.fromCache) {
          state.error = "Showing cached messages (offline)";
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to load messages";
        state.refreshing = false;
      })
      // Post message
      .addCase(postMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(postMessage.fulfilled, (state, action) => {
        state.error = null;
        // If message is pending (offline), add it to pending list
        if ((action.payload as any).pending) {
          const pendingMsg: PendingMessage = {
            tempId: action.payload.id,
            text: action.payload.text,
            user_id: action.payload.user_id || action.payload.senderId || "",
            timestamp: action.payload.timestamp || Date.now(),
            retryCount: 0,
          };
          state.pendingMessages.push(pendingMsg);
        }
      })
      .addCase(postMessage.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to send message";
      })
      // Sync pending messages
      .addCase(syncPendingMessages.pending, (state) => {
        state.isSyncing = true;
      })
      .addCase(syncPendingMessages.fulfilled, (state, action) => {
        state.isSyncing = false;

        // Remove successfully synced messages from pending
        action.payload.forEach((result: any) => {
          if (result.success) {
            state.pendingMessages = state.pendingMessages.filter(
              (msg) => msg.tempId !== result.tempId
            );
            // Replace temp message with real one
            const tempIndex = state.messages.findIndex(
              (msg) => msg.id === result.tempId
            );
            if (tempIndex !== -1 && result.message) {
              state.messages[tempIndex] = result.message;
            }
          }
        });
      })
      .addCase(syncPendingMessages.rejected, (state) => {
        state.isSyncing = false;
      })
      // Load cached data
      .addCase(loadCachedData.fulfilled, (state, action) => {
        if (action.payload.cachedMessages.length > 0) {
          state.messages = action.payload.cachedMessages;
        }
        state.pendingMessages = action.payload.pendingMessages;
      });
  },
});

export const {
  addMessage,
  clearMessageError,
  setRefreshing,
  setOnlineStatus,
  removePendingMessageFromState,
} = messagesSlice.actions;
export default messagesSlice.reducer;
