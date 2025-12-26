import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/bingoCard.css';


type CellData = { value: string; marked: boolean };
type BingoCell = CellData;
type BingoRow = BingoCell[];
type BingoCard = BingoRow[]; // 2D array

interface OwnerInfo {
  name: string;
  profilePic: string;
}

interface BoardData {
  owner: OwnerInfo;
  card: BingoCard;
  createdAt: string;
}

interface BingoBoard {
  boardId: string;
  boardData: BoardData;
  createdAt: string;
    updatedAt?: string;


}

export default function BingoCard() {
  const { cardId } = useParams<{ cardId: string }>();
  const [board, setBoard] = useState<BingoBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiUrl = process.env.REACT_APP_API_DOMAIN || '';

  useEffect(() => {
    async function fetchCard() {
      try {
        const res = await fetch(`${apiUrl}/api/card/${cardId}`);
        const data = await res.json();
        if (res.ok) {
          const resData = data.filterData;

          setBoard(resData);
          console.log(resData);
        } else {
          setError(data.error || 'Card not found');
        }
      } catch (err) {
        setError('Failed to fetch card');
      } finally {
        setLoading(false);
      }
    }

    if (cardId) fetchCard();
  }, [cardId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!board) return null;

  return (
    <div id="cardsContainer">
  <h1>Shared Bingo Card</h1>

  <div className="yourBingoGrid">
    {board.boardData.card.map((row, r) =>
      row.map((cell, c) => (
        <div key={`${r}-${c}`} className="textarea-wrapper">
          <textarea
            className={`disCell ${cell.marked ? 'marked' : ''}`}
            value={cell.value}
            readOnly
          />
        </div>
      ))
    )}
  </div>

  <div className="cardInfo">
    <span>Created: {board.boardData.createdAt}</span>
    {board.boardData.owner && (
      <span> • by {board.boardData.owner.name}</span>
    )}
  </div>

  {/* Comments section placeholder - ready for future implementation */}
  <div className="comments-section">
    <h2>Comments</h2>
    {/* 
      When you're ready to add comments, you can put here:
      - list of comments
      - comment input form
      - loading state, etc.
    */}
    <p className="no-comments-yet">No comments yet. Be the first to comment!</p>
  </div>
</div>
  );
}