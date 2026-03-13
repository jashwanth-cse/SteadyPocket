import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_NAME } from '../../services/constants';
import { COLORS, TYPOGRAPHY, COMPONENTS } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Slide Data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    icon: '🛡️',
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',
    title: 'Protect Your Earnings',
    description:
      `${APP_NAME} protects delivery riders from income loss caused by strikes, rains, and unexpected disruptions.`,
  },
  {
    id: '2',
    icon: '⚡',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    title: 'Automatic Payouts',
    description:
      'When disruptions occur, payouts are triggered automatically — no paperwork, no waiting.',
  },
  {
    id: '3',
    icon: '🤖',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    title: 'AI Powered Protection',
    description:
      'Advanced AI models detect disruptions in real time and ensure fair, transparent protection for every rider.',
  },
];

// ─── Slide Component ───────────────────────────────────────────────────────────
function Slide({ item }: { item: (typeof SLIDES)[0] }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Icon Illustration */}
      <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
        <Text style={styles.iconEmoji}>{item.icon}</Text>
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={[TYPOGRAPHY.titleLarge, { textAlign: 'center', marginBottom: 16 }]} numberOfLines={2} adjustsFontSizeToFit>
          {item.title}
        </Text>
        <Text style={[TYPOGRAPHY.body, { textAlign: 'center' }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AppTourScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.replace('/phone-auth');
    }
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={COMPONENTS.screen} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => <Slide item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        style={styles.flatList}
      />

      {/* Bottom Controls (Google Style) */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action Buttons in Bottom Row */}
        <View style={COMPONENTS.bottomCornerAction}>
          {!isLastSlide ? (
            <>
              <TouchableOpacity
                style={COMPONENTS.buttonText}
                onPress={() => router.replace('/phone-auth')}
              >
                <Text style={COMPONENTS.buttonTextLabel}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={COMPONENTS.buttonPrimary}
                onPress={handleNext}
              >
                <Text style={COMPONENTS.buttonPrimaryText}>Next</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[COMPONENTS.buttonPrimary, { flex: 1, marginLeft: 0 }]}
              onPress={handleNext}
            >
              <Text style={COMPONENTS.buttonPrimaryText}>Get Started →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flatList: {
    flex: 1,
  },
  // Slide
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 40,
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconEmoji: {
    fontSize: 60,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 24,
    alignItems: 'center',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.secondary,
    marginRight: 8,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.border,
    marginRight: 8,
  },
});
