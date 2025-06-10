// components/QRScanner.tsx
import React, { useEffect,  useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { CameraView,  useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

interface AttendanceEntry {
  sessionId: string;
  staffId: string;
  timestamp: string;
}

export const QRScanner: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);

  useEffect(() => {
    if (!permission?.granted && !permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (scanned) return;

    const { data } = scanningResult;
    setScanned(true);

    const staffId = getAuth().currentUser?.uid;
    const timestamp = new Date().toISOString();
    const sessionId = data;

    if (!staffId) {
      Alert.alert('Error', 'User not authenticated');
      setScanned(false);
      return;
    }

    const newEntry: AttendanceEntry = { sessionId, staffId, timestamp };

    try {
      const stored = await AsyncStorage.getItem('attendance');
      const entries: AttendanceEntry[] = stored ? JSON.parse(stored) : [];
      entries.push(newEntry);
      await AsyncStorage.setItem('attendance', JSON.stringify(entries));

      Alert.alert('Scan Successful', `Signed in to session: ${sessionId}`);
    } catch (error) {
      console.error('Error saving locally', error);
      Alert.alert('Storage Error', 'Could not save scan locally');
    }
  };

  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      {scanned && (
        <View style={styles.buttonContainer}>
          <Button title="Scan Again" onPress={() => setScanned(false)} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
});