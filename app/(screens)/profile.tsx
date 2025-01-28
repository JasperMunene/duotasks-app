import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../components/Text";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";

interface UploadResponse {
  url: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { accessToken, user, updateProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUrls, setImageUrl] = useState<string | null>(null);

  const uploadImage = async (uri: string): Promise<string> => {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "image.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("image", {
      uri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Remove Content-Type to let the browser set it properly
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload image");
    }

    const data: UploadResponse = await response.json();
    console.log("Image uploaded successfully:", data);
    setImageUrl(data.url);
    setUploadError(null);
    return data.url;
  };

  const updateProfiles = async (imageUrl: string) => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    if (!response.ok) {
      let message = "Failed to update profile";
      try {
        const error = await response.json();
        message = error.message || message;
      } catch (_) {}
      throw new Error(message);
    }

    // Prevent JSON parse error on empty response
    let data = {};
    try {
      data = await response.json();
    } catch (_) {}

    console.log("Profile update API response:", data);
    return data;
  };

  const pickImage = async () => {
    try {
      setUploadError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // get full quality then compress it yourself
      });

      if (!result.canceled) {
        setIsUploading(true);

        // Compress and resize before upload
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 512 } }], // reduce width
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );

        const imageUrl = await uploadImage(manipulatedImage.uri);

        // ⏱ Instantly update preview
        setImageUrl(imageUrl);
        updateProfile({ image: imageUrl }); // locally update profile pic fast

        const updatedProfile = await updateProfiles(imageUrl);

        if (updatedProfile?.image_url) {
          updateProfile({ image: updatedProfile.image_url });
        }

        console.log("Profile updated successfully:", updatedProfile);
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to update profile picture"
      );
      console.error("Error updating profile picture:", error);
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <Image
            source={{ uri: user?.image || "https://i.pravatar.cc/300" }}
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={[
              styles.editButton,
              isUploading && styles.editButtonDisabled,
            ]}
            onPress={pickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera-outline" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {uploadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{uploadError}</Text>
          </View>
        )}

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.name} bold>
            {user?.name || "User"}
          </Text>
          <Text style={styles.tagline} medium>
            {user?.title || "Task Doer"}
          </Text>
          <Text style={styles.bio}>
            {user?.bio ||
              "No bio provided yet. Add your bio to let others know about you."}
          </Text>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => router.push("/edit-profile")}
        >
          <Text style={styles.editProfileText} medium>
            Edit Profile
          </Text>
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>
          {user?.phone && (
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{user.phone}</Text>
            </View>
          )}
          {user?.location && (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: "#000",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: "center",
    marginTop: 20,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#2eac5f",
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonDisabled: {
    backgroundColor: "#ccc",
  },
  errorContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  userInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  name: {
    fontSize: 24,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2eac5f",
    marginHorizontal: 20,
    marginTop: 30,
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  editProfileText: {
    color: "#fff",
    fontSize: 16,
  },
  infoSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
  },
});
