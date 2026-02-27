import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BloodGroupBadge } from "../../components/ui/BloodGroupBadge";
import { ListItemSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { eventService } from "../../services/eventService";
import { volunteerService } from "../../services/volunteerService";
import type { Volunteer } from "../../types/database";

export default function AssignVolunteerToEventScreen({ route, navigation }: any) {
    const { eventId } = route.params ?? {};

    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [filtered, setFiltered] = useState<Volunteer[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await volunteerService.getActive();
            setVolunteers(data ?? []);
            setFiltered(data ?? []);
        } catch (e) {
            console.log("Load volunteers error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(volunteers);
        } else {
            const q = search.toLowerCase();
            setFiltered(
                volunteers.filter(
                    (v) =>
                        v.name?.toLowerCase().includes(q) ||
                        v.city?.toLowerCase().includes(q) ||
                        v.blood_group?.toLowerCase().includes(q)
                )
            );
        }
    }, [search, volunteers]);

    const handleAssign = (volunteer: Volunteer) => {
        Alert.alert(
            "Assign Volunteer",
            `Assign ${volunteer.name} to this event?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Assign",
                    onPress: async () => {
                        setAssigning(volunteer.id);
                        try {
                            // [ARIA] Utilize the newly created assignVolunteer method on eventService
                            await eventService.assignVolunteer(eventId, volunteer.id);
                            Alert.alert("Success", `${volunteer.name} has been assigned to the event.`, [
                                { text: "OK", onPress: () => navigation.goBack() },
                            ]);
                        } catch (e) {
                            Alert.alert("Error", "Could not assign volunteer. Please try again.");
                        } finally {
                            setAssigning(null);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: Volunteer }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleAssign(item)}
            disabled={assigning !== null}
            activeOpacity={0.75}
        >
            <View style={styles.avatarCircle}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.meta}>
                    <Ionicons name="location-outline" size={12} color={COLORS.text_muted} />
                    <Text style={styles.metaText}>{item.city ?? "—"}</Text>
                    <View style={styles.dot} />
                    <Text style={styles.metaText}>{item.tasks_completed ?? 0} tasks done</Text>
                </View>
            </View>
            <View style={styles.right}>
                {item.blood_group && <BloodGroupBadge group={item.blood_group as any} size="sm" />}
                {assigning === item.id ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 8 }} />
                ) : (
                    <View style={styles.assignBtn}>
                        <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Assign to Event</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={16} color={COLORS.text_muted} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, city or blood group..."
                    placeholderTextColor={COLORS.text_muted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")}>
                        <Ionicons name="close-circle" size={16} color={COLORS.text_muted} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.count}>
                {filtered.length} volunteer{filtered.length !== 1 ? "s" : ""} available
            </Text>

            {loading ? (
                <View style={{ padding: SPACING.l }}>
                    {[1, 2, 3, 4].map((i) => (
                        <ListItemSkeleton key={i} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={48} color={COLORS.text_muted} />
                            <Text style={styles.emptyText}>No volunteers found</Text>
                        </View>
                    }
                />
            )}
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
    title: {
        ...FONTS.h3,
        color: COLORS.text_primary,
        flex: 1,
        textAlign: "center",
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        margin: SPACING.l,
        backgroundColor: COLORS.surface2,
        borderRadius: RADII.m,
        paddingHorizontal: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        ...FONTS.body2,
        color: COLORS.text_primary,
        paddingVertical: 12,
    },
    count: {
        ...FONTS.caption,
        color: COLORS.text_muted,
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.s,
    },
    list: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xxl },
    card: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: COLORS.surface,
        borderRadius: RADII.l,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary + "22",
        alignItems: "center",
        justifyContent: "center",
    },
    info: { flex: 1, marginLeft: 12 },
    name: { ...FONTS.h4, color: COLORS.text_primary, marginBottom: 4 },
    meta: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    metaText: { ...FONTS.caption, color: COLORS.text_muted, marginLeft: 4 },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.text_muted,
        marginHorizontal: 6,
    },
    right: { alignItems: "center", marginLeft: 10 },
    assignBtn: { marginTop: 8 },
    empty: { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyText: { ...FONTS.body2, color: COLORS.text_muted },
});
