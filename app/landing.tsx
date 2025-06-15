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
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { auth, db } from "@/backend/firebase";
import { router } from "expo-router";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { IUser } from "@/types";

export default function LandingScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
    setAuthError("");
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const uid = userCredential.user.uid;

        console.log(uid)

        // ✅ Search all users across all businesses
        const usersQuery = query(
          collectionGroup(db, "users"),
          where("uid", "==", uid)
        );

        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
          throw new Error("User document not found in any business.");
        }

        // ✅ Assuming user belongs to exactly one business
        const userDocSnap = querySnapshot.docs[0];
        const userData = userDocSnap.data() as IUser;
        console.log(userData);

        // ✅ Pass to context
        setLoading(false);
        login(userData);
      } catch (error) {
        console.log(error);
        let errorMessage =
          String(error) || "Login failed. Please check your credentials.";
        setAuthError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>TheDot</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          {/* Generic error message */}
          {authError && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#b21f1f" />
              <Text style={styles.authErrorText}>{authError}</Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#666"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => handleChange("password", text)}
            />
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>{`Don't have an account?`} </Text>
            <TouchableOpacity>
              <Text
                style={styles.signupLink}
                onPress={() => router.replace("/signup")}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000000",
    fontFamily: "SpaceMono",
  },
  subtitle: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 30,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  authErrorText: {
    color: "#b21f1f",
    marginLeft: 10,
    flex: 1,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: 5,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#000000",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#000000",
    width: "100%",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  signupText: {
    color: "#333333",
    fontSize: 14,
  },
  signupLink: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
});
