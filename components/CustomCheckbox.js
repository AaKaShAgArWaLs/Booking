import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';

const CustomCheckbox = ({ 
  label, 
  checked, 
  onPress, 
  style = {},
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[
        styles.checkbox,
        checked && styles.checked,
        disabled && styles.disabled
      ]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[
        styles.label,
        disabled && styles.disabledLabel
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.lightGray,
    borderColor: colors.gray,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  disabledLabel: {
    color: colors.gray,
  },
});

export default CustomCheckbox;