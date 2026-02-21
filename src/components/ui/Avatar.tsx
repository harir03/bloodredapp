
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface AvatarProps {
  source?: string;
  name: string;
  size?: number;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({ source, name, size = 48, style }) => {
  const getInitials = () => {
    if (!name) return '';
    const words = name.split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    } else if (name.length > 1) {
      return `${name[0]}${name[1]}`.toUpperCase();
    } else {
        return name.toUpperCase();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.primary_dim,
        },
        style,
      ]}
    >
      {source ? (
        <Image source={{ uri: source }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { fontSize: size / 2.5 }]}>
          {getInitials()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    ...FONTS.h3,
    color: COLORS.text_primary,
  },
});

export default Avatar;
