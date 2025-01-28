// app/index.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import CustomTabButtons from "../components/CustomTabButtons";
import { Text } from "../components/Text";
import VerifyMpesaBottomSheet from "../components/VerifyMpesaBottomSheet";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";

interface UserProfile {
  name: string;
  email: string;
  image?: string;
  phone?: string;
  location?: string;
  rating?: number;
  tasksCompleted?: number;
  joinedDate?: string;
  walletBalance?: number;
  // Add other fields based on the API response
}

export default function Account() {
  const router = useRouter();
  const { accessToken, user, logout, updateProfile } = useAuth();
  const { walletData, loading: walletLoading, error: walletError, fetchWalletData } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMpesaVerificationVisible, setIsMpesaVerificationVisible] = useState(false);

  useEffect(() => {
    // fetchUserProfile();
  }, []);

  useEffect(() => {
    const hasNoMpesa = !walletData || 
                       (walletData.payment_method === 'unknown' || !/^\d+$/.test(walletData.account_number || ''));

    if (!walletLoading && !walletError && hasNoMpesa) {
      console.log('Account: Showing M-Pesa verification');
      setIsMpesaVerificationVisible(true);
    } else if (walletData && walletData.account_number && walletData.payment_method !== 'unknown' && /^\d+$/.test(walletData.account_number)) {
      console.log('Account: Hiding M-Pesa verification');
      setIsMpesaVerificationVisible(false);
    }
  }, [walletData, walletLoading, walletError]);

  const notificationCounts = {
    notifications: user?.notifications_count || 0, // now reflects unread notifications count
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const renderProfileContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      );
    }

    return (
      <View style={styles.profileInfo}>
        <Text style={styles.profileName} bold>
          {user?.name || user?.name || "User"}
        </Text>
        {/* {profile?.phone && (
          <View style={styles.profileDetail}>
            <Ionicons name="call-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.profileDetailText}>{profile.phone}</Text>
          </View>
        )} */}
        {/* {profile?.rating && (
          <View style={styles.profileDetail}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.profileDetailText}>{profile.rating.toFixed(1)}</Text>
          </View>
        )} */}
        <Text style={styles.profileAction}>Show profile</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.headerSection}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <Pressable
            style={styles.notificationContainer}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={28} color="#fff" />
            {notificationCounts.notifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCounts.notifications}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Wallet Section */}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => router.push("/(screens)/profile")}
        >
          <Image
            source={{
              uri: profile?.image || user?.image || "https://i.pravatar.cc/150",
            }}
            style={styles.profileImage}
          />
          {renderProfileContent()}
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        {/* wallet section */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletBalance} bold>
                KES {walletData?.balance || 0}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewWalletButton}
              onPress={() => router.push("/(screens)/wallet")}
            >
              <Text style={styles.viewWalletText} medium>
                View Wallet
              </Text>
              <Ionicons name="chevron-forward" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          {/* Tasks Section */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(screens)/activities")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="bar-chart-outline" size={24} />
            </View>
            <Text style={styles.menuText}>My Activity</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(screens)/edit-profile")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="person-outline" size={24} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(screens)/login-security")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="lock-closed-outline" size={24} />
            </View>
            <Text style={styles.menuText}>Login & Security</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="shield-outline" size={24} />
            </View>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="document-text-outline" size={24} />
            </View>
            <Text style={styles.menuText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle-outline" size={24} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ff4444" />
          <Text style={styles.logoutText} medium>
            Log Out
          </Text>
        </TouchableOpacity>

        <View style={styles.version}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={[styles.versionText, styles.madeWithLove]}>
            Made with ❤️ by Jasper and Vick
          </Text>
        </View>

        {/* Add extra padding at the bottom for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Custom Tab Buttons */}
      <CustomTabButtons />

      {isMpesaVerificationVisible && (
        <VerifyMpesaBottomSheet
          isVisible={isMpesaVerificationVisible}
          onClose={() => setIsMpesaVerificationVisible(false)}
          onVerificationSuccess={fetchWalletData}
          existingMpesaNumber={walletData?.account_number}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerSection: {
    backgroundColor: "#2eac5f",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  notificationContainer: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    right: 4,
    top: 4,
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#2eac5f",
    fontSize: 12,
    fontWeight: "bold",
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingVertical: 24,
    marginTop: -20,
    backgroundColor: "#2eac5f",
    paddingBottom: 0,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    marginBottom: 2,
    color: "#fff",
  },
  profileEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  profileAction: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  walletCard: {
    marginTop: 0,
    padding: 20,
    backgroundColor: "#2eac5f",
    marginBottom: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 22,
    color: "#fff",
  },
  viewWalletButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  viewWalletText: {
    color: "black",
    marginRight: 4,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 0,
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingLeft: 20,
    paddingRight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingHorizontal: 1,
    backgroundColor: "#fff",
    marginVertical: 0,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    margin: 20,
    marginTop: 32,
    borderRadius: 30,
    backgroundColor: "#fff0f0",
    gap: 8,
  },
  logoutText: {
    color: "#ff4444",
    fontSize: 15,
  },
  version: {
    padding: 16,
    alignItems: "center",
  },
  versionText: {
    color: "#999",
    fontSize: 13,
  },
  madeWithLove: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
  },
  bottomPadding: {
    height: 100, // Extra padding for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#ff4444",
    marginBottom: 20,
  },
  retryButton: {
    padding: 16,
    borderRadius: 30,
    backgroundColor: "#2eac5f",
  },
  retryText: {
    color: "#fff",
    fontSize: 15,
  },
  profileDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profileDetailText: {
    marginLeft: 4,
    color: "rgba(255, 255, 255, 0.8)",
  },
});
