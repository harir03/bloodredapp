import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, SPACING } from "../../constants/theme";
import { profileService } from "../../services";
import { UserRole } from "../../types/database";

const AddUserScreen = ({ navigation }: any) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("volunteer");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddUser = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Error", "Name and email are required");
      return;
    }
    setLoading(true);
    try {
      await profileService.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: (role.trim() as UserRole) || "volunteer",
        phone: phone.trim() || undefined,
        is_active: true,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container}>
        <SectionHeader title="Add User" />
        <View style={styles.formContainer}>
          <AppInput label="Name" value={name} onChangeText={setName} />
          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <AppInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <AppInput label="Role" value={role} onChangeText={setRole} />
          <AppButton
            title={loading ? "Adding..." : "Add User"}
            onPress={handleAddUser}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: SPACING.s,
  },
});

export default AddUserScreen;
