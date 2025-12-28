import { useEffect, useState } from "react";
import {  PayPalButtons } from "@paypal/react-paypal-js";
import {useAuth} from '../authProvider';
export default function Premium() {

  const {user,isLoggedIn,refetchAuth} = useAuth();
  const [orderID, setOrderID] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Function to create order via backend
  const createOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/paypal/createOrder", {
        method: "POST",
        credentials: "include", // send cookies for auth
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setLoading(false);
      return data.id; // PayPal order ID
    } catch (err) {
      console.error(err);
      setError("Failed to create order");
      setLoading(false);
    }
  };

  // Function to capture order after approval
  const onApprove = async (data:any) => {
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
        await refetchAuth();
      } else {
        setError("Payment not completed");
      }
    } catch (err) {
      console.error(err);
      setError("Payment capture failed");
      setLoading(false);
    }
  };
  if(!isLoggedIn){
    return <div>Please <a href="/login">Log in</a></div>
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
      <h1>Premium Access</h1>
      <p>Pay $3.49 to unlock premium features!</p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Premium unlocked! 🎉</p>}

      
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "paypal" }}
        />
    </div>
  );
}
