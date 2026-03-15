import { TextStyle } from 'react-native';

type FontWeight = '400' | '500' | '600';

export const typography = {
  weights: {
    regular: '400' as FontWeight,
    medium: '500' as FontWeight,
    semibold: '600' as FontWeight,
  },
  headingLarge: {
    fontSize: 32,
    fontWeight: '600' as FontWeight,
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,
  headingMedium: {
    fontSize: 24,
    fontWeight: '600' as FontWeight,
    lineHeight: 32,
    letterSpacing: -0.5,
  } as TextStyle,
  title: {
    fontSize: 18,
    fontWeight: '500' as FontWeight,
    lineHeight: 24,
    letterSpacing: 0.15,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '400' as FontWeight,
    lineHeight: 20,
    letterSpacing: 0.25,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400' as FontWeight,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,
};
