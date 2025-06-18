"use client";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import AppHeader from "@/components/AppHeader";
import type { IUser, UserFormData, FormErrors, IUserBody } from "@/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUsersByBusinessId } from "@/lib/services";
import { auth, db } from "@/backend/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function UsersScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<IUserBody[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      const businessId = user?.businessId;
      if (!businessId) {
        setIsLoading(false);
        return;
      }

      try {
        const users = await fetchUsersByBusinessId(businessId);
        console.log("Users:", users);
        setUsers(users);
      } catch (error) {
        Alert.alert("Error", String(error) || "Failed to fetch users.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [user?.businessId]);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone_number: "",
    expectedArrivalTime: "",
    isAdmin: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleTimeConfirm = (time: Date) => {
    setSelectedTime(time);
    setFormData((prev) => ({ ...prev, expectedArrivalTime: formatTime(time) }));
    hideTimePicker();
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      phone_number: "",
      expectedArrivalTime: "",
      isAdmin: false,
    });
    setErrors({});
    setEditingUser(null);
  };

  const openAddUserDrawer = () => {
    resetForm();
    setIsDrawerVisible(true);
  };

  const openEditUserDrawer = (user: IUserBody) => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      title: user.title || "",
      email: user.email,
      phone_number: user.phone_number,
      expectedArrivalTime: user.expectedArrivalTime || "",
      isAdmin: user.isAdmin,
    });
    setEditingUser(user);
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    resetForm();
  };

  const updateFormField = (
    field: keyof UserFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    let valid = true;
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      valid = false;
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      valid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSaveUser = async () => {
    if (!validateForm() || !user) {
      return;
    }

    setIsSaving(true);
    const { businessId, business } = user;

    try {
      if (editingUser) {
        // Update existing user
        const userData: IUserBody = {
          uid: editingUser.uid,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          title: formData.title.trim() || undefined,
          email: formData.email.trim(),
          phone_number: formData.phone_number.trim(),
          expectedArrivalTime: formData.expectedArrivalTime.trim() || undefined,
          isAdmin: formData.isAdmin,
          createdAt: editingUser.createdAt,
          businessId: businessId,
          business: business,
          status: "active",
        };

        setUsers((prev) =>
          prev.map((user) => (user.uid === editingUser.uid ? userData : user))
        );

        await updateDoc(
          doc(db, "businesses", businessId, "users", editingUser.uid),
          {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone_number: formData.phone_number.trim(),
            isAdmin: formData.isAdmin,
            expectedArrivalTime: formData.expectedArrivalTime?.trim() || null,
            title: formData.title?.trim() || null,
          }
        );
        Alert.alert("Success", "User updated successfully!");
      } else {
        // Add new user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          "123456#"
        );
        const uid = userCredential.user.uid;

        const userData: IUserBody = {
          uid,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          title: formData.title.trim() || undefined,
          email: formData.email.trim(),
          phone_number: formData.phone_number.trim(),
          expectedArrivalTime: formData.expectedArrivalTime.trim() || undefined,
          isAdmin: formData.isAdmin,
          createdAt: new Date().toISOString(),
          businessId: businessId,
          business: business,
          status: "active",
        };
        setUsers((prev) => [userData, ...prev]);

        await setDoc(doc(db, "businesses", businessId, "users", uid), {
          uid,
          ...formData,
          status: "active",
          createdAt: new Date(),
        });
        Alert.alert("Success", "User added successfully!");
      }

      closeDrawer();
    } catch (error) {
      console.error("Error saving user:", error);
      Alert.alert("Error", "Failed to save user. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserStatus = (userId: string, currentStatus: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.uid === userId
          ? {
              ...user,
              status: currentStatus === "active" ? "inactive" : "active",
            }
          : user
      )
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <AppHeader title="Users" showBackButton={true} />,
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddUserDrawer}
          >
            <Text style={styles.addButtonText}>+ Add User</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Users Yet</Text>
            <Text style={styles.emptySubtitle}>
              Get started by adding your first team member
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openAddUserDrawer}
            >
              <Text style={styles.emptyButtonText}>+ Add First User</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {users.map((user) => (
              <View key={user.uid} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userRole}>
                    {user.isAdmin ? "Admin" : "Employee"}{" "}
                    {user.title && `• ${user.title}`}
                  </Text>
                  {user.phone_number && (
                    <Text style={styles.userPhone}>{user.phone_number}</Text>
                  )}
                  {user.expectedArrivalTime && (
                    <Text style={styles.userArrival}>
                      Expected: {user.expectedArrivalTime}
                    </Text>
                  )}
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      user.status === "active"
                        ? styles.activeBadge
                        : styles.inactiveBadge,
                    ]}
                    onPress={() =>
                      toggleUserStatus(user.uid, user?.status || "inactive")
                    }
                  >
                    <Text
                      style={[
                        styles.statusText,
                        user.status === "active"
                          ? styles.activeText
                          : styles.inactiveText,
                      ]}
                    >
                      {user.status}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditUserDrawer(user)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* User Form Drawer */}
        <Modal
          visible={isDrawerVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.drawerContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.drawerContent}
            >
              <View style={styles.drawerHeader}>
                <TouchableOpacity onPress={closeDrawer}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.drawerTitle}>
                  {editingUser ? "Edit User" : "Add User"}
                </Text>
                <TouchableOpacity onPress={handleSaveUser} disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.saveButton}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContainer}>
                {/* First Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    First Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChangeText={(text) => updateFormField("firstName", text)}
                    autoCapitalize="words"
                  />
                  {errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}
                </View>

                {/* Last Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Last Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChangeText={(text) => updateFormField("lastName", text)}
                    autoCapitalize="words"
                  />
                  {errors.lastName && (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  )}
                </View>

                {/* Title */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter title (optional)"
                    value={formData.title}
                    onChangeText={(text) => updateFormField("title", text)}
                    autoCapitalize="words"
                  />
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    value={formData.email}
                    onChangeText={(text) => updateFormField("email", text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Phone Number */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number (optional)"
                    value={formData.phone_number}
                    onChangeText={(text) =>
                      updateFormField("phone_number", text)
                    }
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Expected Arrival Time */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Expected Arrival Time</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={showTimePicker}
                  >
                    <Text>
                      {selectedTime
                        ? formatTime(selectedTime)
                        : "e.g., 09:00 (optional)"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Admin Toggle */}
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Admin Access</Text>
                  <Switch
                    value={formData.isAdmin}
                    onValueChange={(value) => updateFormField("isAdmin", value)}
                    trackColor={{ false: "#E0E0E0", true: "#000000" }}
                    thumbColor={formData.isAdmin ? "#FFFFFF" : "#FFFFFF"}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
        {/* Time Picker */}
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
          date={selectedTime ?? new Date()}
        />
      </SafeAreaView>
    </>
  );
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
    alignItems: "flex-start",
    padding: 15,
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  userInfo: {
    flex: 1,
    paddingRight: 10,
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
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 2,
  },
  userArrival: {
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
  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  cancelButton: {
    color: "#666666",
    fontSize: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  saveButton: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  required: {
    color: "#FF0000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 14,
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
