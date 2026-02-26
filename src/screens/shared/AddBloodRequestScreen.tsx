import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
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
import { bloodRequestService } from "../../services/bloodRequestService";
import { useAuth } from "../../stores/AuthProvider";
import { BloodGroup } from "../../types/database";

const BLOOD_GROUPS: BloodGroup[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];
const URGENCY_OPTIONS = ["low", "medium", "critical"] as const;

export default function AddBloodRequestScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [patientName, setPatientName] = useState("");
  const [hospital, setHospital] = useState("");
  const [city, setCity] = useState(profile?.city ?? "");
  const [units, setUnits] = useState("1");
  const [notes, setNotes] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "critical">(
    "medium",
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!patientName.trim() || !hospital.trim() || !bloodGroup) {
      Alert.alert(
        "Missing Info",
        "Please fill patient name, hospital and blood group.",
      );
      return;
    }
    const unitsNum = parseInt(units, 10);
    if (isNaN(unitsNum) || unitsNum < 1) {
      Alert.alert("Invalid Units", "Enter a valid number of units.");
      return;
    }
    setLoading(true);
    try {
      const requestData: any = {
        patientName: patientName.trim(),
        hospital: hospital.trim(),
        city: city.trim(),
        bloodGroup,
        units: unitsNum,
        urgency,
        status: "pending",
        requestedBy: profile?.id ?? "",
        requestedByName: profile?.name ?? "",
      };

      if (notes.trim()) {
        requestData.notes = notes.trim();
      }

      await bloodRequestService.create(requestData);
      Alert.alert(
        "Request Created",
        "Blood request has been submitted successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      console.error("Error creating blood request:", e);
      Alert.alert("Error", `Failed to create request: ${e.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Blood Request</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Blood Group Selector */}
        <Text style={styles.label}>Blood Group *</Text>
        <View style={styles.bloodGrid}>
          {BLOOD_GROUPS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.bloodChip,
                bloodGroup === g && styles.bloodChipActive,
              ]}
              onPress={() => setBloodGroup(g)}
            >
              <Text
                style={[
                  styles.bloodChipText,
                  bloodGroup === g && styles.bloodChipTextActive,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Urgency */}
        <Text style={styles.label}>Urgency *</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_OPTIONS.map((u) => {
            const color =
              u === "critical"
                ? COLORS.critical
                : u === "medium"
                  ? COLORS.warning
                  : COLORS.success;
            return (
              <TouchableOpacity
                key={u}
                style={[
                  styles.urgencyChip,
                  { borderColor: color + "55" },
                  urgency === u && {
                    backgroundColor: color + "22",
                    borderColor: color,
                  },
                ]}
                onPress={() => setUrgency(u)}
              >
                <View style={[styles.urgencyDot, { backgroundColor: color }]} />
                <Text style={[styles.urgencyText, urgency === u && { color }]}>
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppInput
          label="Patient Name *"
          value={patientName}
          onChangeText={setPatientName}
          placeholder="Enter patient name"
        />
        <AppInput
          label="Hospital *"
          value={hospital}
          onChangeText={setHospital}
          placeholder="Hospital name"
        />
        <AppInput
          label="City *"
          value={city}
          onChangeText={setCity}
          placeholder="City"
        />
        <AppInput
          label="Units Required *"
          value={units}
          onChangeText={setUnits}
          keyboardType="numeric"
          placeholder="1"
        />
        <AppInput
          label="Additional Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional info..."
          multiline
          numberOfLines={3}
        />

        <AppButton
          title={loading ? "Submitting..." : "Submit Request"}
          onPress={handleSubmit}
          disabled={loading}
          style={{ marginTop: SPACING.m }}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxxxl + 4,
    paddingBottom: SPACING.l,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...FONTS.h3, color: COLORS.text_primary },
  scroll: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.s,
  },
  label: {
    ...FONTS.label,
    color: COLORS.text_secondary,
    marginBottom: 8,
    marginTop: 4,
  },
  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: SPACING.l,
  },
  bloodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  bloodChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bloodChipText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: COLORS.text_secondary,
  },
  bloodChipTextActive: { color: COLORS.white },
  urgencyRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: SPACING.l,
  },
  urgencyChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    color: COLORS.text_muted,
  },
});
