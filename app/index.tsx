"use client"

import { useAuth } from "@/contexts/AuthContext"
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"
import { useEffect } from "react"
import { useRouter } from "expo-router"

export default function IndexScreen() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Set a timeout to navigate to landing screen after 3 seconds
    const timer = setTimeout(() => {
      router.replace("/landing")
    }, 3000)

    // Clear the timeout if the component unmounts
    return () => clearTimeout(timer)
  }, [router])

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>TheDot</Text>
      <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      <Text style={styles.loadingText}>Loading...</Text>
      <Text style={styles.debugText}>Auth State: {isAuthenticated ? "Authenticated" : "Not Authenticated"}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  loader: {
    marginTop: 10,
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
})
