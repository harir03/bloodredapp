import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BloodGroupBadge } from "../../components/ui/BloodGroupBadge";
import { CardSkeleton } from "../../components/ui/SkeletonLoader";
import { StatusPill } from "../../components/ui/StatusPill";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { bloodRequestService } from "../../services/bloodRequestService";
import { useAuth } from "../../stores/AuthProvider";
import { BloodRequest } from "../../types/database";

export default function BloodRequestDetailsScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const { profile } = useAuth();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await bloodRequestService.getById(requestId);
      setRequest(data);
    } catch (e) {
      console.log("Load request error:", e);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const canManage =
    profile?.role === "admin" ||
    profile?.role === "helpline" ||
    profile?.role === "city_manager";

  const handleStatusChange = async (status: BloodRequest["status"]) => {
    if (!request) return;
    setActionLoading(true);
    try {
      await bloodRequestService.updateStatus(
        requestId,
        status,
        profile?.id ?? "",
        profile?.name ?? "",
      );
      await load();
    } catch (e) {
      Alert.alert("Error", "Could not update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!request) return;
    Alert.alert(
      "Escalate Request",
      "This will escalate the request to the next level. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Escalate",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await bloodRequestService.escalate(requestId, profile?.id ?? "");
              await load();
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Request Details</Text>
        </View>
        <View style={{ padding: SPACING.xxl }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={styles.errorText}>Request not found</Text>
      </View>
    );
  }

  const urgencyColors: Record<string, string> = {
    critical: COLORS.critical,
    medium: COLORS.warning,
    low: COLORS.success,
  };
  const urgencyColor = urgencyColors[request.urgency] ?? COLORS.text_muted;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Request Details</Text>
        {canManage && (
          <TouchableOpacity
            style={styles.escalateBtn}
            onPress={handleEscalate}
            disabled={actionLoading || request.status === "completed"}
          >
            <Ionicons
              name="arrow-up-circle-outline"
              size={20}
              color={COLORS.escalated}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Main card */}
        <View style={styles.mainCard}>
          <View style={styles.cardTop}>
            <BloodGroupBadge group={request.bloodGroup} size="lg" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.patientName}>{request.patientName}</Text>
              <Text style={styles.hospital}>{request.hospital}</Text>
              <Text style={styles.city}>{request.city}</Text>
            </View>
            <View style={styles.urgencyTag}>
              <View
                style={[styles.urgencyDot, { backgroundColor: urgencyColor }]}
              />
              <Text style={[styles.urgencyLabel, { color: urgencyColor }]}>
                {request.urgency.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            {[
              {
                label: "Units Needed",
                value: `${request.units} unit${request.units !== 1 ? "s" : ""}`,
                icon: "water-outline" as const,
              },
              {
                label: "Status",
                value: <StatusPill value={request.status} />,
                icon: "pulse-outline" as const,
              },
              {
                label: "Escalation Level",
                value: `Level ${request.escalationLevel}`,
                icon: "arrow-up-circle-outline" as const,
              },
              {
                label: "Requested By",
                value: request.requestedByName ?? request.requestedBy,
                icon: "person-outline" as const,
              },
            ].map((d) => (
              <View key={d.label} style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name={d.icon} size={14} color={COLORS.text_muted} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  {typeof d.value === "string" ? (
                    <Text style={styles.detailValue}>{d.value}</Text>
                  ) : (
                    d.value
                  )}
                </View>
              </View>
            ))}
          </View>

          {request.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{request.notes}</Text>
            </View>
          )}
        </View>

        {/* Assigned Volunteer */}
        {request.assignedVolunteerId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Volunteer</Text>
            <View style={styles.assignedCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.assignedName}>
                  {request.assignedVolunteerName ?? "Unknown"}
                </Text>
                <Text style={styles.assignedAt}>
                  Assigned{" "}
                  {request.assignedAt
                    ? new Date(request.assignedAt).toLocaleDateString()
                    : ""}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() =>
                  navigation.navigate("AssignVolunteer", {
                    requestId: request.id,
                  })
                }
              >
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Response Timeline */}
        {request.responseLog && request.responseLog.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
            {[...request.responseLog].reverse().map((entry, i) => (
              <View key={i} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineAction}>{entry.action}</Text>
                  <Text style={styles.timelineMeta}>
                    {entry.byName ?? entry.by} ·{" "}
                    {new Date(entry.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        {canManage &&
          request.status !== "completed" &&
          request.status !== "cancelled" && (
            <View style={styles.actions}>
              {!request.assignedVolunteerId && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    navigation.navigate("AssignVolunteer", {
                      requestId: request.id,
                    })
                  }
                >
                  <Ionicons
                    name="person-add-outline"
                    size={18}
                    color={COLORS.white}
                  />
                  <Text style={styles.primaryBtnText}>Assign Volunteer</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.successBtn}
                onPress={() => handleStatusChange("completed")}
                disabled={actionLoading}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={COLORS.success}
                />
                <Text
                  style={[styles.primaryBtnText, { color: COLORS.success }]}
                >
                  Mark Resolved
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={() => handleStatusChange("cancelled")}
                disabled={actionLoading}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={COLORS.danger}
                />
                <Text style={[styles.primaryBtnText, { color: COLORS.danger }]}>
                  Cancel Request
                </Text>
              </TouchableOpacity>
            </View>
          )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  title: { ...FONTS.h3, color: COLORS.text_primary, flex: 1 },
  escalateBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.escalated_dim,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: SPACING.xxl },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  patientName: { ...FONTS.h3, color: COLORS.text_primary },
  hospital: { ...FONTS.body3, color: COLORS.text_secondary, marginTop: 3 },
  city: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },
  urgencyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surface2,
  },
  urgencyDot: { width: 6, height: 6, borderRadius: 3 },
  urgencyLabel: { fontFamily: "Inter-Bold", fontSize: 10 },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  detailsGrid: { gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  detailLabel: { ...FONTS.caption, color: COLORS.text_muted, marginBottom: 2 },
  detailValue: { ...FONTS.body3, color: COLORS.text_primary },
  notes: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  notesLabel: { ...FONTS.caption, color: COLORS.text_muted, marginBottom: 4 },
  notesText: { ...FONTS.body3, color: COLORS.text_secondary },
  section: { marginBottom: 16 },
  sectionTitle: { ...FONTS.h4, color: COLORS.text_primary, marginBottom: 10 },
  assignedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary_subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  assignedName: { ...FONTS.h4, color: COLORS.text_primary },
  assignedAt: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeBtnText: { ...FONTS.caption, color: COLORS.text_secondary },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    paddingLeft: 4,
    marginBottom: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  timelineAction: { ...FONTS.body3, color: COLORS.text_primary },
  timelineMeta: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },
  actions: { gap: 10, marginBottom: 10 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  successBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.success_dim,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success + "40",
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.danger_dim,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger + "40",
  },
  primaryBtnText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
    color: COLORS.white,
  },
  errorText: { ...FONTS.body, color: COLORS.text_muted },
});
