import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// ── Colors ────────────────────────────────────────────────────────────────
export const COLORS = {
  background: '#FFFFFF', // Pure white
  surface: '#F8F9FA',    // Very light grey for slight contrast
  primary: '#1F1F1F',    // Almost black for buttons
  primaryText: '#FFFFFF',
  secondary: '#0B57D0',  // Google Blue for accents/links
  textDark: '#1F1F1F',   // Main text
  textSubtle: '#5F6368', // Secondary text (Google Gray)
  border: '#DADCE0',     // Subtle border
  error: '#D93025',      // Google Red
  success: '#188038',    // Google Green
};

// ── Typography ────────────────────────────────────────────────────────────
// Note in React Native, weight '500' is Medium, '400' is Regular.
export const TYPOGRAPHY = StyleSheet.create({
  titleLarge: {
    fontSize: 28,
    fontWeight: '400',
    color: COLORS.textDark,
    letterSpacing: 0,
    marginBottom: 16,
    lineHeight: 36,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '400',
    color: COLORS.textDark,
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
    paddingTop: 32, // More breathable top padding
  },
  
  // Google style bottom-right button container
  bottomCornerAction: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Aligns to the right
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  
  // Google style action button (Black, rounded rect)
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8, // Google accounts use slight rounding on web, or full pills (100) on mobile. We'll use 8 for a clean squircle.
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonPrimaryDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonPrimaryText: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  
  // Secondary button (text only or subtle outline)
  buttonText: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  buttonTextLabel: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '500',
  },

  // Highlight badge (e.g. for a step indicator)
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
