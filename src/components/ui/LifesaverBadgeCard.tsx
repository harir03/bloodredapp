import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React, { useRef } from "react";
import {
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

interface LifesaverBadgeCardProps {
    userName: string;
    donationDate?: string;
}

export const LifesaverBadgeCard = ({ userName, donationDate }: LifesaverBadgeCardProps) => {
    const viewRef = useRef(null);

    const handleShare = async () => {
        try {
            const message = `🩸 ${userName}'s blood has saved someone's life! Thank you for your incredible contribution to BloodConnect. Together we make a difference! ❤️‍🩹 #BloodConnect #Lifesaver #DonateBlood`;

            let imageUri: string | null = null;
            try {
                if (viewRef.current) {
                    imageUri = await captureRef(viewRef, {
                        format: "png",
                        quality: 1,
                    });
                }
            } catch (e) {
                console.log("Failed to capture lifesaver card", e);
            }

            if (imageUri && (await Sharing.isAvailableAsync())) {
                await Sharing.shareAsync(imageUri, {
                    dialogTitle: "Share Lifesaver Badge",
                    mimeType: "image/png",
                    UTI: "public.png",
                });
            } else {
                await Share.share({
                    message,
                    title: "Lifesaver Badge — BloodConnect",
                });
            }
        } catch (error: any) {
            // Handled by Share API
        }
    };

    return (
        <View collapsable={false} ref={viewRef} style={styles.container}>
            <View style={styles.iconRow}>
                <View style={styles.heartBg}>
                    <Text style={styles.heartEmoji}>❤️‍🩹</Text>
                </View>
            </View>

            <Text style={styles.title}>Lifesaver</Text>
            <Text style={styles.message}>
                🩸 Your blood has saved someone's life!{"\n"}
                Thank you for your incredible contribution.
            </Text>

            {donationDate && (
                <Text style={styles.dateText}>
                    Donated on{" "}
                    {new Date(donationDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </Text>
            )}

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={18} color={COLORS.white} />
                <Text style={styles.shareBtnText}>Share on Social Media</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.primary + "44",
        alignItems: "center",
        marginBottom: SPACING.l,
    },
    iconRow: {
        marginBottom: SPACING.m,
    },
    heartBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primary + "18",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.primary + "44",
    },
    heartEmoji: {
        fontSize: 36,
    },
    title: {
        ...FONTS.h3,
        color: COLORS.primary,
        fontWeight: "700",
        marginBottom: 6,
    },
    message: {
        ...FONTS.body3,
        color: COLORS.text_secondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: SPACING.m,
    },
    dateText: {
        ...FONTS.caption,
        color: COLORS.text_muted,
        marginBottom: SPACING.m,
    },
    shareBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    shareBtnText: {
        ...FONTS.label,
        color: COLORS.white,
        fontWeight: "600",
    },
});
