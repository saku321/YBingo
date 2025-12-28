import { useState, useEffect } from 'react';
import '../styles/yourCards.css';
import { Link } from 'react-router-dom';
import '../styles/bingoCard.css';

type CellData = { value: string; marked: boolean };
type BingoCard = CellData[][];

interface ColorData {
  text?: string;
  lines?: string;
  background?: string | [string, string];
  center?: [string, string];
}

interface BoardData {
  owner: string;
  card: BingoCard;
  createdAt: string | null;
  cardColors?: ColorData; 
}

interface BingoBoard {
  boardId: string;
  boardData: BoardData;
  createdAt: string;
  updatedAt?: string;
}

export default function YourCards() {
  const [cards, setCards] = useState<BingoBoard[]>([]);
  const apiUrl = process.env.REACT_APP_API_DOMAIN || '';
  const [editId, setEditId] = useState<string | null>(null);
  const [markedCells, setMarkedCells] = useState<Record<string, Set<string>>>({});
  const [savedMarkedCells, setSavedMarkedCells] = useState<Record<string, Set<string>>>({});

  // Safe defaults for colors
  const defaultColors: ColorData = {
    text: '#000000',
    lines: '#cccccc',
    background: '#ffffff',
    center: ['#3a82f7', '#f73340'],
  };

  // Helper to get safe background style
  const getBackgroundStyle = (cardColors?: ColorData) => {
    const bg = cardColors?.background ?? defaultColors.background;

    if (Array.isArray(bg) && bg.length === 2) {
      return `linear-gradient(135deg, ${bg[0]}, ${bg[1]})`;
    }
    return typeof bg === 'string' ? bg : '#ffffff'; // fallback
  };

  const handleShare = (boardId: string) => {
    const shareUrl = `${window.location.origin}/card/${boardId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const isEdit = (boardId: string) => editId === boardId;

  const getMarkedSet = (boardId: string): Set<string> => {
    return markedCells[boardId] || new Set();
  };

  const toggleMark = (boardId: string, r: number, c: number) => {
    const key = `${r}-${c}`;
    setMarkedCells((prev) => {
      const current = new Set(prev[boardId] || []);
      if (current.has(key)) {
        current.delete(key);
      } else {
        current.add(key);
      }
      return {
        ...prev,
        [boardId]: current,
      };
    });
  };

  const handleStartEdit = (boardId: string) => {
    setEditId(boardId);
    const board = cards.find((b) => b.boardId === boardId);
    if (board) {
      const initialMarked = new Set<string>();
      board.boardData.card.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell.marked) initialMarked.add(`${r}-${c}`);
        })
      );
      setSavedMarkedCells((prev) => ({
        ...prev,
        [boardId]: initialMarked,
      }));
      setMarkedCells((prev) => ({
        ...prev,
        [boardId]: new Set(initialMarked),
      }));
    }
  };

  const handleSave = async (boardId: string) => {
    setEditId(null);
    const markedSet = markedCells[boardId] || new Set();
    const markedArray = Array.from(markedSet);
    if (markedArray.length === 0) return;

    const board = cards.find((b) => b.boardId === boardId);
    if (!board) return;

    const updatedCard = board.boardData.card.map((row, r) =>
      row.map((cell, c) => ({
        ...cell,
        marked: markedArray.includes(`${r}-${c}`),
      }))
    );

    try {
      const res = await fetch(`${apiUrl}/api/editCard`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          newData: updatedCard,
        }),
      });

      if (res.ok) {
        setCards((prev) =>
          prev.map((b) =>
            b.boardId === boardId
              ? {
                  ...b,
                  boardData: {
                    ...b.boardData,
                    card: updatedCard,
                  },
                }
              : b
          )
        );
        setSavedMarkedCells((prev) => {
          const updated = { ...prev };
          delete updated[boardId];
          return updated;
        });
      }
    } catch (err) {
      console.error('Error saving:', err);
    }
  };

  const handleCancel = (boardId: string) => {
    setEditId(null);
    const originalMarked = savedMarkedCells[boardId];
    setMarkedCells((prev) => {
      const updated = { ...prev };
      if (originalMarked) {
        updated[boardId] = new Set(originalMarked);
      } else {
        delete updated[boardId];
      }
      return updated;
    });
    setSavedMarkedCells((prev) => {
      const updated = { ...prev };
      delete updated[boardId];
      return updated;
    });
  };

  const handleDelete = async (boardId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/deleteCards`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardIds: [boardId] }),
      });
      if (res.ok) {
        setCards((prev) => prev.filter((b) => b.boardId !== boardId));
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  useEffect(() => {
    async function getCards() {
      try {
        const res = await fetch(`${apiUrl}/api/yourCards`, {
          method: 'POST',
          credentials: 'include',
        });
        const data = await res.json();
        setCards(data.boards || []);
      } catch (err) {
        console.error('Error fetching cards:', err);
      }
    }
    getCards();
  }, [apiUrl]);

  return (
    <div id="cardsContainer">
      {cards.length === 0 ? (
        <p>You have no saved bingo cards.</p>
      ) : (
        <>
          <h1 className="siteTitle">Your Bingo Cards</h1>

          <div className="cardsGrid">
            {cards.map((board) => {
              const isActive = isEdit(board.boardId);
              const marked = getMarkedSet(board.boardId);
              const cardColors = board.boardData.cardColors || {}; // safe fallback

              return (
                <div key={board.boardId} className="bingoCard">
                  <Link
                    onClick={isActive ? (e) => e.preventDefault() : undefined}
                    to={`/card/${board.boardId}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      className={`bingoGrid bingoGrid--medium ${isActive ? 'editing' : ''}`}
                     
                    >
                      {board.boardData.card.map((row, r) =>
                        row.map((cell, c) => {
                          const isFree = r === 2 && c === 2;
                          const isMarked = isActive ? marked.has(`${r}-${c}`) : cell.marked;

                          return (
                            <div className="cell-wrapper" key={`${r}-${c}`}  style={{
                            background: Array.isArray(cardColors.background)
                              ? `linear-gradient(135deg, ${cardColors.background[0] || '#ffffff'}, ${cardColors.background[1] || '#f0f0f0'})`
                              : (cardColors.background || '#ffffff'),
                          }}>
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
                                  className={`cell ${isMarked ? 'marked' : ''} ${isActive ? 'clickable' : ''}`}
                                  onClick={isActive ? () => toggleMark(board.boardId, r, c) : undefined}
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
                  </Link>

                  <div className="cardInfo">
                    <span className="created-at">
                      {board.boardData.createdAt === 'Unknown' && board.updatedAt
                        ? 'Updated'
                        : 'Created'}
                      :{' '}
                      {board.boardData.createdAt === 'Unknown'
                        ? board.updatedAt
                        : board.boardData.createdAt}
                    </span>

                    <div className="card-actions">
                      {isActive ? (
                        <>
                          <button className="btn btn-save" onClick={() => handleSave(board.boardId)}>
                            Save
                          </button>
                          <button className="btn btn-delete" onClick={() => handleDelete(board.boardId)}>
                            Delete
                          </button>
                          <button className="btn btn-cancel" onClick={() => handleCancel(board.boardId)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-edit" onClick={() => handleStartEdit(board.boardId)}>
                            Edit
                          </button>
                          <button className="btn btn-share" onClick={() => handleShare(board.boardId)}>
                            Share
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}