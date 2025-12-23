
import '../styles/menu.css';
import { useState } from 'react';
import {Link} from 'react-router-dom';
export default function Menu(){
    const [login,setLogin] = useState(true);
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
                    <Link to="/">
                        Login  
                    </Link>
                    )}
                  
                </li>
                  
                </ul>
            </div>
        </div>
    )
}