import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchMessages, postMessage, addMessage } from '../store/messagesSlice';
import { socket } from '../services/socket';

interface Message {
  id: string;
  text: string;
  timestamp?: number;
  senderId?: string;
  user_id?: string;
  user_name?: string;
  created_at?: number;
}

const MainScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((state: RootState) => state.messages.messages);
  const status = useSelector((state: RootState) => state.messages.status);
  const userId = useSelector((state: RootState) => state.user.id);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    dispatch(fetchMessages());
  }, [dispatch]);

  // Socket listener for real-time messages
  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      dispatch(addMessage(newMessage));
    };

    socket.on('message:new', handleNewMessage);

    // Cleanup function to remove listener
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [dispatch]);

  const handleSendMessage = () => {
    if (newMessage.trim() && userId) {
      dispatch(postMessage({ user_id: userId, text: newMessage }));
      setNewMessage('');
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color="#0000ff"
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Message }) => {
    const isOwnMessage = item.user_id === userId || item.senderId === userId;
    const userName = item.user_name || `User ${item.user_id || item.senderId}`;
    const timestamp = item.created_at || item.timestamp;
    
    return (
      <View style={[
        styles.messageItem,
        isOwnMessage && styles.ownMessage
      ]}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userId}>ID: {item.user_id || item.senderId}</Text>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {timestamp ? new Date(timestamp).toLocaleString() : 'Just now'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Text style={styles.title}>Global Chat Room</Text>
        {status === 'failed' && (
          <Text style={styles.errorText}>Failed to load messages.</Text>
        )}
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages yet.</Text>
          }
          inverted={false}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline={true}
            maxLength={500}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!newMessage.trim() || !userId) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || !userId}
            activeOpacity={0.7}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 15,
    paddingBottom: 20,
  },
  messageItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  ownMessage: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196F3',
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userId: {
    fontSize: 11,
    color: '#888',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MainScreen;

