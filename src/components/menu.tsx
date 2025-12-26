
import '../styles/menu.css';
import { useEffect, useState,useRef  } from 'react';
import {Link} from 'react-router-dom';
import { useAuth } from '../authProvider';
export default function Menu(){
    const [login,setLogin] = useState(false);
    const apiUrl = process.env.REACT_APP_API_DOMAIN || '';
    const profileRef = useRef<HTMLDivElement>(null);
    const [dropDown,setDropDown]=useState(false);
    const { isLoggedIn, user, setIsLoggedIn,clearUser } = useAuth();

    function logOutUser(){
        fetch(`${apiUrl}/api/auth/logout`,{
            method:"POST",
            credentials:"include",
        }).then((res)=>{
            if(res.ok){
                setIsLoggedIn(false);
               clearUser();
                
            }
        });
    }

    const handleDropdown = () => setDropDown(prev => !prev);
        useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
        if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setDropDown(false);
        }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
    }, [profileRef]);
    return(
       <div id="menuContainer">
  <header className="topNav">
    {/* LEFT: LOGO */}
    <h1 className="logoTitle">
      <span id="miniTxt">Your</span>
      <Link to="/">Yearly-Bingo</Link>
    </h1>

    {/* CENTER: NAV LINKS */}
    <nav className="menuContent">
      <ul>
        <li>
          <Link to="/bingoCreate" className="createLink">
            + Create Bingo card
          </Link>
        </li>
        <li>
          <Link to="/">Learn More</Link>
        </li>

        {isLoggedIn && (
          <li>
            <Link to="/yourCards">Your Cards</Link>
          </li>
        )}
      </ul>
    </nav>

  
    <div className="menuRight">
      {isLoggedIn ? (
        <div id="profileContainer" ref={profileRef}>
          <div id="profileInfo" onClick={handleDropdown}>
            <img
              src={user?.picture}
              alt="profilePic"
              id="profilePic"
            />
            <p>{user?.name}</p>
          </div>

          {dropDown && (
            <div id="profileDropDown">
              <button className="dropdownBtn">Profile</button>
              <button className="dropdownBtn" onClick={logOutUser}>
                LogOut
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="loginLink">
          Login
        </Link>
      )}
    </div>
  </header>
</div>
    )
}