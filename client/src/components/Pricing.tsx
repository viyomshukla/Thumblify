import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // ✅ Import useAuth

// Buttons Components
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

// Plans data
const plansData = [
  {
    name: 'Starter',
    price: '₹299',
    credits: '50 credits',
    desc: 'Perfect for small projects and testing',
    features: [
      '50 AI credits per month',
      'Basic support',
      'Standard processing',
      'Email notifications'
    ],
    popular: false,
    amount: 299,
    creditsToAdd: 50
  },
  {
    name: 'Professional',
    price: '₹499',
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
    amount: 499,
    creditsToAdd: 75
  },
  {
    name: 'Enterprise',
    price: '₹899',
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
    amount: 899,
    creditsToAdd: 100
  }
];

export default function Pricing() {
  const refs = useRef([]);
  const [loading, setLoading] = useState(null);
  const { updateCredits } = useAuth(); // ✅ Get updateCredits from AuthContext

  // Backend URL - change this if your backend runs on different port
  const API_URL = 'http://localhost:5000';

  const handlePayment = async (plan, index) => {
    setLoading(index);

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      alert('Payment configuration error. Please add VITE_RAZORPAY_KEY_ID to .env');
      setLoading(null);
      return;
    }

    try {
      // Step 1: Create order on backend
      console.log('Creating order for:', plan.name);
      
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({
          amount: plan.amount,
          planName: plan.name,
          credits: plan.creditsToAdd,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success || !orderData.orderId) {
        throw new Error('Failed to create order');
      }

      console.log('Order created:', orderData.orderId);

      // Step 2: Open Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Thumbify',
        description: `${plan.name} Plan - ${plan.credits}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          console.log('Payment successful:', response);

          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await fetch(`${API_URL}/api/payment/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                credits: plan.creditsToAdd,
                planName: plan.name,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // ✅ Update credits in AuthContext immediately
              await updateCredits();
              
              alert(
                `🎉 Payment Successful!\n\n` +
                `${verifyData.newCredits} credits added!\n\n` +
                `Total credits: ${verifyData.credits}\n\n` +
                `Thank you for your purchase! Your credits are now available.`
              );
              
              // Optional: Scroll to top or navigate somewhere
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              alert('⚠️ Payment verification failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('⚠️ Payment verification failed. Please contact support.');
          } finally {
            setLoading(null);
          }
        },
        prefill: {
          name: 'User Name', // TODO: Get from your user state/context
          email: 'user@example.com', // TODO: Get from your user state/context
          contact: '9999999999',
        },
        notes: {
          plan: plan.name,
          credits: plan.creditsToAdd,
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: function () {
            console.log('Payment cancelled');
            setLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(`❌ Payment failed: ${response.error.description}\n\nPlease try again or contact support.`);
        setLoading(null);
      });

    } catch (error) {
      console.error('Payment error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-slate-950 to-indigo-950 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <Title
          title="Pricing"
          heading="Simple, transparent pricing"
          description="Flexible agency packages designed to fit startups, growing teams and established brands."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plansData.map((plan, i) => (
            <motion.div
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              initial={{ y: 150, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: 'spring',
                stiffness: 250,
                damping: 70,
                mass: 1,
                delay: 0.1 + i * 0.1
              }}
              onAnimationComplete={() => {
                const card = refs.current[i];
                if (card) {
                  card.classList.add('transition', 'duration-500', 'hover:scale-102');
                }
              }}
              className={`relative p-6 rounded-xl border backdrop-blur ${
                plan.popular
                  ? 'border-indigo-500/50 bg-indigo-900/30'
                  : 'border-white/8 bg-indigo-950/30'
              }`}
            >
              {plan.popular && (
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-md text-xs text-white">
                  Most popular
                </p>
              )}

              <div className="mb-6">
                <p className="text-white font-semibold text-lg">{plan.name}</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-400">/ {plan.credits}</span>
                </div>
                <p className="text-sm text-gray-300 mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <div>
                {plan.popular ? (
                  <PrimaryButton
                    className="w-full"
                    onClick={() => handlePayment(plan, i)}
                    disabled={loading !== null}
                  >
                    {loading === i ? 'Processing...' : 'Get started'}
                  </PrimaryButton>
                ) : (
                  <GhostButton
                    className="w-full justify-center"
                    onClick={() => handlePayment(plan, i)}
                    disabled={loading !== null}
                  >
                    {loading === i ? 'Processing...' : 'Get started'}
                  </GhostButton>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Test Mode Info */}
        {/* <div className="mt-12 max-w-2xl mx-auto bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
          <h3 className="text-yellow-400 font-semibold mb-3">🧪 Test Payment Details</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li><strong className="text-white">Card:</strong> 4111 1111 1111 1111</li>
            <li><strong className="text-white">CVV:</strong> Any 3 digits (e.g., 123)</li>
            <li><strong className="text-white">Expiry:</strong> Any future date (e.g., 12/28)</li>
            <li><strong className="text-white">UPI:</strong> success@razorpay</li>
          </ul>
        </div> */}
      </div>
    </section>
  );
}