import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { profileService } from "../../services";
import { UserRole } from "../../types/database";

const ROLES: {
  label: string;
  value: UserRole;
  icon: string;
  color: string;
  description: string;
}[] = [
    {
      label: "Donor",
      value: "donor",
      icon: "water",
      color: COLORS.accent,
      description: "Standard blood donor",
    },
    {
      label: "Volunteer",
      value: "volunteer",
      icon: "heart",
      color: "#EC4899",
      description: "Field volunteer",
    },
    {
      label: "Admin",
      value: "admin",
      icon: "shield",
      color: COLORS.primary,
      description: "Full system access",
    },
    {
      label: "City Manager",
      value: "city_manager",
      icon: "business",
      color: "#3B82F6",
      description: "Manages city operations",
    },
    {
      label: "Helpline Operator",
      value: "helpline",
      icon: "call",
      color: "#22C55E",
      description: "Handles incoming calls",
    },
    {
      label: "HR Manager",
      value: "hr_manager",
      icon: "briefcase",
      color: "#F59E0B",
      description: "Manages staff & volunteers",
    },
  ];

const getInitials = (n: string) =>
  n
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const AddUserScreen = ({ navigation }: any) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("donor");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selected = ROLES.find((r) => r.value === role)!;

  const handleAddUser = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Missing Fields", "Name and email are required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await profileService.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        phone: phone.trim() || undefined,
        is_active: true,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New User</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar Preview ── */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { borderColor: selected.color }]}>
            {name.trim() ? (
              <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
            ) : (
              <Ionicons name="person" size={32} color={COLORS.text_muted} />
            )}
          </View>
          <View
            style={[
              styles.rolePill,
              {
                backgroundColor: selected.color + "22",
                borderColor: selected.color + "55",
              },
            ]}
          >
            <Ionicons
              name={selected.icon as any}
              size={12}
              color={selected.color}
            />
            <Text style={[styles.rolePillText, { color: selected.color }]}>
              {selected.label}
            </Text>
          </View>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="person-outline"
                size={18}
                color={COLORS.text_muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Arjun Sharma"
                placeholderTextColor={COLORS.text_muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email Address *</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={COLORS.text_muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. arjun@example.com"
                placeholderTextColor={COLORS.text_muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="call-outline"
                size={18}
                color={COLORS.text_muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor={COLORS.text_muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Role Dropdown */}
          <View style={[styles.field, { marginBottom: 0 }]}>
            <Text style={styles.fieldLabel}>Role *</Text>
            <TouchableOpacity
              style={[styles.inputRow, styles.dropdownTrigger]}
              onPress={() => setDropdownOpen(true)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.roleIconSmall,
                  { backgroundColor: selected.color + "22" },
                ]}
              >
                <Ionicons
                  name={selected.icon as any}
                  size={15}
                  color={selected.color}
                />
              </View>
              <Text style={styles.dropdownValue}>{selected.label}</Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={COLORS.text_secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleAddUser}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Ionicons
                name="person-add"
                size={19}
                color={COLORS.white}
                style={{ marginRight: SPACING.s }}
              />
              <Text style={styles.submitText}>Create User</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Role Picker Sheet ── */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Role</Text>

            {ROLES.map((item) => {
              const active = item.value === role;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.option,
                    active && { backgroundColor: item.color + "15" },
                  ]}
                  onPress={() => {
                    setRole(item.value);
                    setDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.roleIconLarge,
                      { backgroundColor: item.color + "22" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text
                      style={[
                        styles.optionLabel,
                        active && { color: item.color },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.optionDesc}>{item.description}</Text>
                  </View>
                  {active && (
                    <View
                      style={[
                        styles.checkCircle,
                        { backgroundColor: item.color },
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color={COLORS.white}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.xl + 4,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { ...FONTS.h3, color: COLORS.text_primary },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.m,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { padding: SPACING.l, paddingBottom: SPACING.xxxl },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: SPACING.l },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    marginBottom: SPACING.s,
  },
  avatarInitials: { ...FONTS.h1, color: COLORS.text_primary },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.m,
    paddingVertical: 4,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  rolePillText: { ...FONTS.caption, fontFamily: "Inter-SemiBold" },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.m,
  },
  cardTitle: {
    ...FONTS.label,
    color: COLORS.text_secondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Fields
  field: { gap: 6 },
  fieldLabel: { ...FONTS.label, color: COLORS.text_secondary },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.m,
    paddingHorizontal: SPACING.m,
    minHeight: 48,
  },
  inputIcon: { marginRight: SPACING.s },
  input: {
    flex: 1,
    color: COLORS.text_primary,
    ...FONTS.body,
    paddingVertical: SPACING.s,
  },

  // Dropdown trigger
  dropdownTrigger: { paddingVertical: SPACING.s },
  roleIconSmall: {
    width: 28,
    height: 28,
    borderRadius: RADII.s,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.s,
  },
  dropdownValue: { ...FONTS.body, color: COLORS.text_primary, flex: 1 },

  // Submit
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.l,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.s,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { ...FONTS.h4, color: COLORS.white },

  // Modal sheet
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    padding: SPACING.l,
    paddingBottom: SPACING.xxxl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: RADII.full,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: SPACING.m,
  },
  sheetTitle: {
    ...FONTS.h3,
    color: COLORS.text_primary,
    marginBottom: SPACING.s,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.m,
    borderRadius: RADII.l,
    gap: SPACING.m,
  },
  roleIconLarge: {
    width: 44,
    height: 44,
    borderRadius: RADII.m,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1 },
  optionLabel: { ...FONTS.h4, color: COLORS.text_primary },
  optionDesc: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: RADII.full,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AddUserScreen;
