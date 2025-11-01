import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import UserListScreen from './src/screens/UserListScreen';
import MessageDetailsScreen from './src/screens/MessageDetailsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { initializeNetworkMonitoring } from './src/utils/networkStatus';

enableScreens(false);

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  UserList: undefined;
  MessageDetails: { message: any };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Initialize network monitoring when app starts
    initializeNetworkMonitoring();
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Main" 
            component={MainScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="UserList" 
            component={UserListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="MessageDetails" 
            component={MessageDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});

