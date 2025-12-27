import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/sharedBingo.css';

type CellData = { value: string; marked: boolean };
type BingoCard = CellData[][];

interface OwnerInfo {
  name: string;
  profilePic?: string;
}

interface BoardData {
  owner: OwnerInfo;
  card: BingoCard;
  createdAt: string;
}

interface BingoBoard {
  boardId: string;
  boardData: BoardData;
}

export default function SharedBingo() {
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
          setBoard(data.filterData);
        } else {
          setError(data.error || 'Card not found');
        }
      } catch (err) {
        setError('Failed to load bingo card');
      } finally {
        setLoading(false);
      }
    }

    if (cardId) fetchCard();
  }, [cardId]);

  if (loading) return <div className="loading">Loading bingo card...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!board) return null;

  const { boardData } = board;
  const createdDate = new Date(boardData.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '.');

  return (
    <div className="bingo-detail-page">
     
      <div className="bingo-main">
        <h1 className="page-title">Bingo Card</h1>

        <div className="bingoGrid bingoGrid--medium">
          {boardData.card.map((row, r) =>
            row.map((cell, c) => {
              const isCenter = r === 2 && c === 2;
              const isMarked = cell.marked;

              return (
                <div key={`${r}-${c}`} className="cell-wrapper">
                  <div
                    className={`cell ${isCenter ? 'free' : ''} ${isMarked ? 'marked' : ''}`}
                  >
                    {isCenter ? '2026' : cell.value}
                    {isMarked && <span className="cross">✕</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="meta-info">
          <div className="creatorImg"><img src={boardData.owner?.profilePic} alt="creatorImg"/></div>
          <div className="creatorData">
            <div className="creator">@{boardData.owner?.name || 'Anonymous'}</div>
            <div className="date">{createdDate}</div>
          </div>
      </div>

   
      <div className="comments-section">
        <h2 className="comments-title">Comments:</h2>

        

        <form className="comment-form">
          <textarea
            className="comment-input"
            placeholder="Write your comment..."
            rows={3}
          />
          <button type="submit" className="send-btn">
            Send
          </button>
        </form>
      </div>
      </div>

     

    </div>
  );
}