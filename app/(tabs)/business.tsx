"use client";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessMenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  subItems?: BusinessMenuItem[];
}

export default function BusinessScreen() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.isAdmin !== true) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <View style={styles.accessDeniedContent}>
            <Text style={styles.accessDeniedIcon}>🔒</Text>
            <Text style={styles.accessDeniedTitle}>Admin Access Required</Text>
            <Text style={styles.accessDeniedMessage}>
              This section is only available for administrators. Please contact
              your admin if you need access to business management features.
            </Text>
            <View style={styles.accessDeniedInfo}>
              <Text style={styles.accessDeniedInfoText}>
                Current Role: {user?.isAdmin ? "Admin" : "User"}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const businessMenuItems: BusinessMenuItem[] = [
    {
      id: "users",
      title: "Users",
      subtitle: "Manage employees and user accounts",
      icon: "👥",
      route: "/business/users",
    },
    {
      id: "business-info",
      title: "Business Information",
      subtitle: "View and edit business profile",
      icon: "🏢",
      route: "/business/info",
    },
    {
      id: "overview",
      title: "Overview",
      subtitle: "Business dashboard and summary",
      icon: "📊",
      route: "/business/overview",
    },
    {
      id: "reports",
      title: "Reports",
      subtitle: "Attendance reports and analytics",
      icon: "📈",
      route: "/business/reports",
      subItems: [
        {
          id: "general-records",
          title: "General Attendance Records",
          subtitle: "View all attendance data",
          icon: "📋",
          route: "/business/reports/general",
        },
        {
          id: "user-reports",
          title: "User Reports",
          subtitle: "Individual employee reports",
          icon: "👤",
          route: "/business/reports/users",
        },
        {
          id: "best-performers",
          title: "Best Performers",
          subtitle: "Top performing employees",
          icon: "🏆",
          route: "/business/reports/best",
        },
        {
          id: "worst-performers",
          title: "Worst Performers",
          subtitle: "Employees needing attention",
          icon: "⚠️",
          route: "/business/reports/worst",
        },
      ],
    },
    {
      id: "analytics",
      title: "Analytics",
      subtitle: "Advanced business insights",
      icon: "📊",
      route: "/business/analytics",
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  const renderMenuItem = (item: BusinessMenuItem, isSubItem = false) => (
    <View
      key={item.id}
      style={[styles.menuItem, isSubItem && styles.subMenuItem]}
    >
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => handleMenuPress(item.route)}
      >
        <View style={styles.menuContent}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuText}>
              <Text
                style={[styles.menuTitle, isSubItem && styles.subMenuTitle]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.menuSubtitle,
                  isSubItem && styles.subMenuSubtitle,
                ]}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Render sub-items if they exist */}
      {item.subItems && (
        <View style={styles.subItemsContainer}>
          {item.subItems.map((subItem) => renderMenuItem(subItem, true))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Business Management</Text>
          <Text style={styles.subtitle}>Manage your business operations</Text>
          <Text style={styles.businessName}>
            {user?.business?.business_name || "Your Business"}
          </Text>
        </View>

        <View style={styles.menuContainer}>
          {businessMenuItems.map((item) => renderMenuItem(item))}
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
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#F8F8F8",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
    marginBottom: 10,
  },
  businessName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subMenuItem: {
    marginBottom: 8,
    marginLeft: 20,
    backgroundColor: "#F8F8F8",
    borderColor: "#D0D0D0",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  menuButton: {
    padding: 20,
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  subMenuTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  subMenuSubtitle: {
    fontSize: 13,
    color: "#777777",
  },
  menuArrow: {
    fontSize: 20,
    color: "#CCCCCC",
    fontWeight: "bold",
  },
  subItemsContainer: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8F8F8",
  },
  accessDeniedContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 350,
  },
  accessDeniedIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
    textAlign: "center",
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  accessDeniedInfo: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  accessDeniedInfoText: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
});
