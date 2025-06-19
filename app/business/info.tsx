"use client";

import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { businessTypes } from "@/lib/constants";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";
import AppHeader from "@/components/AppHeader";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/backend/firebase";

export interface IBusiness {
  address: string;
  adminId: string;
  businessId: string;
  business_name: string;
  business_type: string;
  createdAt: string;
  email: string;
  phone_number: string;
  expectedArrivalTime?: string;
  bufferMinutes?: number;
  bufferEnabled?: boolean;
}

const InfoField = ({
  label,
  value,
  field,
  multiline = false,
  keyboardType = "default",
  isEditing,
  editedData,
  updateField,
}: {
  label: string;
  value: string | undefined;
  field: keyof IBusiness;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  isEditing: boolean;
  editedData: IBusiness;
  updateField: (field: string, value: string) => void;
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {isEditing && field !== "email" ? (
      <TextInput
        style={[styles.fieldInput, multiline && styles.multilineInput]}
        value={editedData[field as keyof IBusiness]?.toString() || ""}
        onChangeText={(text) => updateField(field, text)}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    ) : (
      <Text style={styles.fieldValue}>{value || "Not set"}</Text>
    )}
  </View>
);

export default function BusinessInfoScreen() {
  const { user, login } = useAuth();
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    console.log(user?.business);
  }, [user?.business]);

  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleTimeConfirm = (time: Date) => {
    setSelectedTime(time);
    setEditedData((prev) => ({
      ...prev,
      expectedArrivalTime: formatTime(time),
    }));
    hideTimePicker();
  };

  const [businessData, setBusinessData] = useState<IBusiness>({
    address: user?.business.address || "",
    adminId: user?.business?.adminId || "",
    businessId: user?.business?.businessId || "",
    business_name: user?.business?.business_name || "",
    business_type: user?.business?.business_type || "",
    createdAt: user?.business?.createdAt || "",
    email: user?.business?.email || "",
    phone_number: user?.business?.phone_number || "",
    expectedArrivalTime: user?.business?.expectedArrivalTime || "",
    bufferMinutes: user?.business?.bufferMinutes || 0,
    bufferEnabled: user?.business?.bufferEnabled || false,
  });

  const [editedData, setEditedData] = useState<IBusiness>(businessData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(businessData);
  };

  const handleSave = async () => {
    try {
      if (!user?.business?.businessId) {
        Alert.alert("Error", "Business ID is missing.");
        return;
      }
      setIsSaving(true);
      const businessRef = doc(db, "businesses", user.business.businessId);

      // Prepare update payload
      const updatedData = {
        ...editedData,
        updatedAt: new Date(),
      };


      // Update in Firestore
      await updateDoc(businessRef, updatedData);

      // Optionally update context (merge new data with user)
      login({
        ...user,
        business: {
          ...user.business,
          ...updatedData,
          createdAt: user.business.createdAt, // preserve original
        },
      });

      setBusinessData(editedData);
      setIsSaving(false);
      setIsEditing(false);
      Alert.alert("Success", "Business information updated successfully!");
    } catch (error: any) {
      console.error("Error updating business info:", error);
      setIsSaving(false);
      Alert.alert("Error", "Failed to update business info.");
    }
  };

  const handleCancel = () => {
    setEditedData(businessData);
    setIsEditing(false);
  };

  const updateField = useCallback((field: string, value: any) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);


  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <AppHeader showBackButton={true} />,
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Business Information</Text>
          <View style={styles.headerActions}>
            {isEditing ? (
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.saveButton}
                  disabled={isSaving}
                >
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
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <InfoField
              label="Business Name"
              value={businessData.business_name}
              field="business_name"
              updateField={updateField}
              isEditing={isEditing}
              editedData={editedData}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Business Type</Text>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() =>
                      setShowBusinessTypeDropdown(!showBusinessTypeDropdown)
                    }
                  >
                    <Text
                      style={[
                        styles.input,
                        !businessData.business_type && styles.placeholderText,
                      ]}
                    >
                      {editedData.business_type || "Select Business Type"}
                    </Text>
                    <Text style={styles.dropdownArrow}>
                      {showBusinessTypeDropdown ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>

                  {showBusinessTypeDropdown && (
                    <View style={styles.dropdownContainer}>
                      {businessTypes.map((type, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => {
                            updateField("business_type", type);
                            setShowBusinessTypeDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.fieldValue}>
                  {businessData.business_type}
                </Text>
              )}
            </View>

            <InfoField
              key={"email"}
              label="Email"
              value={businessData.email}
              field="email"
              keyboardType="email-address"
              updateField={updateField}
              editedData={editedData}
              isEditing={isEditing}
            />

            <InfoField
              label="Phone Number"
              value={businessData.phone_number}
              field="phone_number"
              keyboardType="phone-pad"
              updateField={updateField}
              editedData={editedData}
              isEditing={isEditing}
              key={"phone_number"}
            />

            <InfoField
              label="Address"
              value={businessData.address}
              field="address"
              multiline
              updateField={updateField}
              editedData={editedData}
              isEditing={isEditing}
              key={"address"}
            />
          </View>

          {/* Attendance Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendance Settings</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Expected Arrival Time</Text>
              {isEditing ? (
                <View style={styles.inputContainer}>
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
              ) : (
                <Text style={styles.fieldValue}>
                  {businessData.expectedArrivalTime || "Not set"}
                </Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Text style={styles.fieldLabel}>Buffer Time</Text>
                  <Text style={styles.fieldDescription}>
                    Allow employees to be marked on time within buffer period
                  </Text>
                </View>
                <Switch
                  value={
                    isEditing
                      ? editedData.bufferEnabled
                      : businessData.bufferEnabled
                  }
                  onValueChange={(value) =>
                    isEditing
                      ? updateField("bufferEnabled", value)
                      : updateField("bufferEnabled", businessData.bufferEnabled)
                  }
                  trackColor={{ false: "#E0E0E0", true: "#000000" }}
                  thumbColor="#FFFFFF"
                  disabled={!isEditing}
                />
              </View>
            </View>

            {(isEditing
              ? editedData.bufferEnabled
              : businessData.bufferEnabled) && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Buffer Minutes</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={editedData.bufferMinutes?.toString() || ""}
                    onChangeText={(text) =>
                      updateField("bufferMinutes", Number.parseInt(text) || 0)
                    }
                    placeholder="Enter minutes (e.g., 15)"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {businessData.bufferMinutes
                      ? `${businessData.bufferMinutes} minutes`
                      : "Not set"}
                  </Text>
                )}
                <Text style={styles.fieldDescription}>
                  Employees can be marked on time up to{" "}
                  {businessData.bufferMinutes || 0} minutes after expected
                  arrival
                </Text>
              </View>
            )}
          </View>

          {/* System Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Information</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Business ID</Text>
              <Text style={styles.fieldValue}>{businessData.businessId}</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Created Date</Text>
              <Text style={styles.fieldValue}>
                {dayjs(businessData.createdAt).toString().slice(0, 16)}
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Admin ID</Text>
              <Text style={styles.fieldValue}>{businessData.adminId}</Text>
            </View>
          </View>
        </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 20,
    backgroundColor: "#F8F8F8",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
    textAlign: "left",
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    minHeight: 50,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000000",
  },
  placeholderText: {
    color: "#999999",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  dropdownArrow: {
    fontSize: 16,
    color: "#666666",
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    maxHeight: 350,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#000000",
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
  fieldDescription: {
    fontSize: 12,
    color: "#666666",
    marginTop: 5,
    fontStyle: "italic",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    flex: 1,
    marginRight: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
});
