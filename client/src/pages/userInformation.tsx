import React, { useEffect, useState } from 'react';
import { authAPI } from '../utils/api';
import { 
  User, 
  Mail, 
  Crown, 
  Coins, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Shield,
  Award,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const UserProfile = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await authAPI.verify();
        setUserData(response.data.user); 
      } catch (error) {
        console.log("User not logged in or session expired");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-b from-slate-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Not logged in state
  if (!userData) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-b from-slate-950 to-indigo-950 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Please Log In</h2>
          <p className="text-gray-400">You need to be logged in to view your profile.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  // Get plan details
  const getPlanDetails = (plan: string) => {
    const plans = {
      free: { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: User },
      starter: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Sparkles },
      professional: { color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Award },
      enterprise: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Crown }
    };
    return plans[plan?.toLowerCase()] || plans.free;
  };

  const planDetails = getPlanDetails(userData.plan);
  const PlanIcon = planDetails.icon;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-b from-slate-950 to-indigo-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Profile
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your account and track your usage
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-8"
          >
            {/* Profile Header */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {userData.name}!
                </h2>
                <p className="text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {userData.email}
                </p>
              </div>
            </div>

            <div className="h-px bg-white/10"></div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Plan */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Crown className="w-4 h-4" />
                  Current Plan
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 ${planDetails.bg} border border-white/10 rounded-xl`}>
                  <PlanIcon className={`w-6 h-6 ${planDetails.color}`} />
                  <span className={`text-xl font-bold ${planDetails.color} capitalize`}>
                    {userData.plan}
                  </span>
                </div>
              </div>

              {/* Credits */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Coins className="w-4 h-4" />
                  Available Credits
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="text-xl font-bold text-yellow-400">
                    {userData.credits}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => window.location.href = '/generate'}
                  className="flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition group"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Generate Thumbnail
                </button>
                <button 
                  onClick={() => window.location.href = '/#pricing'}
                  className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition group"
                >
                  <TrendingUp className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                  Upgrade Plan
                </button>
              </div>
            </div>
          </motion.div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Account Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6"
            >
              <h3 className="text-lg font-semibold text-white">Account Stats</h3>
              
              <div className="space-y-4">
                {/* Member Since */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Member Since</span>
                  </div>
                  <span className="text-white font-medium">
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Credits Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Credits</h3>
                  <p className="text-sm text-gray-400">Fuel for your creativity</p>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  {userData.credits}
                </div>
                <p className="text-sm text-gray-400">
                  {userData.credits < 50 
                    ? "Running low! Consider upgrading." 
                    : "You're all set for creating!"}
                </p>
              </div>

              {userData.credits < 50 && (
                <button 
                  onClick={() => window.location.href = '/#pricing'}
                  className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition"
                >
                  Get More Credits
                </button>
              )}
            </motion.div>

            {/* Plan Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                Plan Benefits
              </h3>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5"></span>
                  AI-powered thumbnail generation
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5"></span>
                  Multiple aspect ratios
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5"></span>
                  Custom color schemes
                </li>
                {userData.plan !== 'free' && (
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></span>
                    Priority support
                  </li>
                )}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;