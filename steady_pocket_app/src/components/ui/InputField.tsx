import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TextInputProps, ViewStyle, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  error, 
  containerStyle, 
  style,
  onFocus,
  onBlur,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused, !!error && styles.labelError]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputContainer, 
        isFocused && styles.inputFocused,
        !!error && styles.inputError
      ]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textSecondary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  labelFocused: {
    color: colors.primary,
  },
  labelError: {
    color: colors.error,
  },
  inputContainer: {
    backgroundColor: colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surface3,
    minHeight: 56,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface1,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
