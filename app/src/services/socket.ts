import { io } from 'socket.io-client';

// Use the same base URL as the API (without /api path)
const baseURL = 'http://192.168.181.122:4000';

// Create and export socket instance
export const socket = io(baseURL);

// Connection event listener
socket.on('connect', () => {
  console.log('connected to socket server');
});
