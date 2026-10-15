import { useEffect, useState } from "react";
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Shield,
  Smartphone,
} from "lucide-react";

import AccountCard from "../components/setting/AccountCard";
import AppearanceCard from "../components/setting/AppearanceCard";
import NotificationCard from "../components/setting/NotificationCard";
import LogoutCard from "../components/setting/LogoutCard";
import { getProfile, updateProfile } from "../services/profileService";

function Settings() {
  const [activeSection, setActiveSection] = useState(null);
  
  // Account editing state
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  
  // CRITICAL FIX: Store avatar file separately
  const [avatarFile, setAvatarFile] = useState(null);
  
  // Profile loading state
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  
  // User data state
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    avatar: "",
    joined: "",
    bio: "",
  });

  // Load profile when component mounts
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      setProfileError("");
      console.log("[Settings] Loading profile...");
      
      const response = await getProfile();
      console.log("[Settings] Profile loaded:", response);
      
      // Handle different response structures
      const user = response.user || response;
      
      setUserData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        avatar: user.avatar || "",
        joined: user.createdAt || user.joined || "",
        bio: user.bio || "",
      });
      
      // Clear any pending avatar changes
      setAvatarFile(null);
      
    } catch (error) {
      console.error("[Settings] Failed to load profile:", error);
      setProfileError(error.response?.data?.message || "Failed to load profile. Please refresh the page.");
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        // Auth context will handle this via interceptor
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  /*
   * --------------------------------------------------
   * ACCOUNT EDIT
   * --------------------------------------------------
   */

  const handleAccountEdit = () => {
    console.log("[Settings] Account edit clicked");
    setIsEditingAccount(true);
    setActiveSection("account");
    setAvatarFile(null); // Reset any pending avatar
  };

  const handleAccountCancel = () => {
    console.log("[Settings] Account edit cancelled");
    setIsEditingAccount(false);
    setAvatarFile(null);
    setActiveSection(null);
  };

  /*
   * --------------------------------------------------
   * ACCOUNT SAVE
   * --------------------------------------------------
   */

  const handleAccountSave = async (updatedData, avatarFileParam) => {
    try {
      console.log("[Settings] Saving profile...");
      console.log("[Settings] Updated data:", updatedData);
      console.log("[Settings] Avatar file:", avatarFileParam ? avatarFileParam.name : "No file");
      
      // CRITICAL FIX: Use the avatar file passed from AccountCard
      // This ensures we're using the file that was selected in the component
      const fileToUpload = avatarFileParam || avatarFile;
      
      const response = await updateProfile(updatedData, fileToUpload);
      
      console.log("[Settings] Profile update response:", response);
      
      // Update user data with response
      const updatedUser = response.user || response;
      setUserData({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        location: updatedUser.location || "",
        avatar: updatedUser.avatar || "",
        joined: updatedUser.createdAt || updatedUser.joined || "",
        bio: updatedUser.bio || "",
      });
      
      // Clear avatar state
      setAvatarFile(null);
      setIsEditingAccount(false);
      setActiveSection(null);
      
      return response;
    } catch (error) {
      console.error("[Settings] Profile update failed:", error);
      throw error;
    }
  };

  /*
   * --------------------------------------------------
   * AVATAR HANDLING
   * --------------------------------------------------
   */

  const handleAvatarChange = async (file) => {
    try {
      console.log("[Settings] Avatar selected:", file.name);
      
      // CRITICAL FIX: Store the actual File object
      setAvatarFile(file);
      
      // The preview is handled by AccountCard
      return true;
    } catch (error) {
      console.error("[Settings] Avatar change failed:", error);
      throw error;
    }
  };

  /*
   * --------------------------------------------------
   * RENDER
   * --------------------------------------------------
   */

  console.log("[Settings] Rendering - isEditingAccount:", isEditingAccount);
  console.log("[Settings] Avatar file:", avatarFile ? avatarFile.name : "none");

  // Show loading state
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Profile</h2>
          <p className="text-slate-600 mb-4">{profileError}</p>
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-slate-500 mt-2">
                Manage your account and application preferences
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-700">Secure</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">v2.0.1</span>
              </div>
            </div>
          </div>
        </div>

        {/* SETTINGS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACCOUNT */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <AccountCard
              userData={userData}
              isEditing={isEditingAccount}
              onEdit={handleAccountEdit}
              onCancel={handleAccountCancel}
              onSave={handleAccountSave}
              onAvatarChange={handleAvatarChange}
              editableFields={["name", "email", "phone", "location", "bio"]}
              showJoined={true}
              showBio={true}
            />
          </div>

          {/* APPEARANCE */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <AppearanceCard />
          </div>

          {/* NOTIFICATIONS */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <NotificationCard />
          </div>

          {/* LOGOUT */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <LogoutCard />
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveSection("mobile")}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">Mobile App</p>
                <p className="text-xs text-slate-400">Download the app</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("help")}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">Help & Support</p>
                <p className="text-xs text-slate-400">Get assistance</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("security")}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-green-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">Privacy & Security</p>
                <p className="text-xs text-slate-400">Manage your data</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* FOOTER */}
        <div className="mt-8 pt-6 border-t border-slate-200/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">© 2026 Your App. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button type="button" className="text-xs text-slate-400 hover:text-slate-600">
                Privacy Policy
              </button>
              <button type="button" className="text-xs text-slate-400 hover:text-slate-600">
                Terms of Service
              </button>
              <button type="button" className="text-xs text-slate-400 hover:text-slate-600">
                Cookie Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;