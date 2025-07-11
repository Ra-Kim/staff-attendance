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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function LayoutRouter() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();

  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const router = useRouter();
  useEffect(() => {
    if (isLoading) return; // ✅ prevent redirect if loading
    const isAuth = !!auth.currentUser;
    if (isAuthenticated && isAuth) {
      router.replace("/(tabs)/profile");
    } else {
      logout();
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router, logout]);

  if (!loaded || isLoading) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: !isAuthenticated }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {user?.isAdmin && (
              <Stack.Screen
                name="(admin-tabs)"
                options={{ headerShown: false }}
              />
            )}
            <Stack.Screen name="business" options={{ headerShown: false }} />
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
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Provider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <LayoutRouter />
          </GestureHandlerRootView>
        </Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
