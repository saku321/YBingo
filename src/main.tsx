import './styles/main.css';
import testCard from './assets/bingo.png';

interface BingoCard {
  id: number;
  image: string;
  // add other properties as needed
}

export default function Main(){
    
    // Example data array
    const bingoCards: BingoCard[] = [
        { id: 1, image: './assets/bingo.png' },
        { id: 2, image: '/image2.png' },
        { id: 3, image: '/image3.png' },
        // more data...
    ];

    return(
        <div className="mainContainer">
            <h2 className="siteTitle">Recently Created Cards:</h2>
            
            <div className="cardsContainer">
                {bingoCards.map((card) => (
                    <div key={card.id} className="bingocard">
                        <img src={testCard} alt="bingo card" />
                    </div>
                ))}
            </div>
        </div>
    )
}