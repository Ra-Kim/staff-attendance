// app/landing.tsx
import { StyleSheet, Button, View, Text } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Image } from "expo-image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";

export default function LandingScreen() {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter()

  const handleLogin = () => {
    console.log('🔐 Login button pressed - navigating to tabs');
    login()
    router.replace('/(tabs)');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Landing Page</Text>
        <Text style={styles.subtitle}>You are not authenticated</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Login (Switch to Authenticated View)"
          onPress={handleLogin}
        />
      </View>

      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Debug Info:</Text>
        <Text style={styles.debugText}>Authentication State: {isAuthenticated ? 'TRUE' : 'FALSE'}</Text>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  debugContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
});