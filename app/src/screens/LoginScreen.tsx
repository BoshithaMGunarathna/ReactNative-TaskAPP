import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Button,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppDispatch, RootState } from "../store/store";
import { loginUser, clearError } from "../store/userSlice";
import { RootStackParamList } from "../../App";
import { showAlert } from "../utils/alert";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

const { width, height } = Dimensions.get("window");

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

interface Stats {
  totalUsers: number;
  activeUsers: number;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeUsers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const userStatus = useSelector((state: RootState) => state.user.status);
  const userId = useSelector((state: RootState) => state.user.id);
  const error = useSelector((state: RootState) => state.user.error);
  const suggestions = useSelector((state: RootState) => state.user.suggestions);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Animation
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Animate gradient colors
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Fetch user statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userStatus === "succeeded" && userId) {
      // Register for push notifications after successful login
      // Note: Push notifications don't work in Expo Go (SDK 53+)
      registerForPushNotificationsAsync()
        .then(async (token) => {
          if (token) {
            try {
              await api.post("/users/push-token", { userId, pushToken: token });
              console.log("✅ Push token saved to backend");
            } catch (error) {
              console.error("Error saving push token:", error);
            }
          } else {
            console.log(
              "ℹ️  Push notifications unavailable (Expo Go limitation)"
            );
          }
        })
        .catch((error) => {
          console.log("ℹ️  Push notifications require development build");
        });

      showAlert("Success", "You have successfully logged in!", [
        { text: "OK", onPress: () => navigation.navigate("Main") },
      ]);
    }
  }, [userStatus, userId, navigation]);

  // Show alert for errors
  useEffect(() => {
    if (error && userStatus === "failed") {
      showAlert("Login Error", error, [
        { text: "OK", onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, userStatus, dispatch]);

  useEffect(() => {
    if ((name || password) && error) {
      dispatch(clearError());
    }
  }, [name, password, error, dispatch]);

  const handleLogin = () => {
    if (name.trim() && password.trim()) {
      dispatch(loginUser({ name: name.trim(), password: password.trim() }));
    }
  };

  const handleSuggestionPress = (suggestedName: string) => {
    setName(suggestedName);
    dispatch(clearError());
  };

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#667eea",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb", "#4facfe"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={["#4facfe", "#00f2fe", "#43e97b", "#38f9d7"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* User Statistics - Top Right Corner */}
          <View style={styles.statsContainerTopRight}>
            {loadingStats ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.statsRow}>
                <Text style={styles.statTextSmall}>
                  <Text style={styles.statNumberSmall}>{stats.totalUsers}</Text>{" "}
                  users •{" "}
                  <Text
                    style={[styles.statNumberSmall, styles.activeNumberSmall]}
                  >
                    {stats.activeUsers}
                  </Text>{" "}
                  online
                </Text>
              </View>
            )}
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="chatbubbles" size={50} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>Welcome to Global Chat</Text>
          <Text style={styles.subtitle}>Login or create a new account</Text>

          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Enter your username"
              placeholderTextColor="rgba(100, 100, 100, 0.6)"
              value={name}
              onChangeText={setName}
              editable={userStatus !== "loading"}
              autoCapitalize="none"
              maxLength={30}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Enter your password"
                placeholderTextColor="rgba(100, 100, 100, 0.6)"
                value={password}
                onChangeText={setPassword}
                editable={userStatus !== "loading"}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                maxLength={50}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              New user? Just enter a username and password to register!
            </Text>

            {userStatus === "loading" ? (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={styles.loader}
              />
            ) : (
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!name.trim() || !password.trim()) &&
                    styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!name.trim() || !password.trim()}
              >
                <Text style={styles.loginButtonText}>Continue</Text>
              </TouchableOpacity>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>

                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>
                      Try these instead:
                    </Text>
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionButton}
                        onPress={() => handleSuggestionPress(suggestion)}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  statsContainerTopRight: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statTextSmall: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  statNumberSmall: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "Poppins_700Bold",
  },
  activeNumberSmall: {
    color: "#4CAF50",
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: "Poppins_700Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 40,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    width: "100%",
    height: 55,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    fontFamily: "Poppins_400Regular",
  },
  inputError: {
    borderColor: "#ff3b30",
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  passwordContainer: {
    width: "100%",
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    top: 14,
    padding: 5,
  },
  hint: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: "Poppins_500Medium",
  },
  loginButton: {
    width: "100%",
    height: 55,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  loginButtonText: {
    color: "#667eea",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Poppins_700Bold",
  },
  loader: {
    marginTop: 10,
  },
  errorContainer: {
    width: "100%",
    marginTop: 20,
    padding: 18,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 193, 7, 0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: "#856404",
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    fontFamily: "Poppins_700Bold",
  },
  suggestionButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  suggestionText: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
});

export default LoginScreen;
