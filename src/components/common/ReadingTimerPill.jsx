import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReadingTimer } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { ReadingTimerModal } from './ReadingTimerModal';
import { RADIUS, SPACING } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export function ReadingTimerPill({ style, forceShow = false }) {
  const { isRunning, isPaused, remainingSeconds, formatTime } = useReadingTimer();
  const { colors, neuBorder, neuShadowSm } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (!isRunning && !forceShow) return null;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.pill,
          neuBorder,
          neuShadowSm,
          isRunning && !isPaused && { backgroundColor: colors.yellow },
          isPaused && { backgroundColor: colors.coral },
          !isRunning && { backgroundColor: colors.surface },
          style,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Reading Timer"
      >
        <Ionicons
          name={isRunning ? (isPaused ? 'pause' : 'timer') : 'timer-outline'}
          size={16}
          color={isRunning ? '#171717' : colors.text}
        />
        <Text
          style={[
            TYPOGRAPHY.sticker,
            styles.text,
            { color: isRunning ? '#171717' : colors.text },
          ]}
        >
          {isRunning ? formatTime(remainingSeconds) : 'TIMER'}
        </Text>
      </TouchableOpacity>

      <ReadingTimerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  text: {
    fontSize: 11,
  },
});
