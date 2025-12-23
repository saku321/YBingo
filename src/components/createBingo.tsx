import {useState,useEffect} from 'react';
import '../styles/bingoCreate.css';
import Button from '@mui/material/Button'
type BingoCard=string[][];

export default function CreateBingo(){
    const SIZE =5;
    const [status,setStatus] =useState("");
    const [card,setCard] = useState<BingoCard>(
        Array.from({ length: SIZE }, () =>
        Array.from({ length: SIZE }, () => "")
    )
    ) 
    function updateCell(row: number, col: number, value: string) {
        setCard(prev =>
        prev.map((r, rIdx) =>
            rIdx === row
            ? r.map((c, cIdx) => (cIdx === col ? value : c))
            : r
        )
    );
  }
    

  async function submitCard(){
    try{
      const res = await fetch("http://localhost:3001/api/createCard",{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card,owner:"s" })
        
      });
      const result = await res.json().catch(() => null);
      console.log('createCard response', res.status, result);
      if(result.ok){
        setStatus("You Bingo Board is Saved!");
      }
    }catch(err){
      console.error('submitCard error', err);
    }
  }
  useEffect(() => {
    setCard(prev =>
      prev.map((row, r) =>
        row.map((cell, c) =>
          r === 2 && c === 2 ? "2026" : cell
        )
      )
    );
  }, []);
    
    return(
        <div id="bingoCreatingContainer">
            <h1 id="creatorTitle">Create own Bingo card for 2026</h1>

        <div id="creatorContent">
            <div className="bingoGrid">
                {card.map((row, r) =>
                row.map((cell, c) => (
                  <div className="textarea-wrapper" key={`${r}-${c}`}>
                  <textarea
                  value={cell}
                  disabled={r === 2 && c === 2}
                  maxLength={40}
                  placeholder={r === 2 && c === 2 ? "" : "Text"}
                  onChange={e => updateCell(r, c, e.target.value)}
                  className="cell"
                  /></div>
                ))
                )}
            </div>
        </div>
            <span id="statusTxt">{status}</span>

            <Button variant="contained" className="generateCardBtn" onClick={submitCard}>Generate</Button>

        </div>
    )
}