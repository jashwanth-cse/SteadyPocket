import { withTiming, Easing, withSpring } from 'react-native-reanimated';

export const motion = {
  duration: {
    short: 150,
    medium: 300,
    long: 500,
  },
  easing: {
    standard: Easing.bezier(0.2, 0.0, 0, 1.0),
    emphasized: Easing.bezier(0.2, 0.0, 0, 1.0),
    decelerated: Easing.bezier(0.0, 0.0, 0.2, 1.0),
    accelerated: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  },
  spring: {
    stiffness: 250,
    damping: 20,
    mass: 1,
  },
  
  // Reusable animations
  pressScale: (pressed: boolean) => 
    withSpring(pressed ? 0.96 : 1, { stiffness: 400, damping: 25 }),
    
  fadeIn: (visible: boolean) => 
    withTiming(visible ? 1 : 0, { duration: 300, easing: Easing.bezier(0.2, 0, 0, 1) }),
    
  slideUp: (visible: boolean, offset = 20) => 
    withTiming(visible ? 0 : offset, { duration: 300, easing: Easing.out(Easing.exp) }),
};
