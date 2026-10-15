import api from "./api";

/**
 * Get current user's profile
 */
export const getProfile = async () => {
  try {
    console.log("[PROFILE] Loading profile...");
    const response = await api.get("/users/profile");
    console.log("[PROFILE] Profile loaded:", response.data);
    return response.data;
  } catch (error) {
    console.error("[PROFILE] Error loading profile:", error);
    throw error;
  }
};

/**
 * Update user profile with optional avatar
 * @param {Object} profileData - Profile fields to update
 * @param {File|null} avatarFile - Avatar file to upload
 */
export const updateProfile = async (profileData, avatarFile) => {
  try {
    console.log("[PROFILE] Updating profile...");
    console.log("[PROFILE] Profile data:", profileData);
    console.log("[PROFILE] Avatar file:", avatarFile ? avatarFile.name : "No file");

    const formData = new FormData();

    // Append text fields
    Object.keys(profileData).forEach((key) => {
      const value = profileData[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value);
        console.log(`[PROFILE] Appended field: ${key}=${value}`);
      }
    });

    // CRITICAL: Only append avatar if it's a File object
    if (avatarFile instanceof File) {
      formData.append("avatar", avatarFile);
      console.log(`[PROFILE] Appended avatar: ${avatarFile.name} (${avatarFile.size} bytes)`);
    }

    // IMPORTANT: Do NOT set Content-Type header - let Axios/browser handle it
    const response = await api.put("/users/profile", formData);
    
    console.log("[PROFILE] Profile updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("[PROFILE] Error updating profile:", error);
    throw error;
  }
};

/**
 * Legacy function - use updateProfile instead
 * @deprecated
 */
export const uploadAvatar = async (formData) => {
  console.warn("[PROFILE] uploadAvatar is deprecated, use updateProfile with avatarFile param");
  try {
    const response = await api.put("/users/profile", formData);
    return response.data;
  } catch (error) {
    console.error("[PROFILE] Error uploading avatar:", error);
    throw error;
  }
};