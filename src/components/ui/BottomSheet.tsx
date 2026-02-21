
import React, { forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '../../constants/theme';

const { height } = Dimensions.get('window');

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapTo: string;
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(({ children, snapTo }, ref) => {
  const offset = useSharedValue(height);

  const open = useCallback(() => {
    offset.value = withSpring(height - (height * parseFloat(snapTo) / 100), {
      damping: 15,
      stiffness: 150,
    });
  }, [offset, snapTo]);

  const close = useCallback(() => {
    offset.value = withSpring(height, { damping: 15, stiffness: 150 });
  }, [offset]);

  useImperativeHandle(ref, () => ({ open, close }), [open, close]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      offset.value = Math.max(0, event.translationY + (height - (height * parseFloat(snapTo) / 100)));
    })
    .onEnd(() => {
      if (offset.value > height - (height * parseFloat(snapTo) / 100) + 100) {
        runOnJS(close)();
      } else {
        runOnJS(open)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View style={[styles.sheet, animatedStyle]}>
        <GestureDetector gesture={panGesture}>
            <View style={styles.grabber} />
        </GestureDetector>
        {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height,
    backgroundColor: COLORS.surface2,
    borderTopRightRadius: SIZES.radius * 1.5,
    borderTopLeftRadius: SIZES.radius * 1.5,
    padding: SIZES.padding,
    zIndex: 100,
  },
  grabber: {
    width: 60,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: SIZES.padding,
  },
});

export default BottomSheet;
