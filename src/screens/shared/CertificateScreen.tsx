import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import DonorCertificateTemplate from "../../components/certificates/DonorCertificateTemplate";
import VolunteerCertificateTemplate from "../../components/certificates/VolunteerCertificateTemplate";
import { LifesaverBadgeCard } from "../../components/ui/LifesaverBadgeCard";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import {
    Certificate,
    certificateService,
} from "../../services/certificateService";
import { useAuth } from "../../stores/AuthProvider";

export default function CertificateScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { userId, profile } = useAuth();
    const [certs, setCerts] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewCert, setViewCert] = useState<Certificate | null>(null);
    const certRef = useRef<View>(null);

    const load = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const data = await certificateService.getCertificatesForUser(userId);
            setCerts(data);
        } catch (e) {
            console.log("CertificateScreen load error:", e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const handleShare = async (cert: Certificate) => {
        try {
            setViewCert(cert);
            // Small delay to let the cert render before capturing
            setTimeout(async () => {
                let imageUri: string | null = null;
                try {
                    if (certRef.current) {
                        imageUri = await captureRef(certRef, {
                            format: "png",
                            quality: 1,
                        });
                    }
                } catch (e) {
                    console.log("Failed to capture certificate:", e);
                }

                if (imageUri && (await Sharing.isAvailableAsync())) {
                    await Sharing.shareAsync(imageUri, {
                        dialogTitle: "Share Certificate",
                        mimeType: "image/png",
                        UTI: "public.png",
                    });
                } else {
                    const msg =
                        cert.type === "donor"
                            ? `🩸 I donated ${cert.unitsDonated} unit(s) of ${cert.bloodGroup} blood at ${cert.eventName}! Certificate #${cert.serialNumber}. #BloodConnect #DonateBlood #SaveLives`
                            : `🤝 I volunteered for the ${cert.campaignName} campaign at ${cert.eventName}! Certificate #${cert.serialNumber}. #BloodConnect #Volunteer`;
                    await Share.share({ message: msg, title: "My BloodConnect Certificate" });
                }
            }, 500);
        } catch (error: any) {
            // Handled
        }
    };

    const hasDonorCert = certs.some((c) => c.type === "donor");

    const renderCertItem = ({ item }: { item: Certificate }) => (
        <TouchableOpacity
            style={styles.certCard}
            onPress={() => setViewCert(item)}
            activeOpacity={0.8}
        >
            <View
                style={[
                    styles.certIcon,
                    {
                        backgroundColor:
                            item.type === "donor"
                                ? COLORS.primary + "18"
                                : "#2563EB" + "18",
                    },
                ]}
            >
                <Text style={styles.certEmoji}>
                    {item.type === "donor" ? "🩸" : "🤝"}
                </Text>
            </View>
            <View style={styles.certContent}>
                <Text style={styles.certTitle}>
                    {item.type === "donor"
                        ? "Blood Donation Certificate"
                        : "Service Certificate"}
                </Text>
                <Text style={styles.certSub}>
                    {item.eventName} •{" "}
                    {new Date(item.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })}
                </Text>
                <Text style={styles.certSerial}>#{item.serialNumber}</Text>
            </View>
            <View style={styles.certActions}>
                <TouchableOpacity
                    style={styles.miniBtn}
                    onPress={() => setViewCert(item)}
                >
                    <Ionicons name="eye-outline" size={18} color={COLORS.text_secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.miniBtn, styles.shareMinBtn]}
                    onPress={() => handleShare(item)}
                >
                    <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

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
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>My Certificates</Text>
                    <Text style={styles.headerSub}>
                        {certs.length} certificate{certs.length !== 1 ? "s" : ""} earned
                    </Text>
                </View>
            </View>

            <FlatList
                data={loading ? [] : certs}
                keyExtractor={(c) => c.id}
                renderItem={renderCertItem}
                contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
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
                        {/* Lifesaver Badge */}
                        {hasDonorCert && (
                            <LifesaverBadgeCard
                                userName={profile?.name ?? "Donor"}
                                donationDate={certs.find((c) => c.type === "donor")?.date}
                            />
                        )}
                    </>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : (
                        <View style={styles.empty}>
                            <Ionicons
                                name="ribbon-outline"
                                size={56}
                                color={COLORS.text_muted + "55"}
                            />
                            <Text style={styles.emptyTitle}>No Certificates Yet</Text>
                            <Text style={styles.emptyText}>
                                Certificates are awarded after blood donations and volunteer
                                campaigns. Keep contributing!
                            </Text>
                        </View>
                    )
                }
            />

            {/* Full Certificate Preview Modal */}
            <Modal
                visible={!!viewCert}
                animationType="slide"
                transparent
                onRequestClose={() => setViewCert(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Certificate Preview</Text>
                            <TouchableOpacity onPress={() => setViewCert(null)}>
                                <Ionicons name="close" size={24} color={COLORS.text_primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingVertical: SPACING.l, alignItems: "center" }}
                            showsVerticalScrollIndicator={false}
                        >
                            {viewCert?.type === "donor" ? (
                                <DonorCertificateTemplate
                                    ref={certRef}
                                    userName={viewCert.userName}
                                    bloodGroup={viewCert.bloodGroup ?? ""}
                                    unitsDonated={viewCert.unitsDonated ?? 1}
                                    eventName={viewCert.eventName}
                                    date={viewCert.date}
                                    serialNumber={viewCert.serialNumber}
                                />
                            ) : viewCert ? (
                                <VolunteerCertificateTemplate
                                    ref={certRef}
                                    userName={viewCert.userName}
                                    campaignName={viewCert.campaignName ?? ""}
                                    eventName={viewCert.eventName}
                                    date={viewCert.date}
                                    serialNumber={viewCert.serialNumber}
                                />
                            ) : null}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.shareFullBtn}
                            onPress={() => viewCert && handleShare(viewCert)}
                        >
                            <Ionicons
                                name="share-social-outline"
                                size={20}
                                color={COLORS.white}
                            />
                            <Text style={styles.shareFullText}>Share Certificate</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        gap: 14,
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
    headerTitle: { ...FONTS.h3, color: COLORS.text_primary },
    headerSub: { ...FONTS.caption, color: COLORS.text_muted },
    list: { paddingHorizontal: SPACING.xxl },
    certCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: RADII.l,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 12,
    },
    certIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    certEmoji: { fontSize: 22 },
    certContent: { flex: 1 },
    certTitle: { ...FONTS.label, color: COLORS.text_primary },
    certSub: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },
    certSerial: {
        fontSize: 9,
        color: COLORS.text_disabled,
        marginTop: 2,
        fontFamily: "System",
    },
    certActions: { flexDirection: "row", gap: 6 },
    miniBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: COLORS.surface2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    shareMinBtn: {
        backgroundColor: COLORS.primary + "12",
        borderColor: COLORS.primary + "33",
    },
    loadingWrap: { paddingTop: 60, alignItems: "center" },
    empty: {
        alignItems: "center",
        paddingTop: 60,
        paddingHorizontal: 30,
        gap: 10,
    },
    emptyTitle: { ...FONTS.h4, color: COLORS.text_secondary },
    emptyText: {
        ...FONTS.body3,
        color: COLORS.text_muted,
        textAlign: "center",
        lineHeight: 20,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "90%",
        paddingTop: SPACING.l,
        paddingHorizontal: SPACING.l,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.s,
    },
    modalTitle: { ...FONTS.h4, color: COLORS.text_primary },
    shareFullBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: SPACING.m,
    },
    shareFullText: { ...FONTS.label, color: COLORS.white, fontWeight: "600" },
});
