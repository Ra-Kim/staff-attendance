"use client"
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native"
import { useAuth } from "@/contexts/AuthContext"

export default function ProfileScreen() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>User: {user?.email}</Text>
        <Text style={styles.subtitle}>Role: {user?.isAdmin ? "Admin":"User"}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#000000",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 30,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
})
