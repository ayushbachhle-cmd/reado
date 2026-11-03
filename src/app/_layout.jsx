import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { TimerProvider } from '../context/TimerContext';
import { DrawerProvider } from '../context/DrawerContext';
import { NavigationDrawer } from '../components/navigation/NavigationDrawer';

function RootNavigation() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.background}
      />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '900',
            fontSize: 18,
            color: colors.text,
          },
          headerShadowVisible: true,
          contentStyle: {
            backgroundColor: colors.background,
            flex: 1,
            height: '100%',
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="book/[id]"
          options={{
            title: 'BOOK DETAILS',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="reader/[id]"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={styles.rootContainer}>
      <ThemeProvider>
        <TimerProvider>
          <DrawerProvider>
            <RootNavigation />
            <NavigationDrawer />
          </DrawerProvider>
        </TimerProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});
