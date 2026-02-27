import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { useAuth } from "../../stores/AuthProvider";
import { useToast } from "../../stores/ToastProvider";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      addToast("Please fill all fields", "warning");
      return;
    }
    if (!bloodGroup) {
      addToast("Please select your blood group", "warning");
      return;
    }
    if (password.length < 6) {
      addToast("Password must be at least 6 characters", "warning");
      return;
    }
    setLoading(true);
    try {
      const success = await register(
        email,
        password,
        name,
        "donor",
        bloodGroup,
      );
      if (success) {
        addToast("Registration successful! You are now signed in.", "success");
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

          {/* Blood Group Selector */}
          <Text style={styles.selectorLabel}>Blood Group *</Text>
          <View style={styles.chipRow}>
            {BLOOD_GROUPS.map((bg) => (
              <TouchableOpacity
                key={bg}
                onPress={() => setBloodGroup(bg)}
                style={[styles.chip, bloodGroup === bg && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    bloodGroup === bg && styles.chipTextActive,
                  ]}
                >
                  {bg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
  selectorLabel: {
    ...FONTS.label,
    color: COLORS.text_muted,
    marginBottom: SPACING.s,
    marginTop: SPACING.s,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.s,
    marginBottom: SPACING.l,
  },
  chip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 52,
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...FONTS.label,
    color: COLORS.text_muted,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: "700",
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
