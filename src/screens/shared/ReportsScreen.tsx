import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BarChart,
  LineChart,
  PieChart,
} from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KPICard } from "../../components/ui/KPICard";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { bloodRequestService } from "../../services/bloodRequestService";
import { donorService } from "../../services/donorService";
import { eventService } from "../../services/eventService";
import { staffService } from "../../services/staffService";
import { taskService } from "../../services/taskService";
import { volunteerService } from "../../services/volunteerService";

const screenWidth = Dimensions.get("window").width;

export default function ReportsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    totalVolunteers: 0,
    activeVolunteers: 0,
    totalDonors: 0,
    totalStaff: 0,
    openRequests: 0,
    resolvedRequests: 0,
    criticalRequests: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingEvents: 0,
  });

  const [dailyData, setDailyData] = useState<{ labels: string[]; datasets: { data: number[] }[] } | null>(null);
  const [cityData, setCityData] = useState<{ labels: string[]; datasets: { data: number[] }[] } | null>(null);
  const [taskData, setTaskData] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [
        volunteers,
        activeVols,
        donors,
        staff,
        reqStats,
        tasks,
        completedTasks,
        events,
        daily,
        cities,
        taskStats,
      ] = await Promise.all([
        volunteerService.getAll(),
        volunteerService.getAll({ filters: { status: "active" } }),
        donorService.getAll(),
        staffService.getAll(),
        bloodRequestService.getRecentStats(),
        taskService.getAll(),
        taskService.getAll({ filters: { status: "completed" } }),
        eventService.getUpcoming(),
        bloodRequestService.getDailyStats(),
        bloodRequestService.getStatsByCity(),
        taskService.getCompletionStats(),
      ]);

      setKpis({
        totalVolunteers: volunteers.data?.length ?? 0,
        activeVolunteers: activeVols.data?.length ?? 0,
        totalDonors: donors.data?.length ?? 0,
        totalStaff: staff.data?.length ?? 0,
        openRequests: reqStats.pending ?? 0,
        resolvedRequests: reqStats.resolved ?? 0,
        criticalRequests: reqStats.critical ?? 0,
        totalTasks: tasks.data?.length ?? 0,
        completedTasks: completedTasks.data?.length ?? 0,
        upcomingEvents: events.data?.length ?? 0,
      });

      setDailyData({
        labels: daily.labels,
        datasets: [{ data: daily.data.length > 0 ? daily.data : [0, 0, 0, 0, 0, 0, 0] }]
      });

      setCityData({
        labels: cities.labels,
        datasets: [{ data: cities.data.length > 0 ? cities.data : [0] }]
      });

      setTaskData(taskStats);

    } catch (e) {
      console.error("Reports loading error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.primary
    },
    fillShadowGradient: COLORS.primary,
    fillShadowGradientOpacity: 0.1,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiWrap}>
            <KPICard label="Volunteers" value={kpis.totalVolunteers} icon="people" color={COLORS.primary} compact />
          </View>
          <View style={styles.kpiWrap}>
            <KPICard label="Donors" value={kpis.totalDonors} icon="heart" color={COLORS.danger} compact />
          </View>
          <View style={styles.kpiWrap}>
            <KPICard label="Active Requests" value={kpis.openRequests} icon="water" color={COLORS.warning} compact />
          </View>
          <View style={styles.kpiWrap}>
            <KPICard label="Resolved" value={kpis.resolvedRequests} icon="checkmark-done" color={COLORS.success} compact />
          </View>
        </View>

        {/* Real-time Activity Trend */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>7-Day Blood Requests Trend</Text>
          {dailyData && (
            <LineChart
              data={dailyData}
              width={screenWidth - SPACING.m * 3}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
            />
          )}
        </View>

        <View style={styles.row}>
          {/* Task Completion Pie */}
          <View style={[styles.chartCard, { flex: 1, marginRight: SPACING.s }]}>
            <Text style={styles.chartTitle}>Task Status</Text>
            {taskData.length > 0 && (
              <PieChart
                data={taskData}
                width={screenWidth / 2}
                height={120}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[0, 0]}
                hasLegend={false}
              />
            )}
            <View style={styles.legend}>
              {taskData.map(item => (
                <View key={item.name} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* City Stats Bar */}
          <View style={[styles.chartCard, { flex: 1 }]}>
            <Text style={styles.chartTitle}>Top Cities</Text>
            {cityData && (
              <BarChart
                data={cityData}
                width={screenWidth / 2}
                height={150}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{ ...chartConfig, barPercentage: 0.5 }}
                verticalLabelRotation={30}
                style={styles.chart}
                fromZero={true}
                withInnerLines={false}
              />
            )}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { ...FONTS.h3, color: COLORS.text_primary },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.m,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.m,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: SPACING.m },
  sectionTitle: { ...FONTS.h4, color: COLORS.text_primary, marginBottom: SPACING.m },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -SPACING.xs, marginBottom: SPACING.m },
  kpiWrap: { width: "50%", paddingHorizontal: SPACING.xs, marginBottom: SPACING.s },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center"
  },
  chartTitle: { ...FONTS.caption, color: COLORS.text_secondary, marginBottom: SPACING.m, alignSelf: "flex-start", fontWeight: "600" as any },
  chart: { marginVertical: 8, borderRadius: 16, paddingRight: 40 },
  row: { flexDirection: "row" },
  legend: { marginTop: 8, gap: 4, alignSelf: "flex-start" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: COLORS.text_secondary },
});
