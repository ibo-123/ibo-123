import { useState, useEffect } from "react";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Calendar,
  Shield,
  Check,
  Settings2,
  Volume2,
  VolumeX,
  BellOff,
  BellRing,
  Loader2,
  AlertCircle,
  Clock,
  Globe,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { toast } from "sonner";

// Default notification groups
const defaultGroups = [
  {
    title: "Communication",
    icon: Mail,
    items: [
      { key: "email", label: "Email Notifications", description: "Receive updates via email" },
      { key: "push", label: "Push Notifications", description: "Get real-time alerts" },
      { key: "sms", label: "SMS Alerts", description: "Critical updates via text" },
    ]
  },
  {
    title: "Preferences",
    icon: Settings2,
    items: [
      { key: "marketing", label: "Marketing Emails", description: "News and promotions" },
      { key: "security", label: "Security Alerts", description: "Login and security updates" },
      { key: "updates", label: "Product Updates", description: "New features and improvements" },
    ]
  },
  {
    title: "Reminders",
    icon: Calendar,
    items: [
      { key: "reminders", label: "Reminders", description: "Task and event reminders" },
      { key: "sound", label: "Sound Alerts", description: "Play sound for notifications" },
    ]
  }
];

function NotificationCard({
  initialPreferences = {
    email: true,
    push: true,
    sms: false,
    marketing: false,
    security: true,
    updates: true,
    reminders: true,
    sound: true,
  },
  onSave,
  onToggle,
  onTestNotification,
  notificationGroups = defaultGroups,
  showStats = true,
  showActions = true,
  showToast = true,
  title = "Notifications",
  subtitle = "Control how you receive updates",
  className = "",
  successMessage = "Notification preferences updated",
  isLoading: externalIsLoading = false,
  isSaving: externalIsSaving = false
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loading = externalIsLoading || isLoading;
  const saving = externalIsSaving || isLoading;

  // Get all notification keys
  const allKeys = Object.keys(preferences);
  
  // Count active and inactive
  const activeCount = Object.values(preferences).filter(Boolean).length;
  const inactiveCount = allKeys.length - activeCount;

  // Get filtered items based on tab and search
  const getFilteredItems = () => {
    let items = [];
    
    notificationGroups.forEach(group => {
      group.items.forEach(item => {
        if (preferences[item.key] !== undefined) {
          items.push({ group, item });
        }
      });
    });

    // Filter by tab
    if (activeTab === 'active') {
      items = items.filter(({ item }) => preferences[item.key]);
    } else if (activeTab === 'inactive') {
      items = items.filter(({ item }) => !preferences[item.key]);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(({ item, group }) => 
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        group.title.toLowerCase().includes(query)
      );
    }

    return items;
  };

  const handleToggle = (key) => {
    const newValue = !preferences[key];
    const newPreferences = { ...preferences, [key]: newValue };
    
    setPreferences(newPreferences);
    setIsConfigured(true);
    
    onToggle?.(key, newValue);
    
    // Clear configured state after 3 seconds
    setTimeout(() => setIsConfigured(false), 3000);
  };

  const handleSave = async () => {
    if (onSave) {
      setIsLoading(true);
      try {
        await onSave(preferences);
        if (showToast) {
          toast.success(successMessage);
        }
      } catch (error) {
        toast.error("Failed to save preferences");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEnableAll = () => {
    const allTrue = allKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setPreferences(allTrue);
    setIsConfigured(true);
    setTimeout(() => setIsConfigured(false), 3000);
  };

  const handleDisableAll = () => {
    const allFalse = allKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {});
    setPreferences(allFalse);
    setIsConfigured(true);
    setTimeout(() => setIsConfigured(false), 3000);
  };

  const handleTestNotification = async () => {
    if (onTestNotification) {
      try {
        await onTestNotification();
        toast.success("Test notification sent!");
      } catch (error) {
        toast.error("Failed to send test notification");
      }
    } else {
      toast.info("Test notification would be sent here");
    }
  };

  const handleReset = () => {
    setPreferences(initialPreferences);
    setIsConfigured(true);
    setTimeout(() => setIsConfigured(false), 3000);
  };

  // Group items by category
  const filteredItems = getFilteredItems();

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">
              {title}
            </h3>
          </div>
          <p className="text-sm text-slate-500 ml-12">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCount > allKeys.length / 2
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {activeCount} active
          </div>
          {saving && (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        />
        <BellRing className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Stats */}
      {showStats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
            <p className="text-xs text-slate-500">Active</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-slate-600">{inactiveCount}</p>
            <p className="text-xs text-slate-500">Inactive</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">{allKeys.length}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({allKeys.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            activeTab === 'active'
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab('inactive')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            activeTab === 'inactive'
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {/* Notification Groups */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No notifications found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters</p>
          </div>
        ) : (
          notificationGroups.map((group, idx) => {
            const groupItems = filteredItems.filter(({ group: g }) => g.title === group.title);
            if (groupItems.length === 0) return null;

            const Icon = group.icon;
            const groupActiveCount = groupItems.filter(({ item }) => preferences[item.key]).length;

            return (
              <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{group.title}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {groupActiveCount}/{groupItems.length} active
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {groupItems.map(({ item }) => (
                    <div 
                      key={item.key} 
                      className={`flex items-center justify-between p-3 hover:bg-slate-50 transition-colors ${
                        preferences[item.key] ? 'bg-green-50/30' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-700">
                            {item.label}
                          </p>
                          {item.icon && (
                            <span className="text-slate-400">{item.icon}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>
                      <Switch
                        checked={preferences[item.key] || false}
                        onCheckedChange={() => handleToggle(item.key)}
                        disabled={loading}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-teal-500 ml-2 flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Configured Toast */}
      {isConfigured && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600 font-medium">
            Notification preferences updated
          </p>
        </div>
      )}

      {/* Advanced Options */}
      <div className="mt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
        >
          <span>{showAdvanced ? '▼' : '▶'}</span>
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleEnableAll}
                className="p-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                Enable All Notifications
              </button>
              <button
                onClick={handleDisableAll}
                className="p-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Disable All Notifications
              </button>
              <button
                onClick={handleReset}
                className="p-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors col-span-2"
              >
                Reset to Default Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3 flex-wrap">
          {onSave && (
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white gap-2"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableAll}
            disabled={loading}
            className="gap-1"
          >
            <BellRing className="w-3.5 h-3.5" />
            Enable All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDisableAll}
            disabled={loading}
            className="gap-1"
          >
            <BellOff className="w-3.5 h-3.5" />
            Disable All
          </Button>

          <Button
            size="sm"
            onClick={handleTestNotification}
            disabled={loading}
            className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Test Notification
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
        <Clock className="w-3 h-3" />
        <span>Last updated: {new Date().toLocaleString()}</span>
        <span className="text-slate-300">•</span>
        <Globe className="w-3 h-3" />
        <span>All preferences are saved locally</span>
      </div>
    </div>
  );
}

export default NotificationCard;