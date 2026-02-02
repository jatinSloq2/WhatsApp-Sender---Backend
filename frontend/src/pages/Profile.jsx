import { Award, Calendar, Check, CreditCard, Eye, EyeOff, Loader2, Lock, Mail, Shield, User as UserIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';

export default function Profile() {
  const { user, loading: userLoading, getProfile, updateProfile, updatePassword } = useUser();
  const { loading: authLoading } = useAuth();

  // Profile form state
  const [name, setName] = useState('');
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        await getProfile();
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, [getProfile]);

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  // ─── Handle Profile Update ────────────────────────────
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (!name.trim()) {
      setProfileMessage({ type: 'error', text: 'Name cannot be empty' });
      return;
    }

    setProfileUpdating(true);
    try {
      await updateProfile({ name: name.trim() });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setProfileMessage({ type: 'error', text: error.message });
    } finally {
      setProfileUpdating(false);
    }
  };

  // ─── Handle Password Update ───────────────────────────
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All password fields are required' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setPasswordUpdating(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });

      // Clear form and close modal after delay
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMessage({ type: '', text: '' });
        setShowPasswordModal(false);
      }, 2000);
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message });
    } finally {
      setPasswordUpdating(false);
    }
  };

  // Loading state
  if (authLoading || userLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <p className="text-gray-500">Unable to load profile</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-64px)] w-full bg-white ">
        {/* ── Hero Section ── */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          <div className="animate-fadeIn">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Account Settings
            </span>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tighter mb-4">
              Manage your<br />
              <span className="text-green-600">profile</span>
            </h1>

            <p className="text-lg text-gray-500 max-w-2xl mb-8 leading-relaxed">
              Update your account information, manage security settings, and view your subscription details.
            </p>
          </div>
        </section>

        {/* ── Account Information Section ── */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 hover:shadow-md hover:border-green-200 transition-all duration-200 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
                <UserIcon size={20} className="text-green-600" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
                <p className="text-sm text-gray-500">Your personal details and contact information</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Email - Read Only */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    Email Address
                  </label>
                  <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600">
                    {user.email}
                  </div>
                  <p className="text-xs text-gray-400">Your email cannot be changed</p>
                </div>

                {/* Member Since - Read Only */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    Member Since
                  </label>
                  <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Name - Editable */}
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserIcon size={16} className="text-gray-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Message */}
              {profileMessage.text && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${profileMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                  {profileMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
                  {profileMessage.text}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={profileUpdating || name === user.name}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors px-6 py-3 rounded-xl shadow-md shadow-green-200"
              >
                {profileUpdating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating Profile...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </form>
          </div>
        </section>

        {/* ── Account Details Grid ── */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Status Card */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-green-200 transition-all duration-200 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center mb-4">
                <Shield size={18} className="text-green-600" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Account Status</h3>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.isVerified
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>

            {/* Plan Card */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-green-200 transition-all duration-200 animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center mb-4">
                <Award size={18} className="text-blue-600" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Current Plan</h3>
              <p className="text-sm text-gray-600">
                {user.subscription?.planId?.name || 'No Plan'}
              </p>
            </div>

            {/* Credits Card */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-green-200 transition-all duration-200 animate-fadeIn" style={{ animationDelay: '300ms' }}>
              <div className="w-10 h-10 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center mb-4">
                <CreditCard size={18} className="text-purple-600" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Available Credits</h3>
              <p className="text-2xl font-bold text-gray-900">
                {user.credits?.balance || 0}
              </p>
            </div>
          </div>
        </section>

        {/* ── Security Section ── */}
        <section className="max-w-6xl mx-auto px-6 pb-28">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 hover:shadow-md hover:border-green-200 transition-all duration-200 animate-fadeIn" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center">
                <Lock size={20} className="text-purple-600" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                <p className="text-sm text-gray-500">Manage your password and account security</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Password</h3>
                <p className="text-xs text-gray-500">Last changed: Never or Unknown</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors px-4 py-2 hover:bg-green-50 rounded-lg"
              >
                Change Password →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Password Change Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200 sticky top-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lock size={20} className="text-purple-600" />
                  Change Password
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordMessage({ type: '', text: '' });
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-semibold text-gray-700">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Message */}
              {passwordMessage.text && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                  {passwordMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
                  {passwordMessage.text}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordMessage({ type: '', text: '' });
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors px-4 py-3 rounded-xl shadow-md shadow-purple-200"
                >
                  {passwordUpdating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}