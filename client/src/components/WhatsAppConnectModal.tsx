import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Check, Loader2 } from 'lucide-react';
import { whatsappAPI } from '../utils/api'; // ✅ Import real API

interface WhatsAppConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppConnectModal({ isOpen, onClose }: WhatsAppConnectModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const response = await whatsappAPI.getStatus(); // ✅ Real API
      if (response.data.connected) {
        setIsConnected(true);
        setPhoneNumber(response.data.phoneNumber || '');
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const handleConnect = async () => {
    if (!phoneNumber || loading) return;
    setLoading(true);
    setError('');
    try {
      const fullNumber = `${countryCode}${phoneNumber}`;
      const response = await whatsappAPI.connect(fullNumber); // ✅ Real API
      
      if (response.data.success) {
        setSuccess(true);
        setIsConnected(true);
        setTimeout(() => onClose(), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await whatsappAPI.disconnect(); // ✅ Real API
      setIsConnected(false);
      setPhoneNumber('');
      setSuccess(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-2 border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>

              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-extrabold mb-2">
                    {isConnected ? 'WhatsApp Connected' : 'Connect WhatsApp'}
                  </h2>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm font-medium text-red-400">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <p className="text-sm font-medium text-green-400">
                      ✅ Connected! Check WhatsApp for welcome message
                    </p>
                  </div>
                )}

                {isConnected && !success ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-sm text-gray-400 mb-1">Connected Number</p>
                      <p className="text-white font-mono">{phoneNumber}</p>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      disabled={loading}
                      className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Disconnect'}
                    </button>
                  </div>
                ) : !success ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Phone Number (with country code)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+61">🇦🇺 +61</option>
                        </select>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
                          placeholder="9876543210"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 You'll receive a welcome message on WhatsApp
                      </p>
                    </div>

                    <button
                      onClick={handleConnect}
                      disabled={loading || phoneNumber.length < 10}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5" />
                          Connect WhatsApp
                        </>
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}