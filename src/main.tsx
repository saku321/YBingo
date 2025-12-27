import './styles/main.css';
import testCard from './assets/bingo.png';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { red } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './styles/bingoCard.css';
import PopularIdeas from './components/popularIdeas';
import { useAuth } from './authProvider';

export default function Main() {
  const apiUrl = process.env.REACT_APP_API_DOMAIN || '';

  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();

  function BingoGrid({
    card,
  }: {
    card: { value: string; marked: boolean }[][];
  }) {
    return (
      <div className="bingoGrid bingoGrid--medium" style={{borderRadius:"18px"}}>
        {card.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isFree =
              cell.value.toLowerCase() === '2026' ||
              (rowIndex === 2 && colIndex === 2);

            return (
              <div key={`${rowIndex}-${colIndex}`} className="cell-wrapper">
                <div
                  className={`cell ${isFree ? 'free' : ''} ${
                    cell.marked ? 'marked' : ''
                  }`}
                >
                 
                  {rowIndex === 2 && colIndex === 2 ? '2026' : cell.value}
                  {cell.marked && <span className="cross">✕</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  useEffect(() => {
    async function fetchRecentCards() {
      try {
        const res = await fetch(`${apiUrl}/api/recentCards`);
        const data = await res.json();

        if (res.ok) {
          setBoards(data.boards || []);
        }
      } catch (err) {
        console.error('Failed to load recent cards:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentCards();
  }, [apiUrl]);

  const placeholders = Array.from({ length: 6 });

  return (
    <div>
      <PopularIdeas/>
        <div className="mainContainer">
    <section className="hero">
    <div className="hero-bingo-preview">
        <div className="bingo-3d-wrapper">
        <img
            src={testCard}
            alt="3D Example Bingo Card"
            className="bingo-3d-image"
        />
        </div>
    </div>

    <div className="hero-content">
        <h1 className="hero-title">Create Your Bingo Card for Next Year</h1>
        <p className="hero-subtitle">
    "That wasn't on my Bingo card this year"<br /><br />
    Now it can be : 
        </p>

        <div className="hero-actions">
        <Button
            component={Link}
            to={isLoggedIn ? `/bingoCreate` : "/login"}
            variant="contained"
            size="large"
            className="hero-button"
        >
            Create Your BINGO →
        </Button>
        </div>
    </div>
    </section>

        <section className="recent-section">
            <h2 className="siteTitle">Recently Created Cards : </h2>

            <div className="cardsContainer">
            {(loading ? placeholders : boards).map((board, index) => (
                <div key={index} className="bingocard">
                <Card sx={{ maxWidth: 345, borderRadius: '16px', overflow: 'hidden' }}>
                    <CardHeader
                    avatar={
                        <Avatar
                          src={!loading ? board?.boardData?.ownerPicture : undefined}
                          sx={{ bgcolor: red[500] }}
                        >
                          {!loading && board?.boardData?.owner?.[0]}
                        </Avatar>
                        }
                        title={!loading ? board?.boardData?.owner || 'Anonymous' : 'Loading...'}
                        subheader={
                          !loading
                            ? board.boardData.createdAt || board.boardData.updatedAt
                            : 'Loading...'
                        }
                        />

                    <div className="bingoCardBody">
                    
                        {loading ? (
                        <img
                            src={testCard}
                            alt="Loading preview"
                            style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '12px',
                            }}
                        />
                        ) : (
                            <div>
                            <a
                                href={`/card/${board.boardData?._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    display: 'block',
                                    cursor: 'pointer',
                                }}
                                >
                            <BingoGrid card={board.boardData.card} />
                            </a>
                        </div>
                        )}
                 
                    </div>
                </Card>
                </div>
            ))}
            </div>
        </section>
    
        </div>
        <footer className="site-footer">
        <div className="footer-container">
            <div className="footer-brand">
              <h3 className="footer-logo">Yearly-Bingo</h3>
              <p className="footer-tagline">
                readme
              </p>
            </div>

            <div className="footer-bottom">
                <div className="footer-links">
                <Link to="/bingoCreate">Create Card</Link>
                <Link to="/privacy">Privacy</Link>
                <Link to="/terms">Terms</Link>
            </div>
            <p>© {new Date().getFullYear()} Yearly-Bingo</p>
            
            </div>
        </div>
    </footer>
</div>
  );
}