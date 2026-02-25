import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { BloodRequest } from "../../types/database";
import { BloodGroupBadge } from "./BloodGroupBadge";
import { StatusPill } from "./StatusPill";

interface Props {
  request: BloodRequest;
  onPress?: () => void;
  style?: ViewStyle;
  showActions?: boolean;
  onAssign?: () => void;
  onEscalate?: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const RequestCard: React.FC<Props> = ({
  request,
  onPress,
  style,
  showActions = false,
  onAssign,
  onEscalate,
}) => {
  const isUrgent = request.urgency === "critical";

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.card, isUrgent && styles.cardCritical, style]}
    >
      {/* Urgency Accent Bar */}
      <View
        style={[
          styles.accentBar,
          {
            backgroundColor:
              request.urgency === "critical"
                ? COLORS.critical
                : request.urgency === "medium"
                  ? COLORS.warning
                  : COLORS.success,
          },
        ]}
      />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <BloodGroupBadge group={request.bloodGroup} size="md" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.patientName}>{request.patientName}</Text>
            <Text style={styles.hospital} numberOfLines={1}>
              {request.hospital}, {request.city}
            </Text>
          </View>
          <StatusPill value={request.urgency} />
        </View>

        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Ionicons
              name="water-outline"
              size={13}
              color={COLORS.text_muted}
            />
            <Text style={styles.detailText}>
              {request.units} unit{request.units !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="time-outline" size={13} color={COLORS.text_muted} />
            <Text style={styles.detailText}>{timeAgo(request.createdAt)}</Text>
          </View>
          {request.escalationLevel > 0 && (
            <View style={styles.detail}>
              <Ionicons
                name="arrow-up-circle-outline"
                size={13}
                color={COLORS.escalated}
              />
              <Text style={[styles.detailText, { color: COLORS.escalated }]}>
                Level {request.escalationLevel}
              </Text>
            </View>
          )}
        </View>

        {/* Status + Assigned */}
        <View style={styles.footerRow}>
          <StatusPill value={request.status} />
          {request.assignedVolunteerName && (
            <Text style={styles.assigned} numberOfLines={1}>
              → {request.assignedVolunteerName}
            </Text>
          )}
        </View>

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            {onAssign && (
              <TouchableOpacity style={styles.actionBtn} onPress={onAssign}>
                <Ionicons
                  name="person-add-outline"
                  size={14}
                  color={COLORS.info}
                />
                <Text style={[styles.actionText, { color: COLORS.info }]}>
                  Assign
                </Text>
              </TouchableOpacity>
            )}
            {onEscalate && (
              <TouchableOpacity
                style={styles.actionBtnDanger}
                onPress={onEscalate}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={14}
                  color={COLORS.escalated}
                />
                <Text style={[styles.actionText, { color: COLORS.escalated }]}>
                  Escalate
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardCritical: {
    borderColor: COLORS.critical + "55",
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientName: {
    ...FONTS.h4,
    color: COLORS.text_primary,
  },
  hospital: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    ...FONTS.caption,
    color: COLORS.text_muted,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  assigned: {
    ...FONTS.caption,
    color: COLORS.text_secondary,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.info_dim,
  },
  actionBtnDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.escalated_dim,
  },
  actionText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
  },
});
