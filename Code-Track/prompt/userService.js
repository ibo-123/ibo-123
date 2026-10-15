import api from "./api";

/**
 * Get current user's profile
 */
export const getProfile = async () => {
  try {
    console.log("[USER SERVICE] Fetching profile...");
    const response = await api.get("/users/profile");
    console.log("[USER SERVICE] Profile fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("[USER SERVICE] Error fetching profile:", error);
    throw error;
  }
};

/**
 * Update user profile with optional avatar
 * @param {Object} profileData - Profile fields to update
 * @param {File|null} avatarFile - Optional avatar file to upload
 */
export const updateProfile = async (profileData, avatarFile = null) => {
  try {
    console.log("[USER SERVICE] Updating profile...");
    console.log("[USER SERVICE] Profile data:", profileData);
    console.log("[USER SERVICE] Avatar file:", avatarFile ? avatarFile.name : "No file");

    // If there's an avatar file, use FormData
    if (avatarFile instanceof File) {
      const formData = new FormData();
      
      // Append all text fields
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });
      
      // Append avatar file
      formData.append("avatar", avatarFile);
      
      console.log("[USER SERVICE] Sending FormData with avatar");
      
      // IMPORTANT: Do NOT set Content-Type - let Axios/browser handle it
      const response = await api.put("/users/profile", formData);
      console.log("[USER SERVICE] Profile updated:", response.data);
      return response.data;
    }
    
    // No avatar - send as JSON
    console.log("[USER SERVICE] Sending JSON data");
    const response = await api.put("/users/profile", profileData);
    console.log("[USER SERVICE] Profile updated:", response.data);
    return response.data;
  } catch (error) {
    console.error("[USER SERVICE] Error updating profile:", error);
    throw error;
  }
};

/**
 * Change user password
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put("/users/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error("[USER SERVICE] Error changing password:", error);
    throw error;
  }
};

/**
 * Helper function to get full avatar URL
 * @param {string} path - Avatar path from backend
 * @returns {string} Full URL
 */
export const getAvatarUrl = (path) => {
  if (!path) return "";
  
  // If it's already a full URL or data URI, return as is
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  // Get the server URL from environment
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5000";
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};