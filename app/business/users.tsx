"use client"

import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from "react-native"
import { useRouter } from "expo-router"

export default function UsersScreen() {
  const router = useRouter()

  const mockUsers = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Employee", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Manager", status: "Active" },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "Employee", status: "Inactive" },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {mockUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
            <View style={styles.userActions}>
              <View style={[styles.statusBadge, user.status === "Active" ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusText, user.status === "Active" ? styles.activeText : styles.inactiveText]}>
                  {user.status}
                </Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 5,
  },
  backText: {
    fontSize: 16,
    color: "#000000",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  addButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: "#888888",
  },
  userActions: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  activeBadge: {
    backgroundColor: "#E8F5E8",
  },
  inactiveBadge: {
    backgroundColor: "#FFE6E6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  activeText: {
    color: "#2E7D32",
  },
  inactiveText: {
    color: "#C62828",
  },
  editButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
})
