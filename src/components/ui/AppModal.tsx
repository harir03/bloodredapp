
import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS, SIZES } from '../../constants/theme';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const AppModal: React.FC<AppModalProps> = ({ visible, onClose, children }) => {
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
            entering={FadeIn.duration(300).delay(100)}
            exiting={FadeOut.duration(300)}
            style={styles.container}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  container: {
    backgroundColor: COLORS.surface2,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    width: '100%',
    maxWidth: 400,
  },
});

export default AppModal;
