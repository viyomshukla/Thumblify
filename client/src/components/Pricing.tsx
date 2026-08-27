import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../utils/api';


const PrimaryButton = ({ children, className, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const GhostButton = ({ children, className, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 border border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);


const Title = ({ title, heading, description }) => (
  <div className="text-center mb-12">
    <p className="text-indigo-400 text-sm font-medium mb-2">{title}</p>
    <h2 className="text-4xl font-bold text-white mb-4">{heading}</h2>
    <p className="text-gray-400 max-w-2xl mx-auto">{description}</p>
  </div>
);


const plansData = [
  {
    name: 'Starter',
    price: '₹1',
    credits: '50 credits',
    desc: 'Perfect for small projects and testing',
    features: [
      '50 AI credits per month',
      'Basic support',
      'Standard processing',
      'Email notifications'
    ],
    popular: false,
    amount: 1,
    creditsToAdd: 50
  },
  {
    name: 'Professional',
    price: '₹498',
    credits: '75 credits',
    desc: 'Great for growing teams',
    features: [
      '75 AI credits per month',
      'Priority support',
      'Fast processing',
      'Advanced analytics',
      'API access'
    ],
    popular: true,
    amount: 1845,
    creditsToAdd: 75
  },
  {
    name: 'Enterprise',
    price: '₹1000',
    credits: '100 credits',
    desc: 'For large-scale operations',
    features: [
      '100 AI credits per month',
      '24/7 dedicated support',
      'Fastest processing',
      'Custom integrations',
      'Team collaboration',
      'White-label options'
    ],
    popular: false,
    amount: 1300,
    creditsToAdd: 100
  }
];

export default function Pricing() {
  const refs = useRef([]);
  const [loading, setLoading] = useState<number | null>(null);

  // ✅ Success Dialog State
  const [dialog, setDialog] = useState({
    open: false,
    newCredits: 0,
    credits: 0,
  });

  const { updateCredits } = useAuth();
  const API_URL = API_BASE;


  const handlePayment = async (plan, index) => {
    setLoading(index);

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      alert('Payment configuration error.');
      setLoading(null);
      return;
    }

    try {
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: plan.amount,
          planName: plan.name,
          credits: plan.creditsToAdd,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) throw new Error('Order failed');

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Thumbify',
        description: `${plan.name} Plan`,
        order_id: orderData.orderId,

        handler: async (response) => {
          try {
            const verifyResponse = await fetch(
              `${API_URL}/api/payment/verify-payment`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  credits: plan.creditsToAdd,
                  planName: plan.name,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              await updateCredits();

              // ✅ OPEN SUCCESS DIALOG
              setDialog({
                open: true,
                newCredits: verifyData.newCredits,
                credits: verifyData.credits,
              });

              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          } finally {
            setLoading(null);
          }
        },

        theme: { color: '#4F46E5' },

        modal: {
          ondismiss: () => setLoading(null),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
      setLoading(null);
    }
  };


  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-indigo-950 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">

        <Title
          title="Pricing"
          heading="Simple, transparent pricing"
          description="Flexible agency packages designed to fit startups and teams."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plansData.map((plan, i) => (
            <motion.div
              key={i}
              ref={(el) => (refs.current[i] = el)}
              initial={{ y: 150, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl border border-white/10 bg-indigo-950/30"
            >
              <p className="text-white font-semibold text-lg">{plan.name}</p>

              <div className="flex items-end gap-3 mb-4">
                <span className="text-3xl font-extrabold text-white">
                  {plan.price}
                </span>
                <span className="text-gray-400">/{plan.credits}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-indigo-400" />
                    {feat}
                  </li>
                ))}
              </ul>

              <PrimaryButton
                className="w-full"
                onClick={() => handlePayment(plan, i)}
                disabled={loading !== null}
              >
                {loading === i ? 'Processing...' : 'Get started'}
              </PrimaryButton>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ✅ SUCCESS DIALOG */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-indigo-500/40 rounded-xl p-8 w-[90%] max-w-md text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              🎉 Payment Successful!
            </h2>

            <p className="text-gray-300">
              <span className="text-indigo-400 font-semibold">
                {dialog.newCredits} credits added!
              </span>
              <br /><br />
              Total credits:{" "}
              <span className="text-white font-semibold">
                {dialog.credits}
              </span>
              <br /><br />
              Thank you for your purchase!
            </p>

            <button
              onClick={() => setDialog({ ...dialog, open: false })}
              className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              OK
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}