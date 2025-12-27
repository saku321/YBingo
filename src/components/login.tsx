import React,{useState} from "react";
import {  GoogleLogin, CredentialResponse } from "@react-oauth/google";
import '../styles/login.css';
import { useAuth } from "../authProvider";
import { useNavigate } from 'react-router-dom';



export default function Login() {
 const { setIsLoggedIn, setUser } = useAuth();
 const navigate = useNavigate();
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
  const apiDomain = process.env.REACT_APP_API_DOMAIN || '';
  
  const handleGoogleSuccess = async(credentialResponse: CredentialResponse) => {
    setLoading(true);
    setError(null);

    try{
      const token = credentialResponse.credential;
      if(!token) console.log("No credential received");


    
    // You would usually send this token to your backend
    const res = await fetch(`${apiDomain}/api/auth/google`, {
       method: "POST",
       headers:{"Content-Type":"application/json"},
       credentials: "include",
      body: JSON.stringify({ token }),
     });
  
  if(!res.ok) {
      console.error("Login failed");
      const errData = await res.json();
      console.log(errData);
      return;
    }
    const data = await res.json();
    console.log("Login successful", data);
    setIsLoggedIn(true);
     setUser(data.user);
   navigate("/");
  }catch(err:any){
    console.log("google error: ",err);
    setError(err.message);
  }finally{
    setLoading(false);
  }
}
  const handleGoogleError = () => {
    console.log("Google login failed");
  };
  

return (
      <div className="loginContainer">
        <div>
          <h1>Login to save your Cards</h1>

          {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

          <button
          id="twitterLoginBtn"
            onClick={() => window.location.href = `${apiDomain}/auth/twitter`}
            disabled={loading}
          >
            <svg className="twitter-Logo" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" fill="#ffffff"/>
        </svg>
        Sign in with X

          </button>

          <div style={{ marginTop: '1rem' }}>
            {!loading && (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width={250}
                text="signin_with"
                shape="rectangular"
                theme="filled_blue"
                size="large"
              />
            )}
          </div>

          {loading && <p>Loading...</p>}
        </div>
      </div>
  );
};



