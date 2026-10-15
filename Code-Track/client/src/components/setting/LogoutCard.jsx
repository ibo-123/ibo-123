import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  AlertTriangle,
  Shield,
  XCircle,
  Clock,
  UserX,
  CheckCircle,
  Loader2,
  User,
  Settings,
  HelpCircle,
  ArrowRight,
  Fingerprint,
  Lock,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

function LogoutCard({
  user = {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Admin",
    lastActive: new Date(),
    device: "Chrome on Windows",
    location: "San Francisco, CA",
    ip: "192.168.1.1"
  },
  onLogout,
  onSwitchAccount,
  onSecurityClick,
  logoutOptions = {
    redirectTo: "/login",
    clearLocalStorage: true,
    clearSessionStorage: true,
    clearCookies: false
  },
  showSessionInfo = true,
  showQuickActions = true,
  showSecurityNotice = true,
  showDeviceInfo = true,
  title = "Account",
  subtitle = "Sign out of your account",
  buttonText = "Sign Out",
  dialogTitle = "Confirm Sign Out",
  dialogDescription = "Are you sure you want to sign out? You'll need to sign in again to access your account.",
  className = "",
  successMessage = "Logged out successfully",
  isLoading: externalIsLoading = false,
  isLoggingOut: externalIsLoggingOut = false
}) {
  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionTime, setSessionTime] = useState("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const loading = externalIsLoading || externalIsLoggingOut || isLoggingOut;

  // Update session time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSessionTime(now.toLocaleString());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Call custom logout if provided
      if (logoutOptions.customLogout) {
        await logoutOptions.customLogout();
      }

      // Call onLogout callback
      if (onLogout) {
        await onLogout();
      }

      // Clear storage based on options
      if (logoutOptions.clearLocalStorage) {
        localStorage.clear();
      }
      
      if (logoutOptions.clearSessionStorage) {
        sessionStorage.clear();
      }
      
      if (logoutOptions.clearCookies) {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, `=;expires=${new Date().toISOString()};path=/`);
        });
      }

      setIsLoggingOut(false);
      setShowDialog(false);

      // Show success message
      toast.success(successMessage, {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        duration: 3000,
      });

      // Redirect after logout
      const redirectPath = logoutOptions.redirectTo || "/login";
      setTimeout(() => {
        navigate(redirectPath);
      }, 1000);

    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  // Get device icon
  const getDeviceIcon = () => {
    if (!user?.device) return null;
    const device = user.device.toLowerCase();
    if (device.includes('mobile') || device.includes('phone')) {
      return '📱';
    } else if (device.includes('tablet')) {
      return '📱';
    } else if (device.includes('mac')) {
      return '🍎';
    } else if (device.includes('windows')) {
      return '🪟';
    } else {
      return '💻';
    }
  };

  return (
    <>
      {/* Account Card */}
      <div className={`p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {title}
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1 ml-12">
              {subtitle}
            </p>
          </div>

          {/* Session Status */}
          <div className="flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700">
              Active
            </span>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.email}
                </p>
                {user.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Session Info */}
        {showSessionInfo && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200/50">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">
                  You're currently signed in
                </p>

                <p className="text-xs text-slate-400">
                  Last active: {sessionTime}
                </p>

                {showDeviceInfo && user?.device && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <span>{getDeviceIcon()}</span>
                    <span>{user.device}</span>
                    {user.location && (
                      <>
                        <span className="text-slate-300">•</span>
                        <Globe className="w-3 h-3" />
                        <span>{user.location}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Security Notice */}
        {showSecurityNotice && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200/50">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />

            <p className="text-xs text-amber-700">
              You will be redirected to the login page after signing out.
            </p>
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="destructive"
          onClick={() => setShowDialog(true)}
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 gap-2 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing Out...
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              {buttonText}
            </>
          )}
        </Button>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onSwitchAccount}
              className="p-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <UserX className="w-3.5 h-3.5" />
              Switch Account
            </button>

            <button
              type="button"
              onClick={onSecurityClick}
              className="p-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              Security
            </button>

            <button
              type="button"
              className="p-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>

            <button
              type="button"
              className="p-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Help
            </button>
          </div>
        )}

        {/* Advanced Options Toggle */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <span>{showAdvancedOptions ? '▼' : '▶'}</span>
            Advanced Options
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Fingerprint className="w-4 h-4 text-slate-500" />
              <p className="text-xs font-medium text-slate-700">Advanced Settings</p>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                Clear local storage
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                Clear session storage
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Clear cookies
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={setShowDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {dialogTitle}
            </DialogTitle>

            <DialogDescription className="text-slate-600">
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-red-100 rounded-full">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>

                <div>
                  <p className="text-sm font-medium text-red-700">
                    Security Notice
                  </p>

                  <p className="text-xs text-red-600 mt-1">
                    Your session will be terminated immediately.
                    Make sure you've saved all your work.
                  </p>

                  {user && (
                    <div className="mt-2 p-2 bg-white/50 rounded-lg">
                      <p className="text-xs text-red-600">
                        <span className="font-medium">Account:</span> {user.email}
                      </p>
                      <p className="text-xs text-red-600">
                        <span className="font-medium">Last active:</span> {sessionTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional confirmation */}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5" />
              <span>This action cannot be undone</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {/* Cancel */}
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>

            {/* Confirm */}
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Confirm Sign Out
                </>
              )}
            </Button>
          </DialogFooter>

          {/* Dialog Footer Note */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <ArrowRight className="w-3 h-3 text-slate-300" />
            <span className="text-[10px] text-slate-400">
              You'll be redirected to the login page
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default LogoutCard;