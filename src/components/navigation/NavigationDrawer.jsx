import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Modal,
  BackHandler,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '../../context/DrawerContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/layout';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', emoji: '🏠', route: '/' },
  { id: 'library', label: 'Library', emoji: '📚', route: '/library' },
  { id: 'history', label: 'History', emoji: '🕒', route: '/history' },
  { id: 'settings', label: 'Settings', emoji: '⚙️', route: '/settings' },
];

export function NavigationDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const { colors, neuBorder, neuBorderThick, neuShadow, neuShadowSm } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width: windowWidth } = useWindowDimensions();

  // Desktop vs mobile responsive drawer width
  const isDesktop = windowWidth >= 768;
  const drawerWidth = Math.min(isDesktop ? 320 : windowWidth * 0.82, 340);

  // Animation values & modal visibility state
  const anim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) {
          setModalVisible(false);
        }
      });
    }
  }, [isOpen, anim]);

  // Intercept Android hardware back button when drawer is open
  useEffect(() => {
    if (!modalVisible && !isOpen) return;

    const handleBack = () => {
      closeDrawer();
      return true;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => backSub.remove();
  }, [modalVisible, isOpen, closeDrawer]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth - 20, 0],
  });

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const isRouteSelected = (itemRoute) => {
    if (itemRoute === '/') {
      return (
        pathname === '/' ||
        pathname === '' ||
        pathname === '/index' ||
        pathname === '/(tabs)' ||
        pathname === '/(tabs)/index'
      );
    }
    const cleanRoute = itemRoute.replace('/', '');
    return pathname.includes(cleanRoute);
  };

  const handleNavigate = (route) => {
    closeDrawer();
    if (!isRouteSelected(route)) {
      setTimeout(() => {
        router.push(route);
      }, 100);
    }
  };

  if (!modalVisible && !isOpen) {
    return null;
  }

  return (
    <Modal
      visible={modalVisible || isOpen}
      transparent={true}
      animationType="none"
      onRequestClose={closeDrawer}
      statusBarTranslucent={true}
    >
      <View style={styles.modalRoot}>
        {/* Tap outside backdrop overlay */}
        <TouchableWithoutFeedback onPress={closeDrawer} accessibilityLabel="Close menu backdrop">
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Slide-out Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              width: drawerWidth,
              backgroundColor: colors.surface,
              borderRightColor: colors.border,
              borderRightWidth: 3,
              paddingTop: Math.max(insets.top, 24),
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateX }],
            },
            neuShadow,
          ]}
        >
          {/* Drawer Header */}
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.brandLogoBox,
                  { backgroundColor: colors.yellow, borderColor: colors.border },
                  neuBorder,
                  neuShadowSm,
                ]}
              >
                <Text style={styles.brandLogoText}>R</Text>
              </View>
              <View>
                <Text style={[styles.brandTitle, { color: colors.text }]}>READO</Text>
                <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
                  NOVELS & COMICS
                </Text>
              </View>
            </View>

            {/* Close Button (✕) */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                neuBorder,
                neuShadowSm,
              ]}
              onPress={closeDrawer}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close drawer"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Neubrutalist Accent Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Navigation List */}
          <ScrollView
            contentContainerStyle={styles.navItemsList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {NAV_ITEMS.map((item) => {
              const isSelected = isRouteSelected(item.route);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.navItem,
                    neuBorderThick,
                    isSelected
                      ? [styles.selectedNavItem, { backgroundColor: colors.yellow }, neuShadowSm]
                      : [styles.unselectedNavItem, { backgroundColor: colors.surface }],
                  ]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Navigate to ${item.label}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.navItemLeft} pointerEvents="none">
                    <Text style={styles.navItemEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.navItemText,
                        isSelected ? styles.selectedItemText : { color: colors.text },
                      ]}
                    >
                      {item.label.toUpperCase()}
                    </Text>
                  </View>

                  {isSelected ? (
                    <View
                      style={[styles.activeBadge, { borderColor: '#171717' }]}
                      pointerEvents="none"
                    >
                      <Ionicons name="arrow-forward" size={16} color="#171717" />
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Drawer Footer */}
          <View style={styles.footerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View
              style={[
                styles.footerBadge,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                neuBorder,
              ]}
            >
              <Text style={[styles.footerBadgeText, { color: colors.textSecondary }]}>
                ⚡ NEUBRUTALISM SYSTEM v1.0
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.quickCloseButton,
                { backgroundColor: colors.coral, borderColor: colors.border },
                neuBorder,
                neuShadowSm,
              ]}
              onPress={closeDrawer}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <Text style={styles.quickCloseText}>CLOSE MENU ✕</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    elevation: 20,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  brandLogoBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: -0.5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 2.5,
    marginVertical: SPACING.md,
    width: '100%',
  },
  navItemsList: {
    flex: 1,
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  selectedNavItem: {
    // Yellow background dynamically passed in
  },
  unselectedNavItem: {
    // Surface background dynamically passed in
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  navItemEmoji: {
    fontSize: 20,
  },
  navItemText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  selectedItemText: {
    color: '#171717',
    fontWeight: '900',
  },
  activeBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContainer: {
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  footerBadge: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
  },
  footerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickCloseButton: {
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCloseText: {
    color: '#171717',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
