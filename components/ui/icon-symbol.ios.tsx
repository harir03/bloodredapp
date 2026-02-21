import { StyleProp, View, ViewStyle } from 'react-native';

type SymbolWeight = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
type SymbolViewProps = {
  name: string;
  tintColor?: string;
  weight?: SymbolWeight;
  resizeMode?: 'scaleAspectFit' | 'scaleAspectFill' | 'scaleToFill';
  style?: StyleProp<ViewStyle>;
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: color, // Simple fallback placeholder
        },
        style,
      ]}
    />
  );
}
