"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { collection, doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/backend/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import dayjs from "dayjs";

interface FormDetails {
  businessName: string;
  address: string;
  businessType: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  businessName?: string;
  address?: string;
  businessType?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignUpScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [formDetails, setFormDetails] = useState<FormDetails>({
    businessName: "",
    address: "",
    businessType: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] =
    useState(false);

  const businessTypes = [
    "Restaurant",
    "Retail Store",
    "Service Provider",
    "Technology",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Other",
  ];

  // Update form field
  const updateFormField = (field: string, value: string) => {
    setFormDetails((prevState) => ({
      ...prevState,
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

    // Business name validation
    if (!formDetails.businessName.trim()) {
      newErrors.businessName = "Business name is required";
      valid = false;
    }

    // Address validation
    if (!formDetails.address.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    }

    // Business type validation
    if (!formDetails.businessType) {
      newErrors.businessType = "Business type is required";
      valid = false;
    }

    // Email validation
    if (!formDetails.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formDetails.email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    // Phone validation
    if (!formDetails.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
      valid = false;
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formDetails.phoneNumber)) {
      newErrors.phoneNumber = "Phone number is invalid";
      valid = false;
    }

    // Password validation
    if (!formDetails.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formDetails.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    }

    // Confirm password validation
    if (!formDetails.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      valid = false;
    } else if (formDetails.password !== formDetails.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const isValid = validateForm();
      if (!isValid) {
        setLoading(false);
        Alert.alert("Error", "Please fill all fields correctly");
        return;
      }

      // ✅ 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formDetails.email,
        formDetails.password
      );

      const uid = userCredential.user.uid;

      // ✅ 2. Create a new business doc
      const businessRef = doc(collection(db, "businesses"));
      const businessId = businessRef.id;

      await setDoc(businessRef, {
        businessId,
        business_name: formDetails.businessName,
        email: formDetails.email,
        phone_number: formDetails.phoneNumber,
        address: formDetails.address,
        business_type: formDetails.businessType,
        adminId: uid,
        createdAt: new Date(),
      });

      // ✅ 3. Create a user doc linked to the business
      await setDoc(doc(db, "businesses", businessId, "users", uid), {
        uid,
        email: formDetails.email,
        phone_number: formDetails.phoneNumber,
        isAdmin: true,
        createdAt: new Date(),
      });

      login({
        uid,
        email: formDetails.email,
        phone_number: formDetails.phoneNumber,
        isAdmin: true,
        createdAt: new Date(),
        business: {
          businessId,
          business_name: formDetails.businessName,
          email: formDetails.email,
          phone_number: formDetails.phoneNumber,
          address: formDetails.address,
          business_type: formDetails.businessType,
          adminId: uid,
          createdAt: String(dayjs().toDate()),
        },
        businessId,
      });
      Alert.alert("Success", "Account created successfully!");
    } catch (error: any) {
      Alert.alert("Registration failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Signup" }} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>TD</Text>
                </View>
                <Text style={styles.appName}>TheDot</Text>
              </View>
              <Text style={styles.headerTitle}>Create Business Account</Text>
              <Text style={styles.headerSubtitle}>
                Join our platform and grow your business
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* Business Information */}
              <Text style={styles.sectionTitle}>Business Information</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Business Name"
                  value={formDetails.businessName}
                  onChangeText={(text) => updateFormField("businessName", text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.businessName && (
                <Text style={styles.errorText}>{errors.businessName}</Text>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Business Address"
                  value={formDetails.address}
                  onChangeText={(text) => updateFormField("address", text)}
                  multiline
                  numberOfLines={2}
                />
              </View>
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}

              {/* Business Type Dropdown */}
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() =>
                  setShowBusinessTypeDropdown(!showBusinessTypeDropdown)
                }
              >
                <Text
                  style={[
                    styles.input,
                    !formDetails.businessType && styles.placeholderText,
                  ]}
                >
                  {formDetails.businessType || "Select Business Type"}
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
                        updateFormField("businessType", type);
                        setShowBusinessTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {errors.businessType && (
                <Text style={styles.errorText}>{errors.businessType}</Text>
              )}

              {/* Contact Information */}
              <Text style={styles.sectionTitle}>Contact Information</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formDetails.email}
                  onChangeText={(text) => updateFormField("email", text)}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={formDetails.phoneNumber}
                  onChangeText={(text) => updateFormField("phoneNumber", text)}
                />
              </View>
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}

              {/* Security */}
              <Text style={styles.sectionTitle}>Security</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry={secureTextEntry}
                  value={formDetails.password}
                  onChangeText={(text) => updateFormField("password", text)}
                />
                <TouchableOpacity
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeText}>
                    {secureTextEntry ? "👁️" : "🙈"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  secureTextEntry={secureConfirmTextEntry}
                  value={formDetails.confirmPassword}
                  onChangeText={(text) =>
                    updateFormField("confirmPassword", text)
                  }
                />
                <TouchableOpacity
                  onPress={() =>
                    setSecureConfirmTextEntry(!secureConfirmTextEntry)
                  }
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeText}>
                    {secureConfirmTextEntry ? "👁️" : "🙈"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              {/* Terms and Privacy Policy */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By registering, you agree to our{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Already have account link */}
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push("/landing")}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account?{" "}
                  <Text style={styles.loginLinkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#000000",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "SpaceMono",
  },
  appName: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 2,
    fontFamily: "SpaceMono",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
    marginTop: 10,
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
  eyeIcon: {
    padding: 5,
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 10,
  },
  termsContainer: {
    marginVertical: 20,
  },
  termsText: {
    color: "#666666",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: "#000000",
    fontWeight: "bold",
  },
  registerButton: {
    backgroundColor: "#000000",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#666666",
    fontSize: 16,
  },
  loginLinkTextBold: {
    fontWeight: "bold",
    color: "#000000",
  },
  placeholderText: {
    color: "#999999",
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
});
