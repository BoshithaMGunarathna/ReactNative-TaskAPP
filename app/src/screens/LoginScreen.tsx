import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../store/store';
import { loginUser } from '../store/userSlice';
import { RootStackParamList } from '../../App';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const userStatus = useSelector((state: RootState) => state.user.status);

  useEffect(() => {
    if (userStatus === 'succeeded') {
      navigation.navigate('Main');
    }
  }, [userStatus, navigation]);

  const handleLogin = () => {
    if (name.trim()) {
      dispatch(loginUser(name));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        editable={userStatus !== 'loading'}
      />
      
      {userStatus === 'loading' ? (
        <ActivityIndicator 
          size="large" 
          color="#0000ff" 
          style={styles.loader}
        />
      ) : (
        <Button 
          title="Login" 
          onPress={handleLogin}
          disabled={!name.trim()}
        />
      )}
      
      {userStatus === 'failed' && (
        <Text style={styles.errorText}>Login failed. Please try again.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  loader: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});

export default LoginScreen;


