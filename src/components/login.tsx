import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import '../styles/login.css';
import { useAuth } from "../authProvider";
import { useNavigate } from 'react-router-dom';



const Login = () => {
 const { setIsLoggedIn, setUser } = useAuth();
 const navigate = useNavigate();
  const apidomain = process.env.REACT_APP_API_DOMAIN || '';
  const handleSuccess = async(credentialResponse: any) => {
    
    const token = credentialResponse.credential;

    // You would usually send this token to your backend
    const res = await fetch(`${apidomain}/api/auth/google`, {
       method: "POST",
       headers:{"Content-Type":"application/json"},
       credentials: "include",
      body: JSON.stringify({ token }),
     });
  
  if(!res.ok) {
      console.error("Login failed");
      return;
    }
    const data = await res.json();
    console.log("Login successful", data);
    setIsLoggedIn(true);
     setUser(data.user);
   navigate("/");
  };
  const handleError = () => {
    console.log("Google login failed");
  };

  return (
    <div className="loginContainer">
      <div >
        <h1>Login with Google</h1>
       

        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          width="250"
        />
      </div>
    </div>
  );
};



export default Login;
