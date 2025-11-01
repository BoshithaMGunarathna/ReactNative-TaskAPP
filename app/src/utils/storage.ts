import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGES_CACHE_KEY = '@messages_cache';
const PENDING_MESSAGES_KEY = '@pending_messages';
const LAST_SYNC_KEY = '@last_sync_timestamp';

export interface CachedMessage {
  id: string;
  text: string;
  user_id?: string;
  user_name?: string;
  created_at?: number;
  is_read?: boolean;
  senderId?: string;
  timestamp?: number;
}

export interface PendingMessage {
  tempId: string;
  text: string;
  user_id: string;
  timestamp: number;
  retryCount: number;
}

// Cache messages to AsyncStorage
export const cacheMessages = async (messages: CachedMessage[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(messages));
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error caching messages:', error);
  }
};

// Get cached messages
export const getCachedMessages = async (): Promise<CachedMessage[]> => {
  try {
    const cached = await AsyncStorage.getItem(MESSAGES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error getting cached messages:', error);
    return [];
  }
};

// Add pending message (to be sent when online)
export const addPendingMessage = async (message: PendingMessage): Promise<void> => {
  try {
    const pending = await getPendingMessages();
    pending.push(message);
    await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(pending));
  } catch (error) {
    console.error('Error adding pending message:', error);
  }
};

// Get pending messages
export const getPendingMessages = async (): Promise<PendingMessage[]> => {
  try {
    const pending = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error('Error getting pending messages:', error);
    return [];
  }
};

// Remove pending message after successful send
export const removePendingMessage = async (tempId: string): Promise<void> => {
  try {
    const pending = await getPendingMessages();
    const filtered = pending.filter(msg => msg.tempId !== tempId);
    await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing pending message:', error);
  }
};

// Clear all pending messages
export const clearPendingMessages = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing pending messages:', error);
  }
};

// Get last sync timestamp
export const getLastSyncTime = async (): Promise<number> => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp) : 0;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return 0;
  }
};

// Clear all cache
export const clearCache = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([MESSAGES_CACHE_KEY, PENDING_MESSAGES_KEY, LAST_SYNC_KEY]);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
