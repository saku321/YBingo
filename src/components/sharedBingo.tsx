import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/sharedBingo.css';
import heartPng from '../assets/heart.png';
import commentPng from '../assets/chat.png';
type CellData = { value: string; marked: boolean };
type BingoCard = CellData[][];

interface OwnerInfo {
  name: string;
  profilePic?: string;
}
interface ColorData {
  text?: string;
  lines?: string;
  background?: string | [string, string];
  center?: [string, string];
}
interface BoardData {
  owner: OwnerInfo;
  card: BingoCard;
  createdAt: string;
   cardColors?: ColorData; 
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
              const isFree = r === 2 && c === 2;
              const isMarked = cell.marked;
               const cardColors = board.boardData.cardColors || {}; 
             return (
              <div className="cell-wrapper" key={`${r}-${c}`} style={{backgroundColor:`${cardColors.background}`}}>
                {isFree ? (
                  <div
                    className="cell free"
                    style={{
                      background: `linear-gradient(135deg, ${
                        cardColors.center?.[0] || '#3a82f7'
                      }, ${cardColors.center?.[1] || '#f73340'})`,
                    }}
                  >
                    2026
                  </div>
                ) : (
                  <div
                    className={`cell ${isMarked ? 'marked' : ''}`}
                    style={{
                      border: `1px solid ${cardColors.lines || '#cccccc'}`,
                      color: cardColors.text || '#000000',
                    }}
                  >
                    {cell.value}
                    {isMarked && <span className="cross">✗</span>}
                  </div>
                )}
              </div>
            );
            })
          )}
        </div>
        <div className="meta-info">
          <div className="creatorData">
            <div className="creatorImg"><img src={boardData.owner?.profilePic} alt="creatorImg"/></div>

            <div className="creator">@{boardData.owner?.name || 'Anonymous'}</div>
            <div className="date">{createdDate}</div>
          </div>
          <div className="cardStats">
            <img src={heartPng} alt="likePng" className="statImg"/>
            <span>20k</span>
            <img src={commentPng} alt="commentPng" className="statImg"/>
            <span>1</span>
          </div>
      </div>

   
      <div className="comments-section">
        <h2 className="comments-title">Comments:</h2>
          <div className="comments-list">
          <div className="comment-item">
            <div className="comment-header">
              <img  alt="commentauthorImg" className="comment-author-Img"/>
              <span className="comment-author">

              </span>
              <span className="comment-date">2 hours ago</span>
            </div>
            <div className="comment-content">
              Apina
            </div>
          </div>
       </div>
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