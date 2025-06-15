// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { auth } from "@/backend/firebase";

function LayoutRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const router = useRouter();
  useEffect(() => {
    if (isLoading) return; // ✅ prevent redirect if loading
    const isAuth = !!auth.currentUser
    if (isAuthenticated && isAuth) {
      router.replace("/(tabs)");
    } else {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (!loaded || isLoading) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </>
        ) : (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayoutScreen() {
  return (
    <AuthProvider>
      <LayoutRouter />
    </AuthProvider>
  );
}
