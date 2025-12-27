import {useState,useEffect} from 'react';
import '../styles/yourCards.css';
import { Link } from 'react-router';
import '../styles/bingoCard.css';
type CellData = { value: string; marked: boolean };
type BingoCell = CellData;
type BingoRow = BingoCell[];
type BingoCard = BingoRow[]; // 2D array

interface BoardData {
  owner: string;
  card: BingoCard;
    createdAt: string | null;
}

interface BingoBoard {
  boardId: string;
  boardData: BoardData;
  createdAt: string;
    updatedAt?: string;

}


export default function YourCards() {
  const [cards, setCards] = useState<BingoBoard[]>([]);
  const apiUrl = process.env.REACT_APP_API_DOMAIN || ''
 const [editId, setEditId] = useState<string | null>(null);  // renamed from editingId
  const [markedCells, setMarkedCells] = useState<Record<string, Set<string>>>({});
  const [savedMarkedCells, setSavedMarkedCells] = useState<Record<string, Set<string>>>({});
    
  const handleShare = (boardId: string) => {
    const shareUrl = `${window.location.origin}/bingo/${boardId}`;
    console.log(shareUrl);
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
    // Save the current marked state when entering edit mode
    const board = cards.find(b => b.boardId === boardId);
    if (board) {
      const initialMarked = new Set<string>();
      board.boardData.card.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell.marked) {
            initialMarked.add(`${r}-${c}`);
          }
        });
      });
      setSavedMarkedCells((prev) => ({
        ...prev,
        [boardId]: initialMarked,
      }));
      setMarkedCells((prev) => ({
        ...prev,
        [boardId]: new Set(initialMarked),
      }));
    }
}
  const handleSave = async (boardId: string) => {
    setEditId(null);
    
    const markedSet = markedCells[boardId] || new Set();
    const markedArray = Array.from(markedSet);
    if(markedArray.length===0){
      return;
    }
    const board = cards.find(b => b.boardId === boardId);
    let updatedCard: BingoCard = [];
    if (board) {
         updatedCard = board.boardData.card.map((row, r) =>
            row.map((cell, c) => ({
                ...cell,
                marked: markedArray.includes(`${r}-${c}`),
            }))
        );
    }

    
    try {
      const res = await fetch(`${apiUrl}/api/editCard`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId,
          newData:updatedCard
        }),
      });console.log(res);
      
      if (res.ok) {
        // Update the cards state with the new marked values
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
        // Keep the current marked state
        setSavedMarkedCells((prev) => {
          const updated = { ...prev };
          delete updated[boardId];
          return updated;
        });
      } else {
        console.error('Failed to save marked cells');
      }
    } catch (err) {
      console.error('Error saving marked cells:', err);
    }
  };

  const handleCancel = (boardId: string) => {
    setEditId(null);
    // Restore the saved state before edit mode
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
    // Clear the saved state
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                boardIds: [boardId],
            }),
        });
        if (res.ok) {
            setCards((prev) => prev.filter((board) => board.boardId !== boardId));
        }

    } catch (err) {
        console.error('Error deleting cards:', err);
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
        setCards(data.boards);
      } catch (err) {
        console.error('Error fetching cards:', err);
      }
    }

    getCards();
  }, [apiUrl]);console.log(cards);

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

              return (
                <div key={board.boardId} className="bingoCard">
                <Link onClick={isActive ? (e) => e.preventDefault() : undefined} to={`/card/${board.boardId}`} key={board.boardId} style={{ textDecoration: 'none' }}>

                  <div className={`bingoGrid bingoGrid--medium ${isActive ? 'editing' : ''}`}>
                    {board.boardData.card.map((row, r) =>
                      row.map((cell, c) => {
                        const isFree = r === 2 && c === 2;
                        const isMarked = isActive ? marked.has(`${r}-${c}`) : cell.marked;
                        

                        return (
                          <div
                            className="cell-wrapper"
                            key={`${board.boardId}-${r}-${c}`}
                            aria-disabled={isFree ? 'true' : 'false'}
                          >
                            <div
                              className={`
                                cell
                                ${isFree ? 'free' : ''} 
                                ${isMarked ? 'marked' : ''} 
                                ${isActive && !isFree ? 'clickable' : ''}
                              `}
                              onClick={
                                isActive && !isFree
                                  ? () => toggleMark(board.boardId, r, c)
                                  : undefined
                              }
                            >
                              {isFree ? '2026' : cell.value}
                              {isMarked && <span className="cross">✗</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                    
                  </div>
                  </Link>

                  <div className="cardInfo">
                    <span className="created-at">
                      {board.boardData.createdAt === "Unknown" && board.updatedAt ? 'Updated' : 'Created'}: {board.boardData.createdAt==="Unknown" ? board.updatedAt : board.boardData.createdAt}
                    </span>

                    <div className="card-actions">
                      {isActive ? (
                        <>
                          <button
                            className="btn btn-save"
                            onClick={() => handleSave(board.boardId)}
                          >
                            Save
                          </button>
                              <button
                            className="btn btn-delete"
                            onClick={() => handleDelete(board.boardId)}
                          >
                            Delete
                          </button>
                           <button
                            className="btn btn-cancel"
                            onClick={() => handleCancel(board.boardId)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-edit"
                            onClick={() => handleStartEdit(board.boardId)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-share"
                            onClick={() => handleShare(board.boardId)}
                          >
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