import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'text' | 'tonal';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'filled',
  size = 'md',
  color = '#a855f7',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13, iconSize: 16 },
    md: { paddingVertical: 12, paddingHorizontal: 22, fontSize: 14, iconSize: 18 },
    lg: { paddingVertical: 15, paddingHorizontal: 28, fontSize: 16, iconSize: 20 },
  }[size];

  const variantContainerStyle: ViewStyle = {
    filled: { backgroundColor: disabled ? '#374151' : color },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: disabled ? '#374151' : color,
    },
    text: { backgroundColor: 'transparent' },
    tonal: { backgroundColor: disabled ? '#1f2937' : `${color}25` },
  }[variant] as ViewStyle;

  const variantTextColor = {
    filled: disabled ? '#6b7280' : '#fff',
    outlined: disabled ? '#6b7280' : color,
    text: disabled ? '#6b7280' : color,
    tonal: disabled ? '#6b7280' : color,
  }[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantContainerStyle,
        { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size={sizeStyles.iconSize} color={variantTextColor} />
      ) : (
        <>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={sizeStyles.iconSize}
              color={variantTextColor}
            />
          )}
          <Text
            style={[
              styles.label,
              { fontSize: sizeStyles.fontSize, color: variantTextColor },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 8,
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default Button;
