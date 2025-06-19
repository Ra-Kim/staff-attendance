"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "react-native-qrcode-svg";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/backend/firebase";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";

interface QRCodeData {
  id: string;
  code: string;
  businessId: string;
  timestamp: Date;
  expiryDate: Date;
  isActive: boolean;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [currentQRCode, setCurrentQRCode] = useState<QRCodeData | null>(null);
  const [userQRCode, setUserQRCode] = useState<string>("");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showExpiryDrawer, setShowExpiryDrawer] = useState(false);
  const [loading, setLoading] = useState(false);

  const qrCodeRef = useRef<any>(null);
  const userQrCodeRef = useRef<any>(null);

  const downloadQRCode = async () => {
    if (!qrCodeRef.current) {
      Alert.alert("Error", "QR code not ready for capture");
      return;
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Denied",
        "Media Library access is required to save QR code."
      );
      return;
    }

    try {
      // Add a small delay to ensure QR code is fully rendered
      // await new Promise((resolve) => setTimeout(resolve, 500));

      const uri = await captureRef(qrCodeRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        height: 600,
        width: 600,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("QR Codes", asset, false);

      Alert.alert("Success", "QR Code saved to your gallery!");
    } catch (error: any) {
      console.error("Error saving QR code:", error);
      Alert.alert("Error", "Failed to save QR code: " + String(error?.message));
    }
  };

  const downloadUserQRCode = async () => {
    if (!userQrCodeRef.current) {
      Alert.alert("Error", "QR code not ready for capture");
      return;
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Denied",
        "Media Library access is required to save QR code."
      );
      return;
    }

    try {
      // Add a small delay to ensure QR code is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const uri = await captureRef(userQrCodeRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        height: 600,
        width: 600,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("QR Codes", asset, false);

      Alert.alert("Success", "QR Code saved to your gallery!");
    } catch (error: any) {
      console.error("Error saving QR code:", error);
      Alert.alert("Error", "Failed to save QR code: " + error.message);
    }
  };

  useEffect(() => {
    // Initialize user's permanent QR code
    if (!user?.isAdmin && user?.uid) {
      setUserQRCode(`USER_${user.uid}`);
    }

    // Listen for current QR code if admin
    if (user?.isAdmin && user?.businessId) {
      const unsubscribe = onSnapshot(
        doc(db, "businesses", user.businessId, "qrCodes", "current"),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setCurrentQRCode({
              ...data,
              timestamp: data.timestamp.toDate(),
              expiryDate: data.expiryDate.toDate(),
            } as QRCodeData);
          }
        }
      );

      return () => unsubscribe();
    }
  }, [user]);

  // const requestPhotoPermission = async () => {
  //   if (Platform.OS === "android") {
  //     try {
  //       const granted = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  //         {
  //           title: "Photo Library Permission",
  //           message: "App needs access to save QR code to your photos",
  //           buttonNeutral: "Ask Me Later",
  //           buttonNegative: "Cancel",
  //           buttonPositive: "OK",
  //         }
  //       );
  //       return granted === PermissionsAndroid.RESULTS.GRANTED;
  //     } catch (err) {
  //       console.warn(err);
  //       return false;
  //     }
  //   }
  //   return true;
  // };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

  const handleTimeConfirm = (time: Date) => {
    setSelectedTime(time);
    hideTimePicker();
  };

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);

  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);

  const generateQRCode = async () => {
    console.log(user);
    if (!user?.isAdmin || !user?.businessId) return;

    setLoading(true);
    try {
      // Set expiry time - if no time selected, use 11:59 PM
      const expiryDate = new Date(selectedDate);
      if (selectedTime) {
        expiryDate.setHours(
          selectedTime.getHours(),
          selectedTime.getMinutes(),
          0,
          0
        );
      } else {
        expiryDate.setHours(23, 59, 0, 0);
      }

      const newQRCode: QRCodeData = {
        id: Math.random().toString(36).substr(2, 9),
        code: `ATTENDANCE_${Date.now()}`,
        businessId: user.businessId,
        timestamp: new Date(),
        expiryDate: expiryDate,
        isActive: true,
      };

      // Save to Firebase - this will override any existing QR code
      await setDoc(
        doc(db, "businesses", user.businessId, "qrCodes", "current"),
        {
          ...newQRCode,
          timestamp: newQRCode.timestamp,
          expiryDate: newQRCode.expiryDate,
        }
      );

      setCurrentQRCode(newQRCode);
      setShowExpiryDrawer(false);
      setSelectedTime(null);
      Alert.alert("Success", "New QR code generated and saved!");
    } catch (error) {
      console.error("Error generating QR code:", error);
      Alert.alert("Error", "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // This would typically open camera for QR scanning
    Alert.alert("Scan QR", "QR Scanner would open here");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatDateTime = (date: Date) => {
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  const isQRCodeExpired = (expiryDate: Date) => {
    return new Date() > expiryDate;
  };

  if (user?.isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Manage attendance QR codes</Text>
          </View>

          {/* Generate QR Code Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generate QR Code</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => setShowExpiryDrawer(true)}
              disabled={loading}
            >
              <Text style={styles.generateButtonText}>
                {loading ? "Generating..." : "Generate New QR Code"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Current QR Code */}
          {currentQRCode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current QR Code</Text>
              <View style={styles.qrContainer}>
                <View ref={qrCodeRef} collapsable={false}>
                  <QRCode
                    value={currentQRCode.code}
                    size={200}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrInfo}>
                  Generated: {formatTime(currentQRCode.timestamp)}
                </Text>
                <Text style={styles.qrInfo}>
                  Expires: {formatDateTime(currentQRCode.expiryDate)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    isQRCodeExpired(currentQRCode.expiryDate)
                      ? styles.expiredBadge
                      : styles.activeBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isQRCodeExpired(currentQRCode.expiryDate)
                        ? styles.expiredText
                        : styles.activeText,
                    ]}
                  >
                    {isQRCodeExpired(currentQRCode.expiryDate)
                      ? "Expired"
                      : "Active"}
                  </Text>
                </View>
              </View>

              {/* Download Button */}
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadQRCode()}
              >
                <Text style={styles.downloadButtonText}>
                  📥 Download QR Code
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scan QR Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scan QR Code</Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
              <Text style={styles.scanButtonText}>📱 Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Expiry Date Drawer Modal */}
        <Modal
          visible={showExpiryDrawer}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowExpiryDrawer(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.drawerContainer}>
              <Text style={styles.drawerTitle}>Set QR Code Expiry</Text>

              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={showDatePicker}
                >
                  <Text style={styles.dateTimeButtonText}>
                    Date: {formatDate(selectedDate)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={showTimePicker}
                >
                  <Text style={styles.dateTimeButtonText}>
                    Time:{" "}
                    {selectedTime
                      ? formatTime(selectedTime)
                      : "11:59 PM (default)"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.drawerButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowExpiryDrawer(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={generateQRCode}
                  disabled={loading}
                >
                  <Text style={styles.confirmButtonText}>Generate QR Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={hideDatePicker}
          minimumDate={new Date()}
        />

        {/* Time Picker */}
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
        />
      </SafeAreaView>
    );
  }

  // User View
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Your attendance dashboard</Text>
        </View>

        {/* User's Permanent QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your QR Code</Text>
          <Text style={styles.qrDescription}>
            Show this QR code to mark your attendance
          </Text>
          <View style={styles.qrContainer} ref={userQrCodeRef}>
            {userQRCode && (
              <QRCode
                value={userQRCode}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            )}
            <Text style={styles.qrInfo}>Your unique attendance code</Text>
            {/* Download Button for User QR */}
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={downloadUserQRCode}
            >
              <Text style={styles.downloadButtonText}>
                📥 Download My QR Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan Attendance</Text>
          <Text
            style={styles.qrDescription}
          >{`Scan the admin's QR code to mark your attendance`}</Text>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
            <Text style={styles.scanButtonText}>📱 Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
  },
  qrDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 15,
    textAlign: "center",
  },
  generateButton: {
    backgroundColor: "#000000",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  downloadButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  scanButton: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000000",
  },
  scanButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  qrContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  qrInfo: {
    marginTop: 10,
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  activeBadge: {
    backgroundColor: "#E6F7E6",
  },
  expiredBadge: {
    backgroundColor: "#FFE6E6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  activeText: {
    color: "#00AA00",
  },
  expiredText: {
    color: "#CC0000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 20,
  },
  dateTimeContainer: {
    marginBottom: 30,
  },
  dateTimeButton: {
    backgroundColor: "#F8F8F8",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
  },
  drawerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  cancelButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#000000",
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
