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
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { taskService } from "../../services";
import { useAuth } from "../../stores/AuthProvider";

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;
const TYPE_OPTIONS = [
  "blood_delivery",
  "donor_visit",
  "event_setup",
  "awareness_drive",
  "other",
] as const;

const AddTaskScreen = ({ route, navigation }: any) => {
  const { userId } = useAuth();
  const { assignedBy, assignedByName, assignedTo } = route?.params || {};
  const effectiveAssignedBy = assignedBy || userId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [priority, setPriority] =
    useState<(typeof PRIORITY_OPTIONS)[number]>("medium");
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]>("other");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddTask = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }
    setLoading(true);
    try {
      const { error } = await taskService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        status: "assigned",
        priority,
        assigned_by: effectiveAssignedBy || undefined,
        assigned_to: assignedTo ?? undefined,
        location: location.trim() || undefined,
        city: city.trim() || undefined,
        due_date: dueDate.trim() || undefined,
        points_reward: 10,
      });
      if (error) {
        Alert.alert("Error", error);
      } else {
        Alert.alert("Success", "Task created and assigned successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <SectionHeader title="Add Task" />

        {assignedByName ? (
          <View style={styles.assigneeBanner}>
            <Text style={styles.assigneeText}>
              Assigning task on behalf of{" "}
              <Text style={styles.assigneeName}>{assignedByName}</Text>
            </Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <AppInput
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Blood delivery to City Hospital"
          />
          <AppInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional details..."
          />
          <AppInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Apollo Hospital, Block A"
          />
          <AppInput
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Hyderabad"
          />
          <AppInput
            label="Due Date (YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="e.g. 2026-03-01"
          />

          {/* Priority Selector */}
          <Text style={styles.selectorLabel}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITY_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[styles.chip, priority === p && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    priority === p && styles.chipTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Type Selector */}
          <Text style={styles.selectorLabel}>Type</Text>
          <View style={styles.chipRow}>
            {TYPE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[styles.chip, type === t && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, type === t && styles.chipTextActive]}
                >
                  {t.replace(/_/g, " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <AppButton
            title={loading ? "Creating..." : "Create & Assign Task"}
            onPress={handleAddTask}
            disabled={loading}
            style={styles.submitBtn}
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
  assigneeBanner: {
    backgroundColor: COLORS.primary_dim,
    borderRadius: SPACING.s,
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  assigneeText: {
    ...FONTS.body3,
    color: COLORS.text_primary,
  },
  assigneeName: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectorLabel: {
    ...FONTS.label,
    color: COLORS.text_muted,
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  chip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: COLORS.white,
  },
  submitBtn: {
    marginTop: SPACING.l,
  },
});

export default AddTaskScreen;
