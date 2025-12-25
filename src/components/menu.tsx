
import '../styles/menu.css';
import { useEffect, useState } from 'react';
import {Link} from 'react-router-dom';
export default function Menu(){
    const [login,setLogin] = useState(false);
    const apiUrl = process.env.REACT_APP_API_DOMAIN || '';
    console.log(apiUrl);
    useEffect(()=>{
        const checkLoginStatus = async()=>{
            try{
                const res = await fetch(`${apiUrl}/api/auth/checkLogin`,{
                    method:"POST",
                    credentials:"include",
                });
                if(res.ok){
                    setLogin(true);
                }else{
                    setLogin(false);
                }   
            }catch(err){
                setLogin(false);
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
                <li>
                    {login?(
                    <Link to="/">
                        Your Cards  
                    </Link>
                    ):(
                    <Link to="/login">
                        Login  
                    </Link>
                    )}
                  
                </li>
                  
                </ul>
            </div>
        </div>
    )
}