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
import { taskService } from "../../services";
import { useAuth } from "../../stores/AuthProvider";

const AddTaskScreen = ({ navigation }: any) => {
  const { userId } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddTask = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }
    setLoading(true);
    try {
      await taskService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        type: "other",
        status: "pending",
        priority: "medium",
        assigned_by: userId || undefined,
        location: location.trim() || undefined,
        points_reward: 10,
      });
      navigation.goBack();
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
      <ScrollView style={styles.container}>
        <SectionHeader title="Add Task" />
        <View style={styles.formContainer}>
          <AppInput label="Title" value={title} onChangeText={setTitle} />
          <AppInput
            label="Description"
            value={description}
            onChangeText={setDescription}
          />
          <AppInput
            label="Location"
            value={location}
            onChangeText={setLocation}
          />
          <AppButton
            title={loading ? "Adding..." : "Add Task"}
            onPress={handleAddTask}
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

export default AddTaskScreen;
