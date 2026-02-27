import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListItemSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { leaderboardService } from "../../services/leaderboardService";
import { CityLeaderboard, LeaderboardEntry } from "../../types/database";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

function PodiumCard({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
}) {
  const heights = [100, 80, 60];
  const color = RANK_COLORS[rank - 1];

  return (
    <View style={[styles.podiumCard, { marginTop: rank === 1 ? 0 : 20 }]}>
      <Text style={styles.rankEmoji}>{RANK_EMOJIS[rank - 1]}</Text>
      <View
        style={[
          styles.podiumAvatarRing,
          {
            borderColor: color,
            width: rank === 1 ? 64 : 52,
            height: rank === 1 ? 64 : 52,
            borderRadius: rank === 1 ? 32 : 26,
          },
        ]}
      >
        <Text
          style={[styles.podiumInitial, { fontSize: rank === 1 ? 22 : 18 }]}
        >
          {entry.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.name.split(" ")[0]}
      </Text>
      <View style={[styles.podiumPoints, { backgroundColor: color + "22" }]}>
        <Text style={[styles.podiumPointsText, { color }]}>{entry.points}</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [boards, setBoards] = useState<CityLeaderboard[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaderboardService.getAllCities();
      setBoards(data);
      if (!selected && data.length > 0) setSelected(data[0].id);
    } catch (e) {
      console.log("Load leaderboard error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const current = boards.find((b) => b.id === selected);
  const top3 = current?.topVolunteers.slice(0, 3) ?? [];
  const rest = current?.topVolunteers.slice(3) ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      {/* City Tabs */}
      {boards.length > 1 && (
        <FlatList
          horizontal
          data={boards}
          keyExtractor={(b) => b.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityTabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.cityTab,
                selected === item.id && styles.cityTabActive,
              ]}
              onPress={() => setSelected(item.id)}
            >
              <Text
                style={[
                  styles.cityTabText,
                  selected === item.id && styles.cityTabTextActive,
                ]}
              >
                {item.id}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FlatList
        data={loading ? [] : rest}
        keyExtractor={(e) => e.userId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Podium */}
            {top3.length >= 1 && (
              <View style={styles.podium}>
                {top3.length >= 2 && <PodiumCard entry={top3[1]} rank={2} />}
                <PodiumCard entry={top3[0]} rank={1} />
                {top3.length >= 3 && <PodiumCard entry={top3[2]} rank={3} />}
              </View>
            )}

            {loading && (
              <View>
                {[0, 1, 2, 3, 4].map((i) => (
                  <ListItemSkeleton key={i} />
                ))}
              </View>
            )}

            {!loading && rest.length > 0 && (
              <Text style={styles.sectionTitle}>Rankings</Text>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons
                name="trophy-outline"
                size={48}
                color={COLORS.text_muted}
              />
              <Text style={styles.emptyText}>No data yet</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View style={styles.rankRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankNum}>#{item.rank}</Text>
            </View>
            <View style={styles.rankAvatar}>
              <Text style={styles.rankInitial}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.rankName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.pointsTag}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.rankPoints}>{item.points}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
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
  title: { ...FONTS.h3, color: COLORS.text_primary },
  cityTabs: {
    paddingHorizontal: SPACING.xxl,
    gap: 8,
    marginBottom: SPACING.l,
  },
  cityTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cityTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cityTabText: { ...FONTS.caption, color: COLORS.text_muted },
  cityTabTextActive: { color: COLORS.white, fontFamily: "Inter-SemiBold" },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingVertical: SPACING.l,
    gap: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  podiumCard: { alignItems: "center", flex: 1 },
  rankEmoji: { fontSize: 22, marginBottom: 4 },
  podiumAvatarRing: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface2,
    marginBottom: 6,
  },
  podiumInitial: { fontFamily: "Inter-Bold", color: COLORS.text_primary },
  podiumName: {
    ...FONTS.caption,
    color: COLORS.text_primary,
    maxWidth: 80,
    textAlign: "center",
  },
  podiumPoints: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  podiumPointsText: { fontFamily: "Inter-Bold", fontSize: 12 },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text_primary,
    marginBottom: SPACING.m,
  },
  list: { paddingHorizontal: SPACING.xxl },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNum: { fontFamily: "Inter-Bold", fontSize: 12, color: COLORS.text_muted },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary_subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  rankInitial: {
    fontFamily: "Inter-Bold",
    fontSize: 14,
    color: COLORS.primary,
  },
  rankName: { ...FONTS.body3, color: COLORS.text_primary, flex: 1 },
  pointsTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.warning_dim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankPoints: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    color: COLORS.warning,
  },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { ...FONTS.body3, color: COLORS.text_muted },
});
