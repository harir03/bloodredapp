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
import { CardSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { eventService } from "../../services/eventService";
import type { BloodEvent } from "../../types/database";

function EventCard({
  event,
  onPress,
}: {
  event: BloodEvent;
  onPress: () => void;
}) {
  const date = event.date ? new Date(event.date) : null;
  const isPast = date ? date < new Date() : false;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={[styles.dateBox, isPast && styles.dateBoxPast]}>
          {date ? (
            <>
              <Text style={styles.dateDay}>{date.getDate()}</Text>
              <Text style={styles.dateMon}>
                {date
                  .toLocaleString("default", { month: "short" })
                  .toUpperCase()}
              </Text>
            </>
          ) : (
            <Ionicons
              name="calendar-outline"
              size={20}
              color={COLORS.text_muted}
            />
          )}
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons
            name="location-outline"
            size={12}
            color={COLORS.text_muted}
          />
          <Text style={styles.metaText}>
            {event.location ?? event.city ?? "TBD"}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={12} color={COLORS.text_muted} />
          <Text style={styles.metaText}>
            {event.registered_count ?? 0} / {event.capacity ?? "∞"} registered
          </Text>
        </View>
        {isPast && (
          <View style={styles.pastBadge}>
            <Text style={styles.pastBadgeText}>Past Event</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.text_muted} />
    </TouchableOpacity>
  );
}

export default function EventsScreen({ navigation }: any) {
  const [events, setEvents] = useState<BloodEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const { data } =
          tab === "upcoming"
            ? await eventService.getUpcoming()
            : await eventService.getAll({ orderBy: "date", orderDir: "desc" });
        setEvents(data ?? []);
      } catch (e) {
        console.log("Events load error:", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab],
  );

  useEffect(() => {
    load();
  }, [load]);

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
        <Text style={styles.title}>Blood Events</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["upcoming", "all"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "upcoming" ? "Upcoming" : "All Events"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ padding: SPACING.l }}>
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() =>
                navigation.navigate("EventDetails", { eventId: item.id })
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="calendar-outline"
                size={52}
                color={COLORS.text_muted}
              />
              <Text style={styles.emptyTitle}>No events</Text>
              <Text style={styles.emptyText}>
                {tab === "upcoming"
                  ? "No upcoming blood events scheduled"
                  : "No events found"}
              </Text>
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
  tabs: {
    flexDirection: "row",
    margin: SPACING.l,
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.m,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADII.s,
    alignItems: "center",
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { ...FONTS.body3, color: COLORS.text_muted, fontWeight: "600" },
  tabTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xxl },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: { marginRight: SPACING.m },
  dateBox: {
    width: 50,
    height: 56,
    borderRadius: RADII.m,
    backgroundColor: COLORS.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  dateBoxPast: { backgroundColor: COLORS.surface2 },
  dateDay: { ...FONTS.h3, color: COLORS.primary, fontSize: 22, lineHeight: 24 },
  dateMon: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 10,
  },
  cardBody: { flex: 1 },
  eventTitle: { ...FONTS.h4, color: COLORS.text_primary, marginBottom: 5 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 4,
  },
  metaText: { ...FONTS.caption, color: COLORS.text_muted },
  pastBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.s,
  },
  pastBadgeText: { ...FONTS.caption, color: COLORS.text_muted, fontSize: 10 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { ...FONTS.h3, color: COLORS.text_primary },
  emptyText: {
    ...FONTS.body2,
    color: COLORS.text_muted,
    textAlign: "center",
    maxWidth: 240,
  },
});
