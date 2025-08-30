import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';

const CustomButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false, 
  style = {},
  textStyle = {} 
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    disabled && styles.disabled,
    style
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    backgroundColor: colors.lightGray,
  },
  text: {
    ...typography.body,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.white,
  },
  disabledText: {
    color: colors.gray,
  },
});

export default CustomButton;