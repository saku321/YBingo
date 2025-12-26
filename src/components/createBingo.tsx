import {useState,useEffect} from 'react';
import '../styles/bingoCreate.css';
import Button from '@mui/material/Button'

type CellData = { value: string; marked: boolean };
type BingoCard = CellData[][];

export default function CreateBingo(){
    const SIZE =5;
    const [status,setStatus] =useState("");
    const apiUrl = process.env.REACT_APP_API_DOMAIN || ''
    const [card,setCard] = useState<BingoCard>(
        Array.from({ length: SIZE }, () =>
        Array.from({ length: SIZE }, () => ({ value: "", marked: false }))
    )
    ) 
    function updateCell(row: number, col: number, value: string) {
        setCard(prev =>
        prev.map((r, rIdx) =>
            rIdx === row
            ? r.map((c, cIdx) => (cIdx === col ? { ...c, value } : c))
            : r
        )
    );
  }
    

  async function submitCard(){
    try{
      let emptyCells=0;
       for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (r === 2 && c === 2) continue; // skip center
      if (card[r][c].value.trim() === ""|| card[r][c].value.length<3) {
        emptyCells++;
      }
    }
  }
    if(emptyCells>0){
      setStatus(`Fill all cells with at least 3 characters`);
      return;
    }
      const res = await fetch(`${apiUrl}/api/createCard`,{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card }),
        credentials:"include",
        
      });
      const result = await res.json().catch(() => null);
      console.log('createCard response', res.status, result);
      if(result.ok){
        setStatus("You Bingo Card is Saved!");
        setCard(Array.from({ length: SIZE }, () =>
          Array.from({ length: SIZE }, () => ({ value: "", marked: false }))
        ));
        setCard(prev =>
      prev.map((row, r) =>
        row.map((cell, c) =>
          r === 2 && c === 2 ? { value: "2026", marked: false } : cell
        )
      )
    );
      }
    }catch(err){
      console.error('submitCard error', err);
    }
  }
  useEffect(() => {
    setCard(prev =>
      prev.map((row, r) =>
        row.map((cell, c) =>
          r === 2 && c === 2 ? { value: "2026", marked: false } : cell
        )
      )
    );
  }, []);
    
    return(
       <div id="bingoCreatingContainer">
      <h1 id="siteTitle">Create Bingo Card for 2026</h1>

      <div id="creatorContent">
        <div className="bingoGrid">
          {card.map((row, r) =>
            row.map((cell, c) => (
              <div className="textarea-wrapper" key={`${r}-${c}`}>

                <textarea
                  className={`cell ${r === 2 && c === 2 ? 'free' : ''}`}
                  value={cell.value}
                  disabled={r === 2 && c === 2} 
                  minLength={3}
                  maxLength={20}
                  placeholder={r === 2 && c === 2 ? '' : ''}
                  onChange={(e) => updateCell(r, c, e.target.value)}
                />
              </div>
            ))
          )}
          </div>
      </div>
       <span id="statusTxt">{status}</span>

      <button className="generateCardBtn" onClick={submitCard}>
        Generate
      </button>
    </div>
  );
}