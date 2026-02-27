import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { useAuth } from "../../stores/AuthProvider";
import { useToast } from "../../stores/ToastProvider";

const LoginScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      addToast("Please fill in all fields", "warning");
      return;
    }
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        addToast("Login successful", "success");
      } else {
        addToast("Invalid email or password", "danger");
      }
    } catch (e: any) {
      addToast(e.message || "Login failed", "danger");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.l }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🩸</Text>
          <Text style={styles.appName}>BloodConnect Ops</Text>
          <Text style={styles.tagline}>Internal Operations Management</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign In</Text>
          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <AppInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />
          <AppButton title="Sign In" onPress={handleLogin} loading={loading} />

          <Text style={styles.registerText}>
            {"Don't have an account? "}
            <Text
              style={styles.registerLink}
              onPress={() => navigation.navigate("Register")}
            >
              Register
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.xxl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xxxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: SPACING.m,
  },
  appName: {
    ...FONTS.h1,
    color: COLORS.primary,
    textAlign: "center",
  },
  tagline: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text_primary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  registerText: {
    ...FONTS.body,
    color: COLORS.text_muted,
    textAlign: "center",
    marginTop: SPACING.l,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});

export default LoginScreen;
