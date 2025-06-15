"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from "react-native"
import { useAuth } from "@/contexts/AuthContext"
import QRCode from "react-native-qrcode-svg"

interface QRCodeData {
  id: string
  code: string
  timestamp: Date
  isActive: boolean
}

export default function HomeScreen() {
  const { user } = useAuth()
  const [currentQRCode, setCurrentQRCode] = useState<QRCodeData | null>(null)
  const [pastQRCodes, setPastQRCodes] = useState<QRCodeData[]>([])
  const [userQRCode, setUserQRCode] = useState<string>("")

  useEffect(() => {
    // Initialize user's permanent QR code
    if (!user?.isAdmin) {
      setUserQRCode(`USER_${user?.uid}_${Date.now()}`)
    }
  }, [user])

  const generateQRCode = () => {
    if (!user?.isAdmin) return

    const newQRCode: QRCodeData = {
      id: Math.random().toString(36).substr(2, 9),
      code: `ATTENDANCE_${Date.now()}`,
      timestamp: new Date(),
      isActive: true,
    }

    // Deactivate current QR code and add to past codes
    if (currentQRCode) {
      const deactivatedCode = { ...currentQRCode, isActive: false }
      setPastQRCodes((prev) => [deactivatedCode, ...prev.slice(0, 2)])
    }

    setCurrentQRCode(newQRCode)
    Alert.alert("Success", "New QR code generated!")
  }

  const handleScanQR = () => {
    // This would typically open camera for QR scanning
    Alert.alert("Scan QR", "QR Scanner would open here")
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString()
  }

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
            <TouchableOpacity style={styles.generateButton} onPress={generateQRCode}>
              <Text style={styles.generateButtonText}>Generate New QR Code</Text>
            </TouchableOpacity>
          </View>

          {/* Current QR Code */}
          {currentQRCode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current QR Code</Text>
              <View style={styles.qrContainer}>
                <QRCode value={currentQRCode.code} size={200} color="#000000" backgroundColor="#FFFFFF" />
                <Text style={styles.qrInfo}>Generated: {formatTime(currentQRCode.timestamp)}</Text>
                <Text style={styles.qrCode}>Code: {currentQRCode.id}</Text>
              </View>
            </View>
          )}

          {/* Scan QR Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scan QR Code</Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
              <Text style={styles.scanButtonText}>📱 Scan QR Code</Text>
            </TouchableOpacity>
          </View>

          {/* Past QR Codes */}
          {pastQRCodes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent QR Codes</Text>
              {pastQRCodes.map((qr, index) => (
                <View key={qr.id} style={styles.pastQRItem}>
                  <View style={styles.pastQRInfo}>
                    <Text style={styles.pastQRCode}>Code: {qr.id}</Text>
                    <Text style={styles.pastQRTime}>
                      {formatDate(qr.timestamp)} at {formatTime(qr.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Expired</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
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
          <Text style={styles.qrDescription}>Show this QR code to mark your attendance</Text>
          <View style={styles.qrContainer}>
            <QRCode value={userQRCode} size={200} color="#000000" backgroundColor="#FFFFFF" />
            <Text style={styles.qrInfo}>Your unique attendance code</Text>
          </View>
        </View>

        {/* Scan QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan Attendance</Text>
          <Text style={styles.qrDescription}>{`Scan the admin's QR code to mark your attendance`}</Text>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
            <Text style={styles.scanButtonText}>📱 Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
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
    marginTop: 15,
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  qrCode: {
    marginTop: 5,
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
  },
  pastQRItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  pastQRInfo: {
    flex: 1,
  },
  pastQRCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
  },
  pastQRTime: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#FFE6E6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    color: "#CC0000",
    fontWeight: "bold",
  },
})
