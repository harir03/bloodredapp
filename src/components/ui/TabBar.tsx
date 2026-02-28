
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const TabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const totalWidth = width;
  const tabWidth = totalWidth / state.routes.length;

  return (
    <View style={[
      styles.tabBarContainer,
      {
        width: totalWidth,
        paddingBottom: insets.bottom,
        height: 60 + insets.bottom
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const animatedStyle = useAnimatedStyle(() => {
          return {
            transform: [{ translateY: withSpring(isFocused ? -10 : 0) }],
          };
        });

        return (
          <Animated.View key={route.key} style={[styles.tabItem, { width: tabWidth }, animatedStyle]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: 24, height: 24 }}>
                {options.tabBarIcon ? (
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? COLORS.primary : COLORS.text_muted,
                    size: 24,
                  })
                ) : null}
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabBar;
