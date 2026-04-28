import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  outlined?: boolean;
  padding?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevated = true,
  outlined = false,
  padding = 16,
}) => {
  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    outlined && styles.outlined,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.75}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12121a',
    borderRadius: 16,
  },
  elevated: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
});

export default Card;
