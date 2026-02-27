import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { useAuth } from "../../stores/AuthProvider";

const DonorDashboardScreen = ({ navigation }: any) => {
    const { profile } = useAuth();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(profile?.name ?? "D").charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.welcome}>Welcome, {profile?.name}!</Text>
                <View style={styles.roleBadge}>
                    <Ionicons name="water" size={14} color={COLORS.accent} />
                    <Text style={styles.roleText}>Donor</Text>
                </View>
            </View>

            <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                    <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.infoTitle}>Volunteer Status: Pending</Text>
                <Text style={styles.infoSub}>
                    Your account is currently in 'Donor' mode. An administrator will review your profile shortly to promote you to a Volunteer.
                </Text>
                <Text style={styles.infoSub}>
                    Once promoted, you'll be able to accept tasks and help manage blood requests in your city.
                </Text>
            </View>

            <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
            <View style={styles.grid}>
                <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => navigation.navigate("Profile")}
                >
                    <View style={[styles.gridIcon, { backgroundColor: COLORS.info + "22" }]}>
                        <Ionicons name="person-outline" size={24} color={COLORS.info} />
                    </View>
                    <Text style={styles.gridLabel}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => navigation.navigate("Leaderboard")}
                >
                    <View style={[styles.gridIcon, { backgroundColor: COLORS.warning + "22" }]}>
                        <Ionicons name="trophy-outline" size={24} color={COLORS.warning} />
                    </View>
                    <Text style={styles.gridLabel}>Leaderboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => navigation.navigate("AllBadges")}
                >
                    <View style={[styles.gridIcon, { backgroundColor: "#EC4899" + "22" }]}>
                        <Ionicons name="ribbon-outline" size={24} color="#EC4899" />
                    </View>
                    <Text style={styles.gridLabel}>Badges</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => navigation.navigate("Events")}
                >
                    <View style={[styles.gridIcon, { backgroundColor: COLORS.success + "22" }]}>
                        <Ionicons name="calendar-outline" size={24} color={COLORS.success} />
                    </View>
                    <Text style={styles.gridLabel}>Events</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SPACING.l, paddingTop: 60 },
    hero: { alignItems: "center", marginBottom: SPACING.xl },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.accent + "22",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.accent,
        marginBottom: SPACING.m,
    },
    avatarText: { fontSize: 32, fontFamily: "Inter-Bold", color: COLORS.accent },
    welcome: { ...FONTS.h2, color: COLORS.text_primary, marginBottom: 4 },
    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: RADII.full,
        backgroundColor: COLORS.accent + "18",
        borderWidth: 1,
        borderColor: COLORS.accent + "44",
    },
    roleText: { ...FONTS.caption, color: COLORS.accent, fontFamily: "Inter-SemiBold" },

    infoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.xl,
        alignItems: "center",
    },
    infoIcon: { marginBottom: SPACING.m },
    infoTitle: { ...FONTS.h4, color: COLORS.text_primary, marginBottom: 8, textAlign: "center" },
    infoSub: { ...FONTS.body3, color: COLORS.text_secondary, textAlign: "center", marginBottom: 8, lineHeight: 18 },

    sectionLabel: {
        ...FONTS.caption,
        letterSpacing: 1,
        color: COLORS.text_muted,
        marginBottom: SPACING.m,
        paddingLeft: 4,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.m },
    gridItem: {
        width: "47%",
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.m,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    gridIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    gridLabel: { ...FONTS.body3, color: COLORS.text_primary, fontFamily: "Inter-Medium" },
});

export default DonorDashboardScreen;
