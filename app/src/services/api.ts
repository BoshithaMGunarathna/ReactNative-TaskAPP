import axios from 'axios';
import Constants from 'expo-constants';

// Read backend URL from Expo config
const backendUrl = 
  Constants.expoConfig?.extra?.backendUrl || 
  process.env.BACKEND_URL || 
  'http://192.168.181.122:4000';

console.log('🌐 API connecting to:', backendUrl);

const api = axios.create({
  baseURL: `${backendUrl}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
