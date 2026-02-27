import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BadgeItem } from "../../components/ui/BadgeItem";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { BADGES, computeBadges, leaderboardService } from "../../services/leaderboardService";
import { useAuth } from "../../stores/AuthProvider";

export default function AllBadgesScreen({ navigation }: any) {
    const { profile, userId, refreshProfile } = useAuth();
    const points = (profile as any)?.points || 0;
    const earnedBadges = (profile as any)?.badges || computeBadges(points);

    // Auto-reconcile stats on mount to fix potential 0-points issues
    useEffect(() => {
        if (userId) {
            leaderboardService.reconcileProfileStats(userId).then(() => {
                refreshProfile();
            });
        }
    }, [userId]);

    const badgeList = Object.entries(BADGES).sort((a, b) => a[1].minPoints - b[1].minPoints);

    const handleShareCollection = async () => {
        try {
            const message = `I've unlocked ${earnedBadges.length} out of ${badgeList.length} badges on BloodConnect Collection! 🏆🩸 Join our mission to help those in need! #BloodConnect #Awards #Volunteer`;
            await Share.share({
                message,
                title: "My Badge Collection",
            });
        } catch (error: any) {
            // Already handled by Share API
        }
    };

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
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Badge Collection</Text>
                    <Text style={styles.subtitle}>{earnedBadges.length} of {badgeList.length} unlocked</Text>
                </View>
                <TouchableOpacity
                    onPress={handleShareCollection}
                    style={styles.backBtn}
                >
                    <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.statsCard}>
                    <View style={styles.statInfo}>
                        <Ionicons name="star" size={20} color={COLORS.warning} />
                        <Text style={styles.pointsText}>{points} Total Points</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Available Badges</Text>
                {badgeList.map(([key, info]) => {
                    const isEarned = earnedBadges.includes(key);
                    return (
                        <BadgeItem
                            key={key}
                            label={info.label}
                            emoji={info.emoji}
                            description={info.description}
                            isLocked={!isEarned}
                            minPoints={info.minPoints}
                        />
                    );
                })}
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
        gap: 16,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: { ...FONTS.h3, color: COLORS.text_primary },
    subtitle: { ...FONTS.caption, color: COLORS.text_muted },
    scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 40 },
    statsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.l,
    },
    statInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pointsText: {
        fontFamily: "Inter-Bold",
        fontSize: 16,
        color: COLORS.text_primary,
    },
    sectionTitle: {
        ...FONTS.h4,
        color: COLORS.text_primary,
        marginBottom: SPACING.m,
    }
});
