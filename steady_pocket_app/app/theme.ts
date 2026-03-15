import { StyleSheet } from 'react-native';

// ── AMOLED Colors ─────────────────────────────────────────────────────────
export const COLORS = {
  background: '#000000',
  surface: '#121212',      // Level 1 surface
  primary: '#3B82F6',      // Primary accent (Google Blue-ish)
  primaryText: '#FFFFFF',
  secondary: '#22C55E',    // Success green
  textDark: '#FFFFFF',     // Main text (inverted for dark mode)
  textSubtle: '#A1A1AA',   // Secondary text
  border: '#27272A',       // Divider / Subtle border
  error: '#EF4444',        // Error red
  success: '#22C55E',      // Success green
};

// ── Typography ────────────────────────────────────────────────────────────
export const TYPOGRAPHY = StyleSheet.create({
  titleLarge: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.textDark,
    letterSpacing: -0.5,
    marginBottom: 16,
    lineHeight: 36,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textDark,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: COLORS.textSubtle,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyHighlight: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ── Components ────────────────────────────────────────────────────────────
export const COMPONENTS = StyleSheet.create({
  // Main screen container
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentPad: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  
  // Bottom-right button container
  bottomCornerAction: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  
  // Primary Button (AMOLED: rounded 999, colored primary)
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999, // Google pill button shape
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonPrimaryDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonPrimaryText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  
  // Secondary button
  buttonText: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  buttonTextLabel: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Highlight badge
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSubtle,
  },
});

