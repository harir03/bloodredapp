import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/theme";

interface DonorCertificateTemplateProps {
    userName: string;
    bloodGroup: string;
    unitsDonated: number;
    eventName: string;
    date: string;
    serialNumber: string;
}

const DonorCertificateTemplate = React.forwardRef<View, DonorCertificateTemplateProps>(
    ({ userName, bloodGroup, unitsDonated, eventName, date, serialNumber }, ref) => {
        return (
            <View ref={ref} collapsable={false} style={styles.container}>
                {/* Decorative top border */}
                <View style={styles.topBorder} />

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🩸</Text>
                    <Text style={styles.orgName}>BLOODCONNECT OPS</Text>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.title}>CERTIFICATE OF APPRECIATION</Text>
                    <Text style={styles.subtitle}>Blood Donation</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Body */}
                <Text style={styles.preText}>This is to certify that</Text>
                <Text style={styles.name}>{userName}</Text>
                <Text style={styles.bodyText}>
                    has generously donated{" "}
                    <Text style={styles.highlight}>{unitsDonated} unit(s)</Text> of{" "}
                    <Text style={styles.highlight}>{bloodGroup}</Text> blood
                </Text>
                <Text style={styles.bodyText}>
                    at <Text style={styles.highlight}>{eventName}</Text>
                </Text>
                <Text style={styles.dateText}>on {new Date(date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric"
                })}</Text>

                {/* Message */}
                <View style={styles.messageBox}>
                    <Text style={styles.messageIcon}>❤️</Text>
                    <Text style={styles.messageText}>
                        Your generous donation has saved lives. Thank you for being a hero!
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.signatureLine}>
                        <View style={styles.sigLine} />
                        <Text style={styles.sigLabel}>Authorized Signatory</Text>
                    </View>
                    <View style={styles.serialBox}>
                        <Text style={styles.serialLabel}>Certificate No.</Text>
                        <Text style={styles.serialText}>{serialNumber}</Text>
                    </View>
                </View>

                {/* Bottom border */}
                <View style={styles.bottomBorder} />
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 28,
        borderWidth: 3,
        borderColor: COLORS.primary,
        width: 340,
        alignSelf: "center",
    },
    topBorder: {
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        marginBottom: 16,
        marginHorizontal: -10,
    },
    header: {
        alignItems: "center",
        marginBottom: 12,
    },
    logo: {
        fontSize: 36,
        marginBottom: 4,
    },
    orgName: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 3,
        color: COLORS.primary,
    },
    titleSection: {
        alignItems: "center",
        marginBottom: 16,
    },
    dividerLine: {
        width: 60,
        height: 1,
        backgroundColor: COLORS.primary + "44",
        marginVertical: 6,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1A1A",
        letterSpacing: 1.5,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: "500",
        marginTop: 2,
    },
    preText: {
        fontSize: 11,
        color: "#666666",
        textAlign: "center",
        marginBottom: 2,
    },
    name: {
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.primary,
        textAlign: "center",
        marginBottom: 8,
        fontStyle: "italic",
    },
    bodyText: {
        fontSize: 12,
        color: "#333333",
        textAlign: "center",
        lineHeight: 18,
    },
    highlight: {
        fontWeight: "700",
        color: COLORS.primary,
    },
    dateText: {
        fontSize: 11,
        color: "#666666",
        textAlign: "center",
        marginTop: 6,
        marginBottom: 14,
    },
    messageBox: {
        backgroundColor: COLORS.primary + "0D",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.primary + "22",
    },
    messageIcon: {
        fontSize: 18,
        marginBottom: 4,
    },
    messageText: {
        fontSize: 10,
        color: "#555555",
        textAlign: "center",
        fontStyle: "italic",
        lineHeight: 15,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    signatureLine: {
        alignItems: "center",
    },
    sigLine: {
        width: 80,
        height: 1,
        backgroundColor: "#CCCCCC",
        marginBottom: 4,
    },
    sigLabel: {
        fontSize: 8,
        color: "#999999",
    },
    serialBox: {
        alignItems: "flex-end",
    },
    serialLabel: {
        fontSize: 7,
        color: "#AAAAAA",
        marginBottom: 1,
    },
    serialText: {
        fontSize: 8,
        color: "#888888",
        fontWeight: "600",
    },
    bottomBorder: {
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        marginTop: 16,
        marginHorizontal: -10,
    },
});

export default DonorCertificateTemplate;
