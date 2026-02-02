import { BarChart, Check, Code, CreditCard, Loader2, Shield, Sparkles, TrendingUp, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Feature icons mapping
const featureIcons = {
  analyticsAccess: BarChart,
  prioritySupport: Shield,
  customTemplates: Sparkles,
  apiAccess: Code,
};

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [subscribing, setSubscribing] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API}/api/plans`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setPlans(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        setMessage({ type: 'error', text: 'Failed to load plans' });
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Filter plans by billing cycle
  const filteredPlans = plans.filter(plan => plan.billingCycle === billingCycle);

  // Sort plans by price
  const sortedPlans = [...filteredPlans].sort((a, b) => a.price - b.price);

  // Check if user is on this plan
  const isCurrentPlan = (planId) => {
    return user?.subscription?.planId?._id === planId || user?.subscription?.planId === planId;
  };

  // Handle subscription
  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubscribing(plan._id);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API}/api/plans/subscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan._id,
          billingCycle: plan.billingCycle,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Successfully subscribed to ${plan.name}! Redirecting...`
        });

        // Reload page after 2 seconds to update user data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error?.message || 'Subscription failed');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubscribing(null);
    }
  };

  // Get plan badge color
  const getPlanColor = (planName) => {
    const colors = {
      FREE: 'gray',
      STARTER: 'blue',
      PRO: 'purple',
      ENTERPRISE: 'green',
    };
    return colors[planName] || 'gray';
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="text-center animate-fadeIn">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-6">
            <Sparkles size={12} className="text-green-600" />
            Choose Your Plan
          </span>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tighter mb-4">
            Scale your campaigns<br />
            <span className="text-green-600">with confidence</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Start free and upgrade as you grow. All plans include our core features with transparent pricing and no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${billingCycle === 'MONTHLY'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all relative ${billingCycle === 'YEARLY'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Message Banner */}
      {message.text && (
        <section className="max-w-6xl mx-auto px-6 pb-6">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-medium ${message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
            <span>{message.text}</span>
          </div>
        </section>
      )}

      {/* Plans Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedPlans.map((plan, index) => {
            const color = getPlanColor(plan.name);
            const isPopular = plan.name === 'PRO';
            const isCurrent = isCurrentPlan(plan._id);

            return (
              <div
                key={plan._id}
                className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${isPopular
                    ? 'border-green-500 shadow-lg scale-105'
                    : isCurrent
                      ? 'border-blue-400'
                      : 'border-gray-200 hover:border-green-300'
                  } animate-fadeIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                      <TrendingUp size={14} />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      <Check size={12} />
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-500 text-sm">
                        /{billingCycle === 'MONTHLY' ? 'month' : 'year'}
                      </span>
                    </div>
                  </div>

                  {/* Credits Badge */}
                  <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap size={16} className="text-yellow-500" />
                      <span className="font-semibold text-gray-900">
                        {plan.creditsIncluded?.toLocaleString() || 'Unlimited'} credits
                      </span>
                    </div>
                    {billingCycle === 'YEARLY' && plan.creditsIncluded && (
                      <p className="text-xs text-gray-500 mt-1">
                        ~{Math.round(plan.creditsIncluded / 12).toLocaleString()} credits/month
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {/* Campaigns */}
                    <div className="flex items-start gap-2 text-sm">
                      <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>{plan.maxCampaignsPerMonth?.toLocaleString() || 'Unlimited'}</strong> campaigns/month
                      </span>
                    </div>

                    {/* Recipients */}
                    <div className="flex items-start gap-2 text-sm">
                      <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>{plan.maxRecipientsPerCampaign?.toLocaleString() || 'Unlimited'}</strong> recipients/campaign
                      </span>
                    </div>

                    {/* Feature flags */}
                    {Object.entries(plan.features).map(([key, value]) => {
                      if (!value) return null;
                      const Icon = featureIcons[key];
                      const labels = {
                        analyticsAccess: 'Advanced Analytics',
                        prioritySupport: 'Priority Support',
                        customTemplates: 'Custom Templates',
                        apiAccess: 'API Access',
                      };

                      return (
                        <div key={key} className="flex items-start gap-2 text-sm">
                          {Icon && <Icon size={16} className="text-green-600 mt-0.5 flex-shrink-0" />}
                          <span className="text-gray-700">{labels[key]}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribing === plan._id || isCurrent}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPopular
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                  >
                    {subscribing === plan._id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      <>
                        <CreditCard size={16} />
                        {plan.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* What You Get Section */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What happens when you upgrade?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Understanding your subscription and how it works
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Immediate Access */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Instant Credit Refill
              </h3>
              <p className="text-sm text-gray-600">
                Your credits are added immediately to your account balance. Start sending campaigns right away.
              </p>
            </div>

            {/* Auto Renewal */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Auto-Renewal Protection
              </h3>
              <p className="text-sm text-gray-600">
                Your plan automatically renews each billing period. Credits refill, limits reset. Cancel anytime.
              </p>
            </div>

            {/* Support */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Premium Features Unlocked
              </h3>
              <p className="text-sm text-gray-600">
                Access advanced analytics, priority support, and custom templates based on your plan level.
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 bg-white rounded-xl border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard size={18} className="text-green-600" />
              Payment & Billing Details
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Secure payment processing with industry-standard encryption</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Automatic billing on your renewal date - cancel anytime before renewal</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Unused credits roll over if you upgrade, but expire at plan end if you cancel</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Yearly plans save 20% and include 12 months of credits upfront</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Need more credits? Purchase additional credits anytime at flexible rates</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Can I switch plans at any time?",
              a: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features and credits. When downgrading, changes take effect at your next billing cycle."
            },
            {
              q: "What happens to my credits when I upgrade?",
              a: "Your existing credits are preserved! When you upgrade, your new plan's credits are added to your current balance. This means you never lose credits when improving your plan."
            },
            {
              q: "Do unused credits roll over?",
              a: "Credits from your active subscription remain available until your plan expires. If you cancel your subscription, you can continue using credits until your current period ends."
            },
            {
              q: "Can I cancel my subscription?",
              a: "Absolutely. Cancel anytime with no penalties. Your plan remains active until the end of your current billing period, and you can continue using all features and credits during that time."
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor. All transactions are encrypted and PCI-compliant."
            }
          ].map((faq, index) => (
            <details
              key={index}
              className="group bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all"
            >
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>{faq.q}</span>
                <span className="text-green-600 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}