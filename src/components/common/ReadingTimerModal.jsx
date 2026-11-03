import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReadingTimer, TIMER_PRESETS } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export function ReadingTimerModal({ visible, onClose }) {
  const {
    isRunning,
    isPaused,
    remainingSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
  } = useReadingTimer();

  const { colors, neuBorder, neuBorderThick, neuShadow, neuShadowSm } = useTheme();
  const [customMinutes, setCustomMinutes] = useState('');

  const handleStartPreset = (minutes) => {
    startTimer(minutes);
    onClose();
  };

  const handleStartCustom = () => {
    const mins = parseFloat(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      startTimer(mins);
      setCustomMinutes('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background, borderColor: colors.border },
                neuShadow,
              ]}
            >
              {/* Neubrutalist Header Block */}
              <View
                style={[
                  styles.headerBlock,
                  { backgroundColor: colors.yellow, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.titleRow}>
                  <Ionicons name="timer" size={24} color="#171717" />
                  <Text style={[TYPOGRAPHY.h2, styles.headerTitle]}>
                    READING TIMER
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    neuShadowSm,
                  ]}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.bodyContent}>
                {/* Active Timer Countdown Box */}
                {isRunning ? (
                  <View
                    style={[
                      styles.activeContainer,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      neuBorder,
                      neuShadowSm,
                    ]}
                  >
                    <Text style={[TYPOGRAPHY.sticker, { color: colors.textSecondary }]}>
                      COUNTDOWN RUNNING
                    </Text>
                    <Text style={[styles.activeTime, { color: colors.text }]}>
                      {formatTime(remainingSeconds)}
                    </Text>
                    <View style={styles.controlRow}>
                      {isPaused ? (
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            { backgroundColor: colors.mint, borderColor: colors.border },
                            neuBorder,
                            neuShadowSm,
                          ]}
                          onPress={resumeTimer}
                        >
                          <Ionicons name="play" size={16} color="#171717" />
                          <Text style={styles.actionBtnText}>Resume</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            { backgroundColor: colors.lavender, borderColor: colors.border },
                            neuBorder,
                            neuShadowSm,
                          ]}
                          onPress={pauseTimer}
                        >
                          <Ionicons name="pause" size={16} color="#171717" />
                          <Text style={styles.actionBtnText}>Pause</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { backgroundColor: colors.coral, borderColor: colors.border },
                          neuBorder,
                          neuShadowSm,
                        ]}
                        onPress={stopTimer}
                      >
                        <Ionicons name="stop" size={16} color="#171717" />
                        <Text style={styles.actionBtnText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <Text style={[TYPOGRAPHY.sticker, { color: colors.text, marginBottom: SPACING.sm }]}>
                  {isRunning ? 'SELECT NEW DURATION' : 'SET SESSION TIMER'}
                </Text>

                {/* Duration Presets */}
                <View style={styles.presetsGrid}>
                  {TIMER_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.presetBtn,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        neuBorder,
                        neuShadowSm,
                      ]}
                      onPress={() => handleStartPreset(preset.minutes)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="hourglass-outline"
                        size={18}
                        color={colors.text}
                      />
                      <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Duration Input */}
                <View style={styles.customContainer}>
                  <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: SPACING.xs }]}>
                    CUSTOM DURATION (MINUTES)
                  </Text>
                  <View style={styles.customRow}>
                    <TextInput
                      style={[
                        styles.customInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                        neuBorder,
                      ]}
                      placeholder="e.g. 45"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={customMinutes}
                      onChangeText={setCustomMinutes}
                    />
                    <TouchableOpacity
                      style={[
                        styles.startCustomBtn,
                        { backgroundColor: colors.yellow, borderColor: colors.border },
                        neuBorder,
                        neuShadowSm,
                        !customMinutes && styles.startCustomBtnDisabled,
                      ]}
                      disabled={!customMinutes}
                      onPress={handleStartCustom}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.startCustomText}>START</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS.md,
    borderWidth: 2.5,
    overflow: 'hidden',
  },
  headerBlock: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 2.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  headerTitle: {
    color: '#171717',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    padding: SPACING.md + 2,
  },
  activeContainer: {
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  activeTime: {
    fontSize: 40,
    fontWeight: '900',
    marginVertical: SPACING.xs,
    letterSpacing: -1,
  },
  controlRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  actionBtnText: {
    color: '#171717',
    fontWeight: '800',
    fontSize: 13,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  presetBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
  },
  customContainer: {
    marginTop: SPACING.xs,
  },
  customRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  customInput: {
    flex: 1,
    height: 46,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontWeight: '700',
  },
  startCustomBtn: {
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  startCustomBtnDisabled: {
    opacity: 0.5,
  },
  startCustomText: {
    color: '#171717',
    fontWeight: '900',
    fontSize: 12,
  },
});
