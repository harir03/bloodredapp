import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { eventService } from "../../services/eventService";
import { volunteerService } from "../../services/volunteerService";
import { useAuth } from "../../stores/AuthProvider";
import type { BloodEvent, Volunteer } from "../../types/database";

export default function EventDetailsScreen({ route, navigation }: any) {
    const { eventId } = route.params ?? {};
    const { profile } = useAuth();

    const [event, setEvent] = useState<BloodEvent | null>(null);
    const [assignedVols, setAssignedVols] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const eData = await eventService.getById(eventId);
            if (eData) {
                setEvent(eData);
                if (eData.volunteersAssigned && eData.volunteersAssigned.length > 0) {
                    const vs = await Promise.all(
                        eData.volunteersAssigned.map((vId) => volunteerService.getById(vId))
                    );
                    setAssignedVols(vs.filter(Boolean) as Volunteer[]);
                } else {
                    setAssignedVols([]);
                }
            }
        } catch (e) {
            console.log("Load event error:", e);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        loadData();
        // [ARIA] Listen to focus so it updates after assigning a volunteer
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [loadData, navigation]);

    if (loading && !event) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: COLORS.text_muted }}>Event not found</Text>
            </View>
        );
    }

    const date = new Date(event.date);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Event Details</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.description && <Text style={styles.desc}>{event.description}</Text>}

                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.metaText}>{date.toLocaleDateString()} • {event.startTime} - {event.endTime}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.metaText}>{event.venue}, {event.city}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="people-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.metaText}>Expected Donors: {event.expectedDonors || 0}</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Assigned Volunteers ({assignedVols.length})</Text>
                    {/* Ensure only managers/admins can assign */}
                    {["admin", "city_manager", "hr_manager"].includes(profile?.role || "") && (
                        <TouchableOpacity
                            style={styles.assignBtn}
                            onPress={() => navigation.navigate("AssignVolunteerToEvent", { eventId: event.id })}
                        >
                            <Text style={styles.assignBtnText}>+ Assign</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {assignedVols.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No volunteers assigned yet.</Text>
                    </View>
                ) : (
                    assignedVols.map((v) => (
                        <View key={v.id} style={styles.volCard}>
                            <View style={styles.avatarCircle}>
                                <Ionicons name="person" size={20} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.volName}>{v.name}</Text>
                                <Text style={styles.volMeta}>{v.phone || "No phone"} • {v.city || "Unknown"}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: SPACING.l,
        paddingTop: SPACING.xxl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface2,
        alignItems: "center",
        justifyContent: "center",
    },
    title: { ...FONTS.h3, color: COLORS.text_primary, flex: 1, textAlign: "center" },
    scroll: { padding: SPACING.l, paddingBottom: 60 },
    card: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADII.l,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.l,
    },
    eventTitle: { ...FONTS.h3, color: COLORS.text_primary, marginBottom: 8 },
    desc: { ...FONTS.body2, color: COLORS.text_muted, marginBottom: 16 },
    metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
    metaText: { ...FONTS.body2, color: COLORS.text_primary },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.m },
    sectionTitle: { ...FONTS.h4, color: COLORS.text_primary },
    assignBtn: { backgroundColor: COLORS.primary + "22", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    assignBtnText: { color: COLORS.primary, ...FONTS.body3, fontWeight: "600" },
    volCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADII.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface2,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    volName: { ...FONTS.body1, color: COLORS.text_primary, fontWeight: "600" },
    volMeta: { ...FONTS.caption, color: COLORS.text_muted },
    empty: { padding: SPACING.l, alignItems: "center" },
    emptyText: { ...FONTS.body2, color: COLORS.text_muted, fontStyle: "italic" }
});
