
import '../styles/menu.css';
import {Link} from 'react-router-dom';
export default function Menu(){

    return(
        <div id="menuContainer">
            <h1 className="logoTitle">Yearly-Bingo</h1>
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
                    <Link to="/">
                        Your Cards  
                    </Link>
                </li>
                  
                </ul>
            </div>
        </div>
    )
}