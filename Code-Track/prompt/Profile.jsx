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
  RefreshCw,
  Calendar,
  Award,
  Star,
  GitBranch,
  Shield,
  Clock,
  Settings,
  Bell,
  LogOut,
  ArrowRight,
  X,
  Lock // Added missing import
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
  onLogout,
  readOnly = false,
  showStats = true,
  showSocialLinks = true,
  className = ""
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    avatar: "", // CRITICAL: Added avatar field
    codeforcesHandle: "",
    leetcodeUsername: "",
    bio: "",
    location: "",
    website: "",
    github: "",
    twitter: "",
    joinedAt: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cfStatus, setCfStatus] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('profile');

  const loadProfile = useCallback(async () => {
    try {
      console.log("[PROFILE] Loading profile...");
      const data = await getProfile(userId);
      console.log("[PROFILE] Profile data received:", data);
      
      const user = data.user || data;
      
      // CRITICAL FIX: Properly set avatar using the helper
      const avatarUrl = getAvatarUrl(user.avatar);
      console.log("[PROFILE] Avatar URL:", avatarUrl);
      
      setForm({
        name: user.name || "",
        email: user.email || "",
        avatar: avatarUrl, // CRITICAL: Set avatar
        codeforcesHandle: user.codeforcesHandle || "",
        leetcodeUsername: user.leetcodeUsername || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        github: user.github || "",
        twitter: user.twitter || "",
        joinedAt: user.joinedAt || user.createdAt || null
      });

      if (user.codeforcesHandle) {
        setCfStatus('connected');
        setCfData({ 
          handle: user.codeforcesHandle,
          rating: user.codeforcesRating,
          maxRating: user.codeforcesMaxRating,
          rank: user.codeforcesRank
        });
      } else {
        setCfStatus('disconnected');
      }

      if (user.leetcodeUsername) {
        setLeetcodeData({
          username: user.leetcodeUsername,
          totalSolved: user.leetcodeSolved
        });
      }

    } catch (error) {
      console.error('[PROFILE] Profile load error:', error);
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
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    if (form.website && !form.website.match(/^https?:\/\/.+/)) {
      newErrors.website = "Please enter a valid URL";
    }

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
        twitter: form.twitter
      };

      // Note: Avatar is handled separately through the settings page
      // This profile page only updates text fields
      const response = await updateProfile(updateData, null);
      
      console.log("[PROFILE] Update response:", response);
      
      // Update form with response data
      if (response.success && response.user) {
        const updatedUser = response.user;
        setForm(prev => ({
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
      console.error('[PROFILE] Update error:', error);
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
      setCfStatus('connecting');

      if (onConnectCodeforces) {
        await onConnectCodeforces(form.codeforcesHandle);
      } else {
        const response = await connectCodeforces(form.codeforcesHandle);
        toast.success(response.message || "Codeforces account connected successfully!");
      }
      
      setCfStatus('connected');
      setCfData({ handle: form.codeforcesHandle });
      await loadProfile();

    } catch (error) {
      const message = error.response?.data?.message || "Connection failed. Please try again.";
      toast.error(message);
      setCfStatus('disconnected');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectCodeforces = async () => {
    if (!confirm("Are you sure you want to disconnect your Codeforces account?")) {
      return;
    }

    try {
      if (onDisconnectCodeforces) {
        await onDisconnectCodeforces();
      }
      setCfStatus('disconnected');
      setCfData(null);
      setForm(prev => ({ ...prev, codeforcesHandle: "" }));
      toast.success("Codeforces account disconnected");
    } catch (error) {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center ${className}`}>
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-600">Loading Profile...</h2>
        <p className="text-sm text-slate-400 mt-2">Please wait while we fetch your data</p>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 ${className}`}>
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8">
        <div className="relative h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-2xl overflow-hidden">
                {form.avatar ? (
                  <img 
                    src={form.avatar} 
                    alt={form.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("[PROFILE] Avatar failed to load:", form.avatar);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
              {cfStatus === 'connected' && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
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

        {/* Quick Stats */}
        <div className="pt-20 px-8 pb-6 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Mail className="w-5 h-5 text-blue-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-700 truncate">{form.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Code2 className="w-5 h-5 text-orange-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Codeforces</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {form.codeforcesHandle || "Not connected"}
                </p>
                {cfStatus === 'connected' && (
                  <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">LeetCode</p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {form.leetcodeUsername || "Not connected"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Joined</p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {formatDate(form.joinedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'profile'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'connections'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Link2 className="w-4 h-4 inline mr-2" />
          Connections
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'security'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Security
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'profile' ? 'Personal Information' : 
               activeTab === 'connections' ? 'Platform Connections' :
               'Security Settings'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'profile' ? 'Update your personal details and bio' :
               activeTab === 'connections' ? 'Connect your competitive programming accounts' :
               'Manage your account security'}
            </p>
          </div>
          {!readOnly && activeTab === 'profile' && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title={isEditing ? "Cancel editing" : "Edit profile"}
            >
              {isEditing ? (
                <X className="w-5 h-5 text-red-400 hover:text-red-600" />
              ) : (
                <Edit2 className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              )}
            </button>
          )}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="Enter your full name"
                className={`h-12 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input
                value={form.email}
                readOnly
                disabled
                className="h-12 bg-slate-50 text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed. Contact support for assistance.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
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
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                {form.bio?.length || 0}/500 characters
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
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
                <h3 className="text-sm font-medium text-slate-700">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Website</label>
                    <Input
                      name="website"
                      value={form.website || ""}
                      onChange={handleChange}
                      disabled={readOnly || !isEditing || saving}
                      placeholder="https://yourwebsite.com"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">GitHub</label>
                    <Input
                      name="github"
                      value={form.github || ""}
                      onChange={handleChange}
                      disabled={readOnly || !isEditing || saving}
                      placeholder="username"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Twitter</label>
                    <Input
                      name="twitter"
                      value={form.twitter || ""}
                      onChange={handleChange}
                      disabled={readOnly || !isEditing || saving}
                      placeholder="username"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Connections Tab - Same as before */}
        {activeTab === 'connections' && (
          // ... keep existing connections tab code ...
          <div>Connections tab content</div>
        )}

        {/* Security Tab - Same as before */}
        {activeTab === 'security' && (
          // ... keep existing security tab code ...
          <div>Security tab content</div>
        )}

        {/* Submit Buttons */}
        {!readOnly && activeTab === 'profile' && isEditing && (
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
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

      {/* Stats Cards - Same as before */}
      {showStats && (
        // ... keep existing stats cards ...
        <div>Stats cards</div>
      )}
    </div>
  );
}

export default Profile;