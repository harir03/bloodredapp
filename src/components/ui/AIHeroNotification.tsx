import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

const { width } = Dimensions.get("window");

interface AIHeroNotificationProps {
    message: string;
    onClose: () => void;
    onPress: () => void;
    type?: "donor" | "volunteer";
}

export const AIHeroNotification: React.FC<AIHeroNotificationProps> = ({
    message,
    onClose,
    onPress,
    type = "donor",
}) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 20,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
        }).start();

        const timer = setTimeout(() => {
            dismiss();
        }, 8000); // Show for 8 seconds

        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        Animated.timing(slideAnim, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    onPress();
                    dismiss();
                }}
                style={[
                    styles.content,
                    type === "donor" ? styles.donorGradient : styles.volunteerGradient,
                ]}
            >
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={type === "donor" ? "heart-circle" : "flash-outline"}
                        size={32}
                        color={COLORS.white}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {type === "donor" ? "Special Ping! 🩸" : "Mission Update! ⚡"}
                    </Text>
                    <Text style={styles.message}>{message}</Text>
                </View>
                <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 50,
        left: 10,
        right: 10,
        zIndex: 9999,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    donorGradient: {
        backgroundColor: COLORS.primary, // Red/Strawberry theme
    },
    volunteerGradient: {
        backgroundColor: "#2E5BFF", // Deep blue/Electric theme
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...FONTS.h4,
        color: COLORS.white,
        fontWeight: "bold",
        marginBottom: 2,
    },
    message: {
        ...FONTS.body3,
        color: "rgba(255, 255, 255, 0.9)",
        lineHeight: 18,
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
});
