import { useEffect, useState } from "react";
import {
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
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    avatar: "",
    joined: "",
    bio: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      setProfileError("");
      const response = await getProfile();
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
      setAvatarFile(null);
    } catch (error) {
      setProfileError(
        error.response?.data?.message ||
          "Failed to load profile. Please refresh the page."
      );
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleAccountEdit = () => {
    setIsEditingAccount(true);
    setActiveSection("account");
    setAvatarFile(null);
  };

  const handleAccountCancel = () => {
    setIsEditingAccount(false);
    setAvatarFile(null);
    setActiveSection(null);
  };

  const handleAccountSave = async (updatedData, avatarFileParam) => {
    const fileToUpload = avatarFileParam || avatarFile;
    const response = await updateProfile(updatedData, fileToUpload);
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
    setAvatarFile(null);
    setIsEditingAccount(false);
    setActiveSection(null);
    return response;
  };

  const handleAvatarChange = async (file) => {
    setAvatarFile(file);
    return true;
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Failed to Load Profile
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {profileError}
          </p>
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Manage your account and application preferences
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Secure
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  v2.0.1
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="group relative">
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
          <div className="group relative">
            <AppearanceCard />
          </div>
          <div className="group relative">
            <NotificationCard />
          </div>
          <div className="group relative">
            <LogoutCard />
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: "mobile",
              icon: Smartphone,
              color: "blue",
              title: "Mobile App",
              desc: "Download the app",
              iconBg: "bg-blue-50 dark:bg-blue-500/10",
              iconColor: "text-blue-600 dark:text-blue-400",
              hover: "hover:border-blue-200 dark:hover:border-blue-500/40",
            },
            {
              id: "help",
              icon: HelpCircle,
              color: "purple",
              title: "Help & Support",
              desc: "Get assistance",
              iconBg: "bg-purple-50 dark:bg-purple-500/10",
              iconColor: "text-purple-600 dark:text-purple-400",
              hover: "hover:border-purple-200 dark:hover:border-purple-500/40",
            },
            {
              id: "security",
              icon: Shield,
              color: "green",
              title: "Privacy & Security",
              desc: "Manage your data",
              iconBg: "bg-green-50 dark:bg-green-500/10",
              iconColor: "text-green-600 dark:text-green-400",
              hover: "hover:border-green-200 dark:hover:border-green-500/40",
            },
          ].map(({ id, icon: Icon, title, desc, iconBg, iconColor, hover }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 ${hover} hover:shadow-md transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © 2026 Your App. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Settings"].map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;