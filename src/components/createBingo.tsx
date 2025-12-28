import {useState,useEffect,useRef} from 'react';
import '../styles/bingoCreate.css';
import Button from '@mui/material/Button'
import PopularIdeas from './popularIdeas';

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
    const textareaRefs = useRef<(HTMLTextAreaElement | null)[][]>(
    Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  );
const adjustFontSize = (textarea: HTMLTextAreaElement | null) => {
  if (!textarea) return;

  // Reset first
  textarea.style.fontSize = '';
  textarea.style.lineHeight = '';

  // Let CSS handle most of the scaling
  // The class .cell already has clamp() — we just help with very long content
  const length = textarea.value.trim().length;
  const lines = textarea.value.split('\n').length;

  // Only aggressive shrink when text is really long
  let scale = 1;

  if (length > 22 || lines > 4)      scale = 0.82;
  else if (length > 16 || lines > 3) scale = 0.90;
  else if (length > 10 || lines > 1) scale = 0.96;

  // Optional: very slight line-height adjustment
  textarea.style.fontSize = `calc(var(--cell-font-size) * ${scale})`;
  textarea.style.lineHeight = lines > 3 ? '1.18' : '1.28';
};
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
    card.forEach((row, r) => {
      row.forEach((cell, c) => {
        const textarea = textareaRefs.current[r][c];
        if (textarea) {
          adjustFontSize(textarea);
        }
      });
    });
  }, [card]);
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
       <div id="bingoCreateMain">
          <PopularIdeas/>
      <h1 id="siteTitle">Create Bingo Card for 2026</h1>
    <div id="bingoCreatingContainer">
      <div id="customContainer">
        <div id="colorPickerContainer">
          <div className="color-control">
            <span>Text Color</span>
            <input type="color" className="colorPicker" />
          </div>

          <div className="color-control">
            <span>Background Color</span>
            <input type="color" className="colorPicker" />
          </div>

          <div className="color-control">
            <span>Column Lines</span>
            <input type="color" className="colorPicker" />
          </div>

          <div className="color-control">
            <span>Center Column</span>
            <input type="color" className="colorPicker" />
          </div>
        </div>
      </div>
      <div id="creatorContent">
     
        <div className="bingoGrid bingoGrid--medium">
          {card.map((row, r) =>
            row.map((cell, c) => (
    
              <div className="cell-wrapper" key={`${r}-${c}`}>
               {r===2&&c===2?(
                  <div className="cell free">2026</div>
               ):(
                <textarea
                 ref={(el) => {
                  textareaRefs.current[r][c] = el;
                }}
                  className={`cell ${r === 2 && c === 2 ? 'free' : ''}`}
                  value={cell.value}
                  rows={4}
                  disabled={r === 2 && c === 2} 
                  minLength={3}
                  maxLength={30}
                  placeholder={r === 2 && c === 2 ? '' : ''}
                  onChange={(e) => updateCell(r, c, e.target.value)}
                  
                />
              )}
              
                
              </div>
            ))
          )}
          </div>
         
  </div>
      </div>
       <span id="statusTxt">{status}</span>

      <button className="generateCardBtn" onClick={submitCard}>
        Generate
      </button>
    </div>
  );
}