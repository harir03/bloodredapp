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
import { staffService } from "../../services";

const AddStaffScreen = ({ navigation }: any) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddStaff = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Error", "Name, email, and phone are required");
      return;
    }
    setLoading(true);
    try {
      await staffService.create({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: "volunteer",
        department: department.trim() || "General",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add staff");
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
        <SectionHeader title="Add Staff" />
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
          <AppInput
            label="Department"
            value={department}
            onChangeText={setDepartment}
          />
          <AppButton
            title={loading ? "Adding..." : "Add Staff"}
            onPress={handleAddStaff}
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
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: SPACING.s,
  },
});

export default AddStaffScreen;
