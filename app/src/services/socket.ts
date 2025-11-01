import { io } from 'socket.io-client';


const baseURL = 'http://192.168.181.122:4000';

// Create and export socket instance with reconnection settings
export const socket = io(baseURL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

// Connection event listeners
socket.on('connect', () => {
  console.log('✅ Connected to socket server');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from socket server:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected, try to reconnect manually
    socket.connect();
  }
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Reconnected to socket server after', attemptNumber, 'attempts');
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('🔄 Attempting to reconnect... (attempt', attemptNumber, ')');
});

socket.on('reconnect_error', (error) => {
  console.log('❌ Reconnection error:', error.message);
});

socket.on('reconnect_failed', () => {
  console.log('❌ Failed to reconnect to socket server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

