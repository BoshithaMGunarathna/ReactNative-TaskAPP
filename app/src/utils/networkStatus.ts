import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

let isOnline = true;
let listeners: Array<(online: boolean) => void> = [];
let isInitialized = false;

// Initialize network status monitoring
export const initializeNetworkMonitoring = () => {
  if (isInitialized) return;
  isInitialized = true;
  
  NetInfo.fetch().then((state: NetInfoState) => {
    isOnline = state.isConnected ?? true;
  }).catch(() => {
    isOnline = true; 
  });

  NetInfo.addEventListener((state: NetInfoState) => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? true;
    

    if (wasOnline !== isOnline) {
      listeners.forEach(listener => listener(isOnline));
    }
  });
};

// Get current online status
export const getIsOnline = (): boolean => {

  if (!isInitialized) {
    initializeNetworkMonitoring();
  }
  return isOnline;
};

// Subscribe to network status changes
export const subscribeToNetworkStatus = (callback: (online: boolean) => void): (() => void) => {
  listeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(listener => listener !== callback);
  };
};
