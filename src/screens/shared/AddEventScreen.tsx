import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { eventService } from "../../services/eventService";
import { useAuth } from "../../stores/AuthProvider";

export default function AddEventScreen({ navigation }: any) {
  const { userId, profile } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [expectedDonors, setExpectedDonors] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!title.trim()) return "Event title is required.";
    if (!city.trim()) return "City is required.";
    if (!venue.trim()) return "Venue is required.";
    if (!date.trim()) return "Date is required (YYYY-MM-DD).";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim()))
      return "Date must be in YYYY-MM-DD format.";
    if (!startTime.trim()) return "Start time is required (HH:MM).";
    if (!endTime.trim()) return "End time is required (HH:MM).";
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    setLoading(true);
    try {
      const { error: svcError } = await eventService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        city: city.trim(),
        venue: venue.trim(),
        date: date.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        organizer: userId ?? "unknown",
        organizerName: profile?.name ?? undefined,
        status: "upcoming",
        volunteersAssigned: [],
        expectedDonors: parseInt(expectedDonors) || 0,
        actualDonors: 0,
        leadsCollected: 0,
        createdAt: new Date().toISOString(),
      });

      if (svcError) throw new Error(svcError);

      Alert.alert("Success", "Event created successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Event</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Event Details</Text>

          <Field label="Event Title *">
            <TextInput
              style={styles.input}
              placeholder="e.g. Blood Donation Drive"
              placeholderTextColor={COLORS.text_secondary}
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          <Field label="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Brief description of the event..."
              placeholderTextColor={COLORS.text_secondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </Field>

          <Field label="City *">
            <TextInput
              style={styles.input}
              placeholder="e.g. Chennai"
              placeholderTextColor={COLORS.text_secondary}
              value={city}
              onChangeText={setCity}
            />
          </Field>

          <Field label="Venue *">
            <TextInput
              style={styles.input}
              placeholder="e.g. Government Hospital, Adyar"
              placeholderTextColor={COLORS.text_secondary}
              value={venue}
              onChangeText={setVenue}
            />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Schedule</Text>

          <Field label="Date * (YYYY-MM-DD)">
            <TextInput
              style={styles.input}
              placeholder="2026-03-15"
              placeholderTextColor={COLORS.text_secondary}
              value={date}
              onChangeText={setDate}
              keyboardType="numeric"
            />
          </Field>

          <View style={styles.row}>
            <View style={styles.rowField}>
              <Text style={styles.label}>Start Time * (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                placeholderTextColor={COLORS.text_secondary}
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
            <View style={[styles.rowField, { marginLeft: SPACING.s }]}>
              <Text style={styles.label}>End Time * (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="14:00"
                placeholderTextColor={COLORS.text_secondary}
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Capacity</Text>

          <Field label="Expected Donors">
            <TextInput
              style={styles.input}
              placeholder="e.g. 50"
              placeholderTextColor={COLORS.text_secondary}
              value={expectedDonors}
              onChangeText={setExpectedDonors}
              keyboardType="numeric"
            />
          </Field>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={COLORS.white}
            style={{ marginRight: SPACING.xs }}
          />
          <Text style={styles.submitText}>
            {loading ? "Creating..." : "Create Event"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { ...FONTS.h3, color: COLORS.text_primary },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.m,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: SPACING.m, paddingBottom: SPACING.xxl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    ...FONTS.h4,
    color: COLORS.primary,
    marginBottom: SPACING.m,
  },
  fieldWrapper: { marginBottom: SPACING.m },
  label: { ...FONTS.caption, color: COLORS.text_secondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    color: COLORS.text_primary,
    ...FONTS.body,
  },
  textarea: { height: 80, textAlignVertical: "top", paddingTop: SPACING.s },
  row: { flexDirection: "row" },
  rowField: { flex: 1 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.m,
    marginTop: SPACING.s,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { ...FONTS.h4, color: COLORS.white },
});
