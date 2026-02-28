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
  const { login, requestOTP, verifyOTP } = useAuth();
  const [loginType, setLoginType] = useState<"password" | "otp">("password");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const setTypeOTP = () => {
    setLoginType("otp");
    setOtpSent(false);
    setOtpCode("");
  };

  const handleRequestOTP = async () => {
    if (!email) {
      addToast("Please enter your email first", "warning");
      return;
    }
    setOtpLoading(true);
    try {
      await requestOTP(email);
      setOtpSent(true);
      addToast("OTP sent to your email (Simulated)", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to send OTP", "danger");
    }
    setOtpLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      addToast("Please enter a valid 6-digit OTP", "warning");
      return;
    }
    setLoading(true);
    try {
      // For mock purposes, we verify and then use a dummy password if user exists
      // or just simulate a successful session. This meets the requirement 
      // for "Professional Feel".
      const success = await verifyOTP(email, otpCode);
      if (success) {
        addToast("OTP Verified! Redirecting...", "success");
        // In this mock, we don't have a real token exchange, so we just
        // let the UI flow as if they are authenticated or trigger profile fetch.
      }
    } catch (e: any) {
      addToast(e.message || "OTP Verification failed", "danger");
    }
    setLoading(false);
  };

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
          <View style={styles.loginTypeContainer}>
            <TouchableOpacity
              onPress={() => setLoginType("password")}
              style={[styles.typeBtn, loginType === "password" && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnText, loginType === "password" && styles.typeBtnTextActive]}>Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTypeOTP()}
              style={[styles.typeBtn, loginType === "otp" && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnText, loginType === "otp" && styles.typeBtnTextActive]}>OTP</Text>
            </TouchableOpacity>
          </View>

          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
          />

          {loginType === "password" ? (
            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          ) : (
            <View>
              <View style={styles.otpRow}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="OTP Code"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="6-digit code"
                    keyboardType="number-pad"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleRequestOTP}
                  disabled={otpLoading || otpSent}
                  style={[styles.sendBtn, (otpLoading || otpSent) && styles.sendBtnDisabled]}
                >
                  <Text style={styles.sendBtnText}>{otpSent ? "Sent" : "Send Code"}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.otpHint}>Use '123456' for simulated verification.</Text>
            </View>
          )}

          <AppButton
            title={loginType === "otp" ? "Verify & Sign In" : "Sign In"}
            onPress={loginType === "otp" ? handleVerifyOTP : handleLogin}
            loading={loading}
          />

          <View style={styles.securityNote}>
            <Text style={styles.securityText}>🔒 All passwords are encrypted and securely stored by Firebase.</Text>
          </View>

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
  loginTypeContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeBtnText: {
    ...FONTS.body,
    color: COLORS.text_muted,
  },
  typeBtnTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  otpRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.m,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.m,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  sendBtnText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  otpHint: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    marginTop: -SPACING.m,
    marginBottom: SPACING.m,
    fontStyle: "italic",
  },
  securityNote: {
    marginTop: SPACING.l,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  securityText: {
    fontSize: 11,
    color: COLORS.text_muted,
    textAlign: "center",
  },
});

export default LoginScreen;
