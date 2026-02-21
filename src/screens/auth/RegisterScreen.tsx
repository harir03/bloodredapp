import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { useAuth } from "../../stores/AuthProvider";
import { useToast } from "../../stores/ToastProvider";

const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      addToast("Please fill all fields", "warning");
      return;
    }
    if (password.length < 6) {
      addToast("Password must be at least 6 characters", "warning");
      return;
    }
    setLoading(true);
    try {
      const success = await register(email, password, name);
      if (success) {
        addToast("Registration successful! You are now signed in.", "success");
        // Auth state listener will auto-navigate
      } else {
        addToast("Registration failed", "danger");
      }
    } catch (e: any) {
      addToast(e.message || "Registration failed", "danger");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.formContainer}>
          <AppInput
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
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
          <AppButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
          />
          <Text style={styles.loginText}>
            {"Already have an account? "}
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              Sign In
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
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text_primary,
    textAlign: "center",
    marginBottom: SPACING.xxxl,
  },
  loginText: {
    ...FONTS.body,
    color: COLORS.text_muted,
    textAlign: "center",
    marginTop: SPACING.l,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});

export default RegisterScreen;
