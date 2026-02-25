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
import { helplineService } from "../../services";

const AddCallScreen = ({ navigation }: any) => {
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [hospital, setHospital] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddCall = async () => {
    if (!callerName.trim() || !callerPhone.trim()) {
      Alert.alert("Error", "Caller name and phone are required");
      return;
    }
    setLoading(true);
    try {
      await helplineService.create({
        caller_name: callerName.trim(),
        caller_phone: callerPhone.trim(),
        call_type: "blood_request",
        priority: "medium",
        status: "pending",
        hospital: hospital.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add call");
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
        <SectionHeader title="Add Call" />
        <View style={styles.formContainer}>
          <AppInput
            label="Caller Name"
            value={callerName}
            onChangeText={setCallerName}
          />
          <AppInput
            label="Phone"
            value={callerPhone}
            onChangeText={setCallerPhone}
            keyboardType="phone-pad"
          />
          <AppInput
            label="Hospital"
            value={hospital}
            onChangeText={setHospital}
          />
          <AppInput label="Notes" value={notes} onChangeText={setNotes} />
          <AppButton
            title={loading ? "Adding..." : "Add Call"}
            onPress={handleAddCall}
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

export default AddCallScreen;
