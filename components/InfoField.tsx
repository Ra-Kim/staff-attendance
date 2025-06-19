import { IUserBody } from "@/types";
import React from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";

const InfoField = React.memo(
  ({
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
    field: keyof IUserBody;
    multiline?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad";
    isEditing: boolean;
    editedData: IUserBody;
    updateField: (field: string, text: string) => void;
  }) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isEditing && field !== "email" ? (
          <TextInput
            style={[styles.fieldInput, multiline && styles.multilineInput]}
            value={editedData[field as keyof IUserBody]?.toString() || ""}
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
  }
);

const styles = StyleSheet.create({
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
});

InfoField.displayName = "InfoField";

export default InfoField;