import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';

interface TwoPaneProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftFlex?: number;
  rightFlex?: number;
  leftStyle?: ViewStyle;
  rightStyle?: ViewStyle;
  scrollLeft?: boolean;
  scrollRight?: boolean;
}

const TwoPane: React.FC<TwoPaneProps> = ({
  leftContent,
  rightContent,
  leftFlex = 2,
  rightFlex = 3,
  leftStyle,
  rightStyle,
  scrollLeft = true,
  scrollRight = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.leftPane, { flex: leftFlex }, leftStyle]}>
        {scrollLeft ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.paneContent}
          >
            {leftContent}
          </ScrollView>
        ) : (
          <View style={styles.paneContent}>{leftContent}</View>
        )}
      </View>
      <View style={styles.divider} />
      <View style={[styles.rightPane, { flex: rightFlex }, rightStyle]}>
        {scrollRight ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.paneContent}
          >
            {rightContent}
          </ScrollView>
        ) : (
          <View style={styles.paneContent}>{rightContent}</View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    backgroundColor: '#0d0d17',
  },
  rightPane: {
    backgroundColor: '#0a0a0f',
  },
  divider: {
    width: 1,
    backgroundColor: '#1e1e2e',
  },
  paneContent: {
    padding: 16,
    flexGrow: 1,
  },
});

export default TwoPane;
