import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { Input } from "../ui/input";

const DEFAULT_USER_DATA = {
  name: "",
  email: "",
  phone: "",
  location: "",
  avatar: "",
  joined: "",
  bio: "",
};

const normalizeUserData = (data) => ({
  ...DEFAULT_USER_DATA,
  ...(data || {}),
});

function AccountCard({
  userData: initialUserData = DEFAULT_USER_DATA,
  isEditing = false,
  onEdit,
  onCancel,
  onSave,
  onAvatarChange,
  isLoading: externalIsLoading = false,
  className = "",
  editableFields = ["name", "email", "phone", "location", "bio"],
  showJoined = true,
  showBio = true,
  avatarColor = "from-blue-400 to-purple-400",
  gradientClass = "from-blue-500 to-purple-500",
  validationRules = {},
  successMessage = "Account updated successfully!",
  errorMessage = "Failed to update account. Please try again.",
  cancelButtonText = "Cancel",
  saveButtonText = "Save Changes",
  editButtonText = "Edit",
}) {
  // State management
  const [formData, setFormData] = useState(() => normalizeUserData(initialUserData));
  const [displayData, setDisplayData] = useState(() => normalizeUserData(initialUserData));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const loading = externalIsLoading || isLoading;

  // Update data when props change
  useEffect(() => {
    console.log("[AccountCard] Props updated - isEditing:", isEditing);
    const safeData = normalizeUserData(initialUserData);
    setDisplayData(safeData);
    
    // Only reset form when NOT editing
    if (!isEditing) {
      console.log("[AccountCard] Resetting form data");
      setFormData(safeData);
      setAvatarPreview(null);
      setSelectedFile(null);
    }
  }, [initialUserData, isEditing]);

  const getFieldLabel = (field) => {
    const labels = {
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      location: "Location",
      joined: "Joined",
      bio: "Bio",
    };
    return labels[field] || field;
  };

  const validateField = (field, value) => {
    const rules = validationRules[field];
    if (!rules) return "";
    const safeValue = String(value ?? "");

    if (rules.required && !safeValue.trim()) {
      return `${getFieldLabel(field)} is required`;
    }
    if (field === "email" && rules.pattern && safeValue && !rules.pattern.test(safeValue)) {
      return "Please enter a valid email address";
    }
    if (field === "phone" && rules.pattern && safeValue && !rules.pattern.test(safeValue)) {
      return "Please enter a valid phone number";
    }
    if (field === "name") {
      if (rules.minLength && safeValue.length < rules.minLength) {
        return `Name must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && safeValue.length > rules.maxLength) {
        return `Name must be less than ${rules.maxLength} characters`;
      }
    }
    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    let valid = true;
    editableFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        valid = false;
      }
    });
    setErrors(newErrors);
    return valid;
  };

  const handleEdit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("[AccountCard] Edit clicked");
    
    const safeData = normalizeUserData(initialUserData);
    setFormData({ ...safeData });
    setErrors({});
    setTouched({});
    setSaveError("");
    setIsSaved(false);
    setAvatarPreview(null);
    setSelectedFile(null);
    
    if (onEdit) {
      onEdit();
    }
  };

  const handleCancel = () => {
    console.log("[AccountCard] Cancel clicked");
    const safeData = normalizeUserData(initialUserData);
    setFormData({ ...safeData });
    setErrors({});
    setTouched({});
    setSaveError("");
    setAvatarPreview(null);
    setSelectedFile(null);
    if (onCancel) onCancel();
  };

  const handleSave = async () => {
    console.log("[AccountCard] Save clicked");
    
    if (!validateForm()) {
      console.log("[AccountCard] Validation failed");
      return;
    }
    
    if (typeof onSave !== "function") {
      setSaveError("Unable to save changes. Please try again.");
      return;
    }
    
    try {
      setIsLoading(true);
      setSaveError("");
      setIsSaved(false);
      
      console.log("[AccountCard] Saving data:", formData);
      
      // IMPORTANT: Send both form data AND the selected file
      await onSave(formData, selectedFile);
      
      setDisplayData({ ...formData });
      setAvatarPreview(null);
      setSelectedFile(null);
      setIsSaved(true);
      
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("[AccountCard] Save error:", error);
      setSaveError(error?.response?.data?.message || error?.message || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => {
      const updated = { ...prev };
      if (error) updated[name] = error;
      else delete updated[name];
      return updated;
    });
    setSaveError("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => {
      const updated = { ...prev };
      if (error) updated[name] = error;
      else delete updated[name];
      return updated;
    });
  };

  const handleAvatarClick = () => {
    if (!loading) fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith("image/")) {
      setSaveError("Please select a valid image file.");
      e.target.value = "";
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }
    
    console.log("[AccountCard] Avatar selected:", file.name, file.size, "bytes");
    setSaveError("");
    
    // CRITICAL FIX: Store the File object locally
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Notify parent about avatar selection
    if (typeof onAvatarChange === "function") {
      try {
        await onAvatarChange(file);
        console.log("[AccountCard] Avatar change notification sent to parent");
      } catch (error) {
        console.error("[AccountCard] Avatar change notification failed:", error);
        setAvatarPreview(null);
        setSelectedFile(null);
        setSaveError(error?.message || "Failed to process avatar.");
      }
    }
  };

  const getFieldIcon = (field) => {
    const iconClass = "w-5 h-5 mt-0.5 flex-shrink-0";
    switch (field) {
      case "name": return <User className={`${iconClass} text-blue-500`} />;
      case "email": return <Mail className={`${iconClass} text-purple-500`} />;
      case "phone": return <Phone className={`${iconClass} text-green-500`} />;
      case "location": return <MapPin className={`${iconClass} text-red-500`} />;
      case "joined": return <Calendar className={`${iconClass} text-slate-400`} />;
      default: return <User className={`${iconClass} text-slate-400`} />;
    }
  };

  const displayFields = ["name", "email", "phone", "location"];
  if (showJoined && displayData.joined) {
    displayFields.push("joined");
  }
  if (showBio && editableFields.includes("bio")) {
    displayFields.push("bio");
  }

  // Priority: local preview > server avatar > initial fallback
  const avatarSource = avatarPreview || displayData.avatar || "";

  console.log("[AccountCard] Render - isEditing:", isEditing);
  console.log("[AccountCard] Avatar source:", avatarSource ? "present" : "empty");
  console.log("[AccountCard] Selected file:", selectedFile ? selectedFile.name : "none");

  return (
    <div 
      className={`bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden ${className}`}
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Header */}
      <div className={`relative h-24 bg-gradient-to-r ${gradientClass}`}>
        <div className="absolute -bottom-12 left-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
              {avatarSource ? (
                <img 
                  src={avatarSource} 
                  alt={displayData.name || "User avatar"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${avatarColor} flex items-center justify-center`}>
                  <span className="text-3xl font-bold text-white">
                    {(displayData.name || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={loading}
                  className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full border-2 border-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-14 px-6 pb-6">
        {/* Title */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Account Information</h3>
            <p className="text-sm text-slate-500">
              {isEditing ? "Edit your personal details" : "Manage your personal details"}
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors"
              style={{ 
                cursor: 'pointer', 
                position: 'relative', 
                zIndex: 10,
                background: 'white',
                pointerEvents: 'auto'
              }}
            >
              <Edit2 className="w-4 h-4" />
              {editButtonText}
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {isSaved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-600 font-medium">{successMessage}</p>
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600 font-medium">{saveError}</p>
          </div>
        )}

        {/* Fields */}
        <div className="space-y-4">
          {displayFields.map((field) => {
            // 'joined' is read-only
            const isJoined = field === "joined";
            const editable = editableFields.includes(field) && isEditing && !isJoined;
            const value = editable ? formData[field] ?? "" : displayData[field] ?? "";
            const hasError = Boolean(errors[field]) && Boolean(touched[field]);

            return (
              <div key={field} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50">
                {getFieldIcon(field)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {getFieldLabel(field)}
                    {editable && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {editable ? (
                    <>
                      <Input
                        type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                        name={field}
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        className={`mt-1 ${hasError ? "border-red-300" : ""}`}
                        placeholder={`Enter your ${getFieldLabel(field).toLowerCase()}`}
                      />
                      {hasError && (
                        <div className="mt-1 flex items-center gap-1 text-red-600 text-xs">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{errors[field]}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 mt-1 break-words">
                      {value || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
              {cancelButtonText}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-gradient-to-r ${gradientClass} hover:opacity-90 disabled:opacity-70 transition-opacity`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saveButtonText}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountCard;