
import '../styles/menu.css';
import { useEffect, useState } from 'react';
import {Link} from 'react-router-dom';
import { useAuth } from '../authProvider';
export default function Menu(){
    const [login,setLogin] = useState(false);
    const apiUrl = process.env.REACT_APP_API_DOMAIN || '';
    const {isLoggedIn} = useAuth();
    const setLoggedIn = useAuth().setIsLoggedIn;
    function logOutUser(){
        fetch(`${apiUrl}/api/auth/logout`,{
            method:"POST",
            credentials:"include",
        }).then((res)=>{
            if(res.ok){
                setLoggedIn(false);
            }
        });
    }

    useEffect(()=>{
        const checkLoginStatus = async()=>{
            try{
                const res = await fetch(`${apiUrl}/api/auth/checkLogin`,{
                    method:"POST",
                    credentials:"include",
                });
                if(res.ok){
                   setLoggedIn(true);
                }else{
                    setLoggedIn(false);
                }   
            }catch(err){
                setLoggedIn(false);
            }
        };
        checkLoginStatus();
    },[]);
    return(
        <div id="menuContainer">
            
           <h1 className="logoTitle"><span id="miniTxt">Your</span><Link to="/">Yearly-Bingo</Link></h1> 
           <div className="menuContent">
                <ul>
                 
                  <li> 
                    <Link to="/bingoCreate">
                        <span style={{color:"#f73340ff"}}>+</span> Create Bingo card
                    </Link>
                  </li>
                  <li>
                    <Link to="/">
                       Learn More
                    </Link>
                 </li>
                
                    {isLoggedIn ?(
                        <div style={{display:"flex"}}>
                            <li>
                    <Link to="/">
                        Your Cards  
                    </Link>
                    </li>
                    <li>
                        <button id="logoutBtn" onClick={logOutUser}>LogOut</button>
                    </li>
                    </div>
                    ):(
                    <li>
                        <Link to="/login">
                            Login  
                        </Link>
                    </li>
                    )}
                  
                
                  
                </ul>
            </div>
        </div>
    )
}