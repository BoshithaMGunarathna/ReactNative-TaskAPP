import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const colorPresets = {
  ownMessage: [
    { name: "Blue", color: "#2196F3" },
    { name: "Green", color: "#4CAF50" },
    { name: "Purple", color: "#9C27B0" },
    { name: "Orange", color: "#FF9800" },
    { name: "Red", color: "#F44336" },
    { name: "Teal", color: "#009688" },
  ],
  otherMessage: [
    { name: "Light Gray", color: "#f1f1f1" },
    { name: "Light Blue", color: "#E3F2FD" },
    { name: "Light Green", color: "#E8F5E9" },
    { name: "Light Purple", color: "#F3E5F5" },
    { name: "Light Orange", color: "#FFF3E0" },
    { name: "Light Pink", color: "#FCE4EC" },
  ],
  background: [
    { name: "White", color: "#fff" },
    { name: "Light Gray", color: "#f5f5f5" },
    { name: "Dark", color: "#121212" },
    { name: "Navy", color: "#001f3f" },
    { name: "Cream", color: "#FFF8DC" },
    { name: "Mint", color: "#F0FFF0" },
  ],
};

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

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

  const saveTheme = async (newTheme: ThemeSettings) => {
    try {
      await AsyncStorage.setItem("chatTheme", JSON.stringify(newTheme));
      setTheme(newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const updateColor = (key: keyof ThemeSettings, color: string) => {
    const newTheme = { ...theme, [key]: color };
    saveTheme(newTheme);
  };

  const resetTheme = () => {
    saveTheme(defaultTheme);
    setDarkMode(false);
  };

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      const darkTheme: ThemeSettings = {
        ownMessageColor: "#1976D2",
        otherMessageColor: "#424242",
        backgroundColor: "#121212",
        textColor: "#fff",
      };
      saveTheme(darkTheme);
    } else {
      saveTheme(defaultTheme);
    }
  };

  const ColorPicker = ({
    title,
    colors,
    selectedColor,
    onSelect,
  }: {
    title: string;
    colors: { name: string; color: string }[];
    selectedColor: string;
    onSelect: (color: string) => void;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.colorGrid}>
        {colors.map((item) => (
          <TouchableOpacity
            key={item.color}
            style={[
              styles.colorOption,
              { backgroundColor: item.color },
              selectedColor === item.color && styles.selectedColor,
            ]}
            onPress={() => onSelect(item.color)}
          >
            {selectedColor === item.color && (
              <Ionicons name="checkmark" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.colorName}>
        {colors.find((c) => c.color === selectedColor)?.name || "Custom"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          Settings
        </Text>
        <TouchableOpacity onPress={resetTheme}>
          <Ionicons name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dark Mode Toggle */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color={theme.textColor} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.textColor }]}>
                  Dark Mode
                </Text>
                <Text style={styles.settingDescription}>
                  Switch to dark theme
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={darkMode ? "#2196F3" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            <Ionicons name="eye-outline" size={20} /> Preview
          </Text>
          <View
            style={[
              styles.previewContainer,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            {/* Other user's message */}
            <View style={styles.previewMessageLeft}>
              <View
                style={[
                  styles.previewBubble,
                  { backgroundColor: theme.otherMessageColor },
                ]}
              >
                <Text style={[styles.previewText, { color: theme.textColor }]}>
                  Hey! How are you?
                </Text>
              </View>
            </View>
            {/* Own message */}
            <View style={styles.previewMessageRight}>
              <View
                style={[
                  styles.previewBubble,
                  { backgroundColor: theme.ownMessageColor },
                ]}
              >
                <Text style={styles.previewText}>I'm great! Thanks 😊</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Own Message Color */}
        <ColorPicker
          title="Your Message Bubble Color"
          colors={colorPresets.ownMessage}
          selectedColor={theme.ownMessageColor}
          onSelect={(color) => updateColor("ownMessageColor", color)}
        />

        {/* Other Message Color */}
        <ColorPicker
          title="Others' Message Bubble Color"
          colors={colorPresets.otherMessage}
          selectedColor={theme.otherMessageColor}
          onSelect={(color) => updateColor("otherMessageColor", color)}
        />

        {/* Background Color */}
        <ColorPicker
          title="Background Color"
          colors={colorPresets.background}
          selectedColor={theme.backgroundColor}
          onSelect={(color) => updateColor("backgroundColor", color)}
        />

        {/* Info Section */}
        <View style={[styles.section, styles.infoSection]}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#2196F3"
          />
          <Text style={styles.infoText}>
            Changes will be applied immediately to the chat screen. Tap the
            refresh icon to reset to default theme.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  selectedColor: {
    borderColor: "#000",
    borderWidth: 3,
  },
  colorName: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  previewContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  previewMessageLeft: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  previewMessageRight: {
    alignItems: "flex-end",
  },
  previewBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
  },
  previewText: {
    fontSize: 14,
    color: "#fff",
  },
  infoSection: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1565C0",
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default SettingsScreen;
