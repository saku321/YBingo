import { useEffect, useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from '../authProvider';
import '../styles/premium.css'; 

export default function Premium() {
  const { user, isLoggedIn, refetchAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Create order
  const createOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/paypal/createOrder", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to create order");
      const data = await res.json();
      setLoading(false);
      return data.id;
    } catch (err) {
      setError("Failed to start payment");
      setLoading(false);
    }
  };

  // Capture after approval
  const onApprove = async (data: any) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/paypal/captureOrder", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: data.orderID }),
      });
      const result = await res.json();
      setLoading(false);

      if (result.success) {
        setSuccess(true);
        await refetchAuth(); // refresh user state → isPremium updates
      } else {
        setError(result.error || "Payment not completed");
      }
    } catch (err) {
      setError("Payment failed");
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="premium-page">
        <div className="premium-card">
          <h1>Please Log In</h1>
          <p>To access or purchase Premium, you need to be logged in.</p>
          <a href="/login" className="premiumBtn primary">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page">
      <div className="premium-card">
        <h1 id="premiumTitle">Premium Access</h1>

        {user?.isPremium ? (
          <div className="premium-active">
            <div className="premium-badge">👑 Premium Active</div>
            <h2>You already have Premium! 🎉</h2>
            <p>Thank you for supporting the app!</p>

            <div className="premium-features">
              <h3>What you get:</h3>
              <ul className="premiumUl">
                <li>Unlimited bingo card creation & saving</li>
                <li>Full editing & deletion rights</li>
                <li>Custom colors & gradients</li>
                <li>Priority support & future exclusive features</li>
              </ul>
            </div>

            <a href="/" className="btn secondary">Back to Home</a>
          </div>
        ) : (
          <>
            <p className="price">One-time payment: <strong>$3.49</strong></p>
            <p className="subtitle">Unlock all premium features forever</p>

            {loading && <p className="loading">Processing...</p>}
            {error && <p className="error">{error}</p>}
            {success && <p className="success">Premium unlocked! Refreshing...</p>}

            <div className="paypal-container">
              <PayPalButtons
                createOrder={createOrder}
                onApprove={onApprove}
                style={{
                  layout: "vertical",
                  color: "gold",
                  shape: "rect",
                  label: "paypal",
                  tagline: false,
                }}
              />
            </div>

            <div className="features-card">
              <h3>Premium includes:</h3>
              <ul className="premiumUl">
                <li>Unlimited creation & storage of bingo cards</li>
                <li>Edit and delete your boards anytime</li>
                <li>Custom text colors, backgrounds & gradients</li>
                <li>Future exclusive features & early access</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}