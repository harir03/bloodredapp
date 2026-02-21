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
import { volunteerService } from "../../services";

const AddVolunteerScreen = ({ navigation }: any) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddVolunteer = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }
    setLoading(true);
    try {
      await volunteerService.create({
        name: name.trim(),
        email: email.trim() || "",
        phone: phone.trim(),
        blood_group: bloodGroup.trim() || "Unknown",
        area: "",
        city: city.trim(),
        status: "active",
        tasks_completed: 0,
        points: 0,
        joined_at: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add volunteer");
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
        <SectionHeader title="Add Volunteer" />
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
          <AppInput label="City" value={city} onChangeText={setCity} />
          <AppInput
            label="Blood Group"
            value={bloodGroup}
            onChangeText={setBloodGroup}
          />
          <AppButton
            title={loading ? "Adding..." : "Add Volunteer"}
            onPress={handleAddVolunteer}
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

export default AddVolunteerScreen;
