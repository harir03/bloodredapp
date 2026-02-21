import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/ui/AppButton";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { helplineService } from "../../services";
import { HelplineCall } from "../../types/database";

const CallDetailsScreen = ({ route, navigation }: any) => {
  const { callId } = route.params;
  const [call, setCall] = useState<HelplineCall | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    helplineService
      .getById(callId)
      .then(({ data }) => setCall(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [callId]);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1 }}
      />
    );
  if (!call)
    return (
      <View style={styles.container}>
        <Text>Call not found</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <SectionHeader title="Call Details" />
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Caller:</Text>
        <Text style={styles.value}>{call.caller_name}</Text>
        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{call.caller_phone}</Text>
        <Text style={styles.label}>Type:</Text>
        <Text style={styles.value}>{call.call_type}</Text>
        <Text style={styles.label}>Priority:</Text>
        <Text style={styles.value}>{call.priority}</Text>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{call.status}</Text>
        {call.hospital ? (
          <>
            <Text style={styles.label}>Hospital:</Text>
            <Text style={styles.value}>{call.hospital}</Text>
          </>
        ) : null}
        {call.notes ? (
          <>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{call.notes}</Text>
          </>
        ) : null}
        <Text style={styles.label}>Created:</Text>
        <Text style={styles.value}>
          {new Date(call.created_at).toLocaleString()}
        </Text>
      </View>
      <AppButton title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: SPACING.s,
    marginBottom: SPACING.m,
  },
  label: {
    ...FONTS.h4,
    color: COLORS.text_secondary,
    marginBottom: SPACING.xs,
  },
  value: {
    ...FONTS.body3,
    color: COLORS.text_primary,
    marginBottom: SPACING.m,
  },
});

export default CallDetailsScreen;
