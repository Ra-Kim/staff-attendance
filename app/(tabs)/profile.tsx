"use client";

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import dayjs from "dayjs";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/backend/firebase";
import InfoField from "@/components/InfoField";
import { IBusiness, IUserBody } from "@/types";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const userBody = user as IUserBody;

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<IUserBody>({
    uid: user?.uid || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    isAdmin: !!user?.isAdmin,
    createdAt: user?.createdAt || "",
    businessId: user?.businessId || "",
    business: user?.business as IBusiness,
    firstName: userBody?.firstName || "",
    lastName: userBody?.lastName || "",
    title: userBody?.title || "",
    expectedArrivalTime: userBody?.expectedArrivalTime || "",
    status: userBody?.status || "inactive",
    profilePicture: undefined,
  });

  const [editedData, setEditedData] = useState<IUserBody>(userData);
  const updateField = useCallback((field: string, text: string) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: text,
    }));
  }, []);
  if (!user) return null;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(userData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { businessId } = user;
    await updateDoc(doc(db, "businesses", businessId, "users", user.uid), {
      firstName: editedData.firstName.trim(),
      lastName: editedData.lastName.trim(),
      phone_number: editedData.phone_number.trim(),
      title: editedData.title?.trim() || null,
    });
    setUserData(editedData);
    setIsEditing(false);
    setIsSaving(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerActions}>
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {userData.profilePicture ? (
              <Image
                source={{ uri: userData.profilePicture }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData.firstName?.charAt(0)}
                  {userData.lastName?.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.userName}>
            {userData.firstName} {userData.lastName}
          </Text>
          <Text style={styles.userTitle}>{userData.title || "Employee"}</Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <InfoField
            key="firstName"
            label="First Name"
            value={userData.firstName}
            field="firstName"
            updateField={updateField}
            editedData={editedData}
            isEditing={isEditing}
          />

          <InfoField
            key="lastName"
            label="Last Name"
            value={userData.lastName}
            field="lastName"
            updateField={updateField}
            editedData={editedData}
            isEditing={isEditing}
          />

          <InfoField
            key="title"
            label="Job Title"
            value={userData.title}
            field="title"
            updateField={updateField}
            editedData={editedData}
            isEditing={isEditing}
          />
        </View>

        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <InfoField
            key="email"
            label="Email"
            value={userData.email}
            field="email"
            keyboardType="email-address"
            updateField={updateField}
            editedData={editedData}
            isEditing={isEditing}
          />

          <InfoField
            key="phone_number"
            label="Phone Number"
            value={userData.phone_number}
            field="phone_number"
            keyboardType="phone-pad"
            updateField={updateField}
            editedData={editedData}
            isEditing={isEditing}
          />
        </View>

        {/* Work Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Settings</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Expected Arrival Time</Text>

            <Text style={styles.fieldValue}>
              {userData.expectedArrivalTime || "Not set"}
            </Text>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Role</Text>
            <Text style={styles.fieldValue}>
              {userData.isAdmin ? "Administrator" : "User"}
            </Text>
          </View>
        </View>

        {/* System Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Member Since</Text>
            <Text style={styles.fieldValue}>
              {dayjs(user?.createdAt).toString().slice(0, 16)}
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 20,
    backgroundColor: "#F8F8F8",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
  },
  headerActions: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  editButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#000000",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
  },
  changePhotoButton: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
  },
  changePhotoText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 10,
  },
  userTitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 5,
  },
  section: {
    marginBottom: 30,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 22,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  statusContainer: {
    flexDirection: "row",
    gap: 10,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  statusButtonActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  statusButtonText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  statusButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#FFE6E6",
  },
  statusText: {
    fontSize: 14,
    color: "#CC0000",
    fontWeight: "bold",
  },
  statusTextActive: {
    backgroundColor: "#E6F7E6",
    color: "#00AA00",
  },
  logoutButton: {
    backgroundColor: "#DC3545",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
