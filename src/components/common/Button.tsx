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

type TabletVariant = 'filled' | 'outlined' | 'text' | 'tonal';
type CrossVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

interface ButtonProps {
  /** Either `label` or `title` works (cross-platform alias). */
  label?: string;
  title?: string;
  onPress: () => void;
  /** Tablet variants `filled|outlined|text|tonal`, plus cross-platform aliases `primary|secondary|danger|ghost|outline`. */
  variant?: TabletVariant | CrossVariant;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  icon?: string;
  /** Either `loading` or `isLoading` works. */
  loading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const VARIANT_ALIASES: Record<CrossVariant, TabletVariant> = {
  primary: 'filled',
  secondary: 'outlined',
  outline: 'outlined',
  ghost: 'text',
  danger: 'filled',
};

const VARIANT_DEFAULT_COLOR: Partial<Record<CrossVariant, string>> = {
  danger: '#ef4444',
};

const normalizeVariant = (v: TabletVariant | CrossVariant): TabletVariant => {
  if (v === 'filled' || v === 'outlined' || v === 'text' || v === 'tonal') return v;
  return VARIANT_ALIASES[v];
};

const Button: React.FC<ButtonProps> = ({
  label,
  title,
  onPress,
  variant = 'filled',
  size = 'md',
  color,
  icon,
  loading,
  isLoading,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const text = label ?? title ?? '';
  const busy = loading ?? isLoading ?? false;
  const tabletVariant = normalizeVariant(variant);
  const resolvedColor = color ?? VARIANT_DEFAULT_COLOR[variant as CrossVariant] ?? '#a855f7';
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13, iconSize: 16 },
    md: { paddingVertical: 12, paddingHorizontal: 22, fontSize: 14, iconSize: 18 },
    lg: { paddingVertical: 15, paddingHorizontal: 28, fontSize: 16, iconSize: 20 },
  }[size];

  const variantContainerStyle: ViewStyle = {
    filled: { backgroundColor: disabled ? '#374151' : resolvedColor },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: disabled ? '#374151' : resolvedColor,
    },
    text: { backgroundColor: 'transparent' },
    tonal: { backgroundColor: disabled ? '#1f2937' : `${resolvedColor}25` },
  }[tabletVariant] as ViewStyle;

  const variantTextColor = {
    filled: disabled ? '#6b7280' : '#fff',
    outlined: disabled ? '#6b7280' : resolvedColor,
    text: disabled ? '#6b7280' : resolvedColor,
    tonal: disabled ? '#6b7280' : resolvedColor,
  }[tabletVariant];

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
      disabled={disabled || busy}
      activeOpacity={0.8}
    >
      {busy ? (
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
            {text}
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
