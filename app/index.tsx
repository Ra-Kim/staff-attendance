import { useEffect } from "react";
import { useRouter, usePathname } from "expo-router"; // ✅ usePathname added
import { useAuth } from "@/contexts/AuthContext";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // ✅ track current route

  useEffect(() => {
    if (isLoading || pathname !== "/") return; // ✅ prevent redirect if not on root

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/landing");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, pathname, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.loadingText}>Loading...</Text>
      <Text style={styles.debugText}>
        Auth State: {isAuthenticated ? "Authenticated" : "Not Authenticated"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  debugText: {
    marginTop: 20,
    fontSize: 12,
    color: "#666",
    fontFamily: "SpaceMono",
  },
});
