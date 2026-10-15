import { useEffect, useState, useCallback } from "react";
import {
  User,
  Mail,
  MapPin,
  Code2,
  Trophy,
  Save,
  Edit2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  UserCircle,
  BadgeCheck,
  Link2,
  Unlink,
  Calendar,
  Shield,
  Lock,
  X,
} from "lucide-react";
import { connectCodeforces } from "../services/codeforcesService";
import { getProfile, updateProfile, getAvatarUrl } from "../services/userService";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

function Profile({
  userId,
  onProfileUpdate,
  onConnectCodeforces,
  onDisconnectCodeforces,
  readOnly = false,
  showStats = true,
  showSocialLinks = true,
  className = "",
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    avatar: "",
    codeforcesHandle: "",
    leetcodeUsername: "",
    bio: "",
    location: "",
    website: "",
    github: "",
    twitter: "",
    joinedAt: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cfStatus, setCfStatus] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("profile");

  const loadProfile = useCallback(async () => {
    try {
      const data = await getProfile(userId);
      const user = data.user || data;
      const avatarUrl = getAvatarUrl(user.avatar);

      setForm({
        name: user.name || "",
        email: user.email || "",
        avatar: avatarUrl,
        codeforcesHandle: user.codeforcesHandle || "",
        leetcodeUsername: user.leetcodeUsername || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        github: user.github || "",
        twitter: user.twitter || "",
        joinedAt: user.joinedAt || user.createdAt || null,
      });

      if (user.codeforcesHandle) {
        setCfStatus("connected");
        setCfData({
          handle: user.codeforcesHandle,
          rating: user.codeforcesRating,
          maxRating: user.codeforcesMaxRating,
          rank: user.codeforcesRank,
        });
      } else {
        setCfStatus("disconnected");
      }
    } catch (error) {
      console.error("[PROFILE] Profile load error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (form.name.trim().length < 2)
      newErrors.name = "Name must be at least 2 characters";
    else if (form.name.trim().length > 50)
      newErrors.name = "Name must be less than 50 characters";
    if (form.website && !form.website.match(/^https?:\/\/.+/))
      newErrors.website = "Please enter a valid URL";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors");
      return;
    }

    setSaving(true);
    setSuccessMessage("");

    try {
      const updateData = {
        name: form.name.trim(),
        codeforcesHandle: form.codeforcesHandle,
        leetcodeUsername: form.leetcodeUsername,
        bio: form.bio,
        location: form.location,
        website: form.website,
        github: form.github,
        twitter: form.twitter,
      };

      const response = await updateProfile(updateData, null);

      if (response.success && response.user) {
        const updatedUser = response.user;
        setForm((prev) => ({
          ...prev,
          name: updatedUser.name || prev.name,
          email: updatedUser.email || prev.email,
          avatar: getAvatarUrl(updatedUser.avatar) || prev.avatar,
          bio: updatedUser.bio || prev.bio,
          location: updatedUser.location || prev.location,
          website: updatedUser.website || prev.website,
          github: updatedUser.github || prev.github,
          twitter: updatedUser.twitter || prev.twitter,
        }));
      }

      setSuccessMessage("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      onProfileUpdate?.(form);
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectCodeforces = async () => {
    if (!form.codeforcesHandle) {
      toast.error("Please enter a Codeforces handle first");
      return;
    }
    try {
      setConnecting(true);
      setCfStatus("connecting");
      if (onConnectCodeforces) {
        await onConnectCodeforces(form.codeforcesHandle);
      } else {
        const response = await connectCodeforces(form.codeforcesHandle);
        toast.success(
          response.message || "Codeforces account connected successfully!"
        );
      }
      setCfStatus("connected");
      setCfData({ handle: form.codeforcesHandle });
      await loadProfile();
    } catch (error) {
      const message =
        error.response?.data?.message || "Connection failed. Please try again.";
      toast.error(message);
      setCfStatus("disconnected");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectCodeforces = async () => {
    if (
      !confirm("Are you sure you want to disconnect your Codeforces account?")
    )
      return;
    try {
      if (onDisconnectCodeforces) await onDisconnectCodeforces();
      setCfStatus("disconnected");
      setCfData(null);
      setForm((prev) => ({ ...prev, codeforcesHandle: "" }));
      toast.success("Codeforces account disconnected");
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile();
    setErrors({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className={`min-h-[60vh] flex flex-col items-center justify-center ${className}`}
      >
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
          Loading Profile...
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Please wait while we fetch your data
        </p>
      </div>
    );
  }

  const tabBtn = (tab, icon, label) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium transition-colors relative ${
        activeTab === tab
          ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 ${className}`}>
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="relative h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden">
                {form.avatar ? (
                  <img
                    src={form.avatar}
                    alt={form.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                    </span>
                  </div>
                )}
              </div>
              {cfStatus === "connected" && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white dark:border-slate-900">
                  <BadgeCheck className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                {form.name || "User"}
              </h1>
              <p className="text-white/90 text-sm drop-shadow flex items-center gap-2">
                <span>Competitive Programmer</span>
                {form.location && (
                  <>
                    <span className="text-white/50">•</span>
                    <span>{form.location}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 pb-6 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-200 dark:border-slate-800">
          {[
            { icon: Mail, color: "text-blue-500", label: "Email", value: form.email },
            {
              icon: Code2,
              color: "text-orange-500",
              label: "Codeforces",
              value: form.codeforcesHandle || "Not connected",
              check: cfStatus === "connected",
            },
            {
              icon: Trophy,
              color: "text-yellow-500",
              label: "LeetCode",
              value: form.leetcodeUsername || "Not connected",
            },
            {
              icon: Calendar,
              color: "text-purple-500",
              label: "Joined",
              value: formatDate(form.joinedAt),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {item.value}
                  </p>
                  {item.check && (
                    <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
            {successMessage}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
        {tabBtn("profile", <User className="w-4 h-4 inline mr-2" />, "Profile")}
        {tabBtn(
          "connections",
          <Link2 className="w-4 h-4 inline mr-2" />,
          "Connections"
        )}
        {tabBtn("security", <Shield className="w-4 h-4 inline mr-2" />, "Security")}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeTab === "profile"
                ? "Personal Information"
                : activeTab === "connections"
                ? "Platform Connections"
                : "Security Settings"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeTab === "profile"
                ? "Update your personal details and bio"
                : activeTab === "connections"
                ? "Connect your competitive programming accounts"
                : "Manage your account security"}
            </p>
          </div>
          {!readOnly && activeTab === "profile" && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={isEditing ? "Cancel editing" : "Edit profile"}
            >
              {isEditing ? (
                <X className="w-5 h-5 text-red-500" />
              ) : (
                <Edit2 className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              )}
            </button>
          )}
        </div>

        {activeTab === "profile" && (
          <>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <User className="w-4 h-4" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="Enter your full name"
                className={`h-12 ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : ""
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input
                value={form.email}
                readOnly
                disabled
                className="h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Email cannot be changed. Contact support for assistance.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <UserCircle className="w-4 h-4" />
                Bio
              </label>
              <textarea
                name="bio"
                value={form.bio || ""}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {form.bio?.length || 0}/500 characters
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <Input
                name="location"
                value={form.location || ""}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="City, Country"
                className="h-12"
              />
            </div>

            {showSocialLinks && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Social Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "website", label: "Website", placeholder: "https://yourwebsite.com" },
                    { name: "github", label: "GitHub", placeholder: "username" },
                    { name: "twitter", label: "Twitter", placeholder: "username" },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {field.label}
                      </label>
                      <Input
                        name={field.name}
                        value={form[field.name] || ""}
                        onChange={handleChange}
                        disabled={readOnly || !isEditing || saving}
                        placeholder={field.placeholder}
                        className="h-10"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "connections" && (
          <div className="space-y-6">
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10">
                    <Code2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Codeforces
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Competitive programming platform
                    </p>
                  </div>
                </div>
                {cfStatus === "connected" ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Not connected
                  </span>
                )}
              </div>

              {cfStatus === "connected" && cfData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Handle", value: cfData.handle || form.codeforcesHandle },
                    { label: "Rating", value: cfData.rating ?? "N/A" },
                    { label: "Max Rating", value: cfData.maxRating ?? "N/A" },
                    { label: "Rank", value: cfData.rank ?? "N/A" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3"
                    >
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  name="codeforcesHandle"
                  value={form.codeforcesHandle || ""}
                  onChange={handleChange}
                  disabled={readOnly || saving || connecting}
                  placeholder="Enter Codeforces handle"
                  className="h-10 flex-1 min-w-[200px]"
                />
                {cfStatus !== "connected" ? (
                  <Button
                    type="button"
                    onClick={handleConnectCodeforces}
                    disabled={connecting || !form.codeforcesHandle}
                    className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                        Connecting…
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleDisconnectCodeforces}
                    variant="outline"
                    className="h-10 px-4 text-red-500 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm"
                  >
                    <Unlink className="w-4 h-4 mr-1" /> Disconnect
                  </Button>
                )}
              </div>
            </div>

            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-500/10">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      LeetCode
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Algorithm practice platform
                    </p>
                  </div>
                </div>
                {form.leetcodeUsername ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Not connected
                  </span>
                )}
              </div>
              <Input
                name="leetcodeUsername"
                value={form.leetcodeUsername || ""}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="Enter LeetCode username"
                className="h-10"
              />
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Shield className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Account Security
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage your account credentials
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Registered Email
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {form.email}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Password Management
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      To change your password, use the &quot;Forgot
                      Password&quot; flow from the login page.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Member Since
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formatDate(form.joinedAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!readOnly && activeTab === "profile" && isEditing && (
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="submit"
              disabled={saving}
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="h-12"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>

      {showStats && cfData && cfStatus === "connected" && (
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-orange-500" />
            Codeforces Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Current Rating", value: cfData.rating ?? "—", color: "blue" },
              { label: "Max Rating", value: cfData.maxRating ?? "—", color: "amber" },
              { label: "Rank", value: cfData.rank ?? "—", color: "purple" },
              { label: "Max Rank", value: cfData.maxRank ?? "—", color: "emerald" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={`p-4 rounded-xl bg-${color}-50 dark:bg-${color}-500/10 border border-${color}-100 dark:border-${color}-500/20`}
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {label}
                </p>
                <p
                  className={`text-2xl font-bold mt-1 text-${color}-600 dark:text-${color}-400`}
                >
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <a
              href={`https://codeforces.com/profile/${
                cfData.handle || form.codeforcesHandle
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on Codeforces
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;