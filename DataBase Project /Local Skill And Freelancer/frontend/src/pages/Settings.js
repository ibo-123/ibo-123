import React, { useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    jobAlerts: true
  });
  const [theme, setTheme] = useState('light');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    try {
      await api.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      alert('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('Failed to change password');
    }
  };

  const handleNotificationChange = (e) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    // Apply theme
    document.documentElement.classList.toggle('dark', e.target.value === 'dark');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-8">
        {/* Profile Update */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Profile</h2>
          <p>Update your profile information on the <a href="/profile" className="text-blue-500">Profile page</a>.</p>
        </div>

        {/* Password Change */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Change Password</button>
          </form>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={notifications.emailNotifications}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              Email Notifications
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="jobAlerts"
                checked={notifications.jobAlerts}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              Job Alerts
            </label>
          </div>
        </div>

        {/* Theme */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Theme</h2>
          <select value={theme} onChange={handleThemeChange} className="p-2 border rounded">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;
