import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search novels and comics...',
  style,
}) {
  const { colors, neuBorder, neuShadowSm } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        neuBorder,
        neuShadowSm,
        style,
      ]}
    >
      <Ionicons
        name="search"
        size={20}
        color={colors.text}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[TYPOGRAPHY.bodyBold, styles.input, { color: colors.text }]}
        autoCorrect={false}
      />
      {value ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearBtn}
        >
          <Ionicons name="close-circle" size={18} color={colors.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: RADIUS.sm,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
  },
  clearBtn: {
    padding: 2,
  },
});
