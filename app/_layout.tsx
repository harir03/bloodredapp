import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "../src/navigation/RootNavigator";
import { AuthProvider } from "../src/stores/AuthProvider";
import { NotificationProvider } from "../src/stores/NotificationProvider";
import { ToastProvider } from "../src/stores/ToastProvider";

// Prevent splash screen from hiding until fonts are loaded
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <RootNavigator />
              <StatusBar style="light" />
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
