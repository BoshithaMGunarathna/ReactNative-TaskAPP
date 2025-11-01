import React, { useEffect, useState } from "react";
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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  fetchMessages,
  postMessage,
  addMessage,
  clearMessageError,
  setRefreshing,
  markMessagesAsRead,
  syncPendingMessages,
  loadCachedData,
  setOnlineStatus,
} from "../store/messagesSlice";
import { socket } from "../services/socket";
import { showAlert } from "../utils/alert";
import {
  subscribeToNetworkStatus,
  initializeNetworkMonitoring,
} from "../utils/networkStatus";
import { setupNotificationListeners } from "../utils/notifications";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

interface ThemeSettings {
  ownMessageColor: string;
  otherMessageColor: string;
  backgroundColor: string;
  textColor: string;
}

const defaultTheme: ThemeSettings = {
  ownMessageColor: "#2196F3",
  otherMessageColor: "#f1f1f1",
  backgroundColor: "#fff",
  textColor: "#000",
};

const MainScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((state: RootState) => state.messages.messages);
  const status = useSelector((state: RootState) => state.messages.status);
  const messageError = useSelector((state: RootState) => state.messages.error);
  const refreshing = useSelector(
    (state: RootState) => state.messages.refreshing
  );
  const isOnline = useSelector((state: RootState) => state.messages.isOnline);
  const isSyncing = useSelector((state: RootState) => state.messages.isSyncing);
  const pendingMessages = useSelector(
    (state: RootState) => state.messages.pendingMessages
  );
  const userId = useSelector((state: RootState) => state.user.id);
  const userName = useSelector((state: RootState) => state.user.name);
  const lastReadMessageId = useSelector(
    (state: RootState) => state.user.lastReadMessageId
  );
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);

  // Load theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("chatTheme");
        if (savedTheme) {
          setTheme(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };
    loadTheme();

    // Re-load theme when screen comes into focus
    const unsubscribe = navigation.addListener("focus", loadTheme);
    return unsubscribe;
  }, [navigation]);

  // Initialize network monitoring on mount
  useEffect(() => {
    initializeNetworkMonitoring();

    // Load cached data first
    dispatch(loadCachedData());
  }, [dispatch]);

  // Setup notification listeners
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log("📬 New message notification received:", notification);
        if (userId) {
          dispatch(fetchMessages({ userId }));
        }
      },

      (response) => {
        console.log("👆 Notification tapped:", response);

        if (userId) {
          dispatch(fetchMessages({ userId }));
        }
      }
    );

    return cleanup;
  }, [dispatch, userId]);

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribe = subscribeToNetworkStatus((online) => {
      dispatch(setOnlineStatus(online));

      if (online) {
        if (userId && pendingMessages.length > 0) {
          dispatch(syncPendingMessages(userId));
        }
        // Refresh messages
        if (userId) {
          dispatch(fetchMessages({ userId }));
        } else {
          dispatch(fetchMessages(undefined));
        }
      }
    });

    return unsubscribe;
  }, [dispatch, userId, pendingMessages]);

  useEffect(() => {
    if (userId) {
      dispatch(fetchMessages({ userId }));
    } else {
      dispatch(fetchMessages(undefined));
    }
  }, [dispatch, userId]);

  // Show alert for message errors
  useEffect(() => {
    if (messageError) {
      showAlert("Error", messageError, [
        { text: "OK", onPress: () => dispatch(clearMessageError()) },
      ]);
    }
  }, [messageError, dispatch]);

  // Notify server when user joins the chat
  useEffect(() => {
    if (userId && userName) {
      socket.emit("user:join", { userId, userName });
    }
  }, [userId, userName]);

  // Socket listener for real-time messages
  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      dispatch(addMessage(newMessage));
    };

    socket.on("message:new", handleNewMessage);

    // Cleanup function to remove listener
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [dispatch]);

  // Mark messages as read when user scrolls or views them
  useEffect(() => {
    if (userId && messages.length > 0) {
      const latestMessageId = messages[messages.length - 1].id;
      if (
        latestMessageId &&
        (!lastReadMessageId || parseInt(latestMessageId) > lastReadMessageId)
      ) {
        const timer = setTimeout(() => {
          dispatch(markMessagesAsRead({ userId, messageId: latestMessageId }));
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, userId, lastReadMessageId, dispatch]);

  const handleRefresh = async () => {
    dispatch(setRefreshing(true));
    if (userId) {
      await dispatch(fetchMessages({ userId }));
    } else {
      await dispatch(fetchMessages(undefined));
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && userId && !isSending) {
      setIsSending(true);
      try {
        const result = await dispatch(
          postMessage({ user_id: userId, text: newMessage })
        );
        if (postMessage.fulfilled.match(result)) {
          setNewMessage("");

          const sentMessage = result.payload as any;
          if (sentMessage && sentMessage.id) {
            dispatch(markMessagesAsRead({ userId, messageId: sentMessage.id }));
          }
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  if (status === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.user_id === userId || item.senderId === userId;
    const userName = item.user_name || `User ${item.user_id || item.senderId}`;
    const timestamp = item.created_at || item.timestamp;
    const isPending =
      item.id && typeof item.id === "string" && item.id.startsWith("temp_");

    const showUnreadDivider =
      !isOwnMessage &&
      lastReadMessageId &&
      !isPending &&
      parseInt(item.id) > lastReadMessageId &&
      (index === 0 || parseInt(messages[index - 1].id) <= lastReadMessageId);

    return (
      <>
        {showUnreadDivider && (
          <View style={styles.unreadDividerContainer}>
            <View style={styles.unreadDividerLine} />
            <Text style={styles.unreadDividerText}>Unread Messages</Text>
            <View style={styles.unreadDividerLine} />
          </View>
        )}
        <TouchableOpacity
          onLongPress={() =>
            navigation.navigate("MessageDetails", { message: item })
          }
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.messageContainer,
              isOwnMessage && styles.ownMessageContainer,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isOwnMessage
                  ? [
                      styles.ownMessageBubble,
                      { backgroundColor: theme.ownMessageColor },
                    ]
                  : [
                      styles.otherMessageBubble,
                      { backgroundColor: theme.otherMessageColor },
                    ],
                isPending && styles.pendingMessageBubble,
              ]}
            >
              <Text
                style={[
                  styles.userName,
                  isOwnMessage && styles.ownMessageUserName,
                ]}
              >
                {userName}
              </Text>
              <Text
                style={[
                  styles.messageText,
                  isOwnMessage && styles.ownMessageText,
                ]}
              >
                {item.text}
              </Text>
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.timestamp,
                    isOwnMessage && styles.ownMessageTimestamp,
                  ]}
                >
                  {timestamp
                    ? new Date(timestamp).toLocaleString()
                    : "Just now"}
                </Text>
                {isPending && (
                  <Text style={styles.pendingText}>⏳ Sending...</Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Global Chat Room</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("UserList")}
              >
                <Ionicons name="people" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("Settings")}
              >
                <Ionicons name="settings" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>📡 Offline Mode</Text>
            </View>
          )}
          {isSyncing && (
            <View style={styles.syncingBanner}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.syncingText}>Syncing messages...</Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="height"
        keyboardVerticalOffset={0}
      >
        <View
          style={[styles.chatArea, { backgroundColor: theme.backgroundColor }]}
        >
          {status === "failed" && (
            <Text style={styles.errorText}>Failed to load messages.</Text>
          )}
          <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            style={{ backgroundColor: theme.backgroundColor }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No messages yet.</Text>
            }
            inverted={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#2196F3"]}
                tintColor="#2196F3"
                title="Pull to refresh"
                titleColor="#666"
              />
            }
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline={true}
              maxLength={500}
              editable={!isSending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || !userId || isSending) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || !userId || isSending}
              activeOpacity={0.7}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingTop: 28,
    paddingBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  chatArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  offlineBanner: {
    backgroundColor: "#ff9800",
    padding: 8,
    alignItems: "center",
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  syncingBanner: {
    backgroundColor: "#4CAF50",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  syncingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContent: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  ownMessageContainer: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  otherMessageBubble: {
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start",
  },
  ownMessageBubble: {
    backgroundColor: "#2196F3",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  pendingMessageBubble: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: "#ffc107",
    borderStyle: "dashed",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  pendingText: {
    fontSize: 10,
    color: "#ffc107",
    fontStyle: "italic",
    marginLeft: 8,
  },
  userName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  ownMessageUserName: {
    color: "#fff",
  },
  messageText: {
    fontSize: 16,
    color: "#000",
    marginBottom: 4,
    lineHeight: 20,
  },
  ownMessageText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    color: "#666",
    alignSelf: "flex-end",
  },
  ownMessageTimestamp: {
    color: "#e3f2fd",
  },
  unreadDividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  unreadDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ff9800",
  },
  unreadDividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: "bold",
    color: "#ff9800",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MainScreen;
