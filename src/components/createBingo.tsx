import {useState,useEffect,useRef} from 'react';
import '../styles/bingoCreate.css';
import Button from '@mui/material/Button'
import PopularIdeas from './popularIdeas';
import {useAuth} from '../authProvider';
import {Link} from 'react-router-dom';
type CellData = { value: string; marked: boolean };
type BingoCard = CellData[][];

export default function CreateBingo(){
     const { user, isLoggedIn } = useAuth();   // ← always called, top of component

 
    const SIZE =5;
    const [status,setStatus] =useState("");

    const [colors, setColors] = useState({
    text:'#1e293b',
    background: '#ffffff',
    lines: '#000000',
    center:[ '#3a82f7', '#F73340'],
  });

    const apiUrl = process.env.REACT_APP_API_DOMAIN || ''
    const [card,setCard] = useState<BingoCard>(
        Array.from({ length: SIZE }, () =>
        Array.from({ length: SIZE }, () => ({ value: "", marked: false }))
    )) ;
  
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
  if (!isLoggedIn) {
    return (
      <div style={{textAlign:"center",margin:"auto"}}>
        Please <a href="/login">Log in</a>
      </div>
    );
  }
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
const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
  const id = e.target.id;
  const value = e.target.value;

  setColors(prev => {
    if (id === 'center' || id === 'center2') {
      // Special handling for center gradient
      const currentCenter = [...prev.center]; // copy array
      if (id === 'center') {
        currentCenter[0] = value;
      } else if (id === 'center2') {
        currentCenter[1] = value;
      }
      return {
        ...prev,
        center: currentCenter,
      };
    }

    // Normal single color fields
    return {
      ...prev,
      [id]: value,
    };
  });
};
 console.log(colors.center);
  
    return(
       <div id="bingoCreateMain">
          <PopularIdeas/>
      <h1 id="siteTitle">Create Bingo Card for 2026</h1>
    <div id="bingoCreatingContainer">
      {user?.isPremium?(

     
      <div id="customContainer">
        <div id="colorPickerContainer">
          <div className="color-control">
            <span>Text Color</span>
            <input type="color" id="text" className="colorPicker" value={colors.text} onChange={handleColorPicker}/>
          </div>

          <div className="color-control">
            <span>Background Color</span>
            <input type="color" id="background" className="colorPicker" value={colors.background}  onChange={handleColorPicker}/>
          </div>

          <div className="color-control">
            <span>Column Lines</span>
            <input type="color" id="lines" className="colorPicker" value={colors.lines}  onChange={handleColorPicker} />
          </div>

          <div className="color-control">
            <span>Center Column</span>
           <div id="pickerColumn">
              <input type="color" id="center" className="colorPicker" value={colors.center[0]}  onChange={handleColorPicker} />
            <input type="color" id="center2" className="colorPicker" value={colors.center[1]} onChange={handleColorPicker}/>
             </div>
          </div>
        </div>
      </div>
       ):(
        <div id="customContainer">
           <a href="/premium"> <button className="promo-glow-btn">Join Premium →</button></a>
        <div id="blurrer">
          <div id="colorPickerContainer">
            <div className="color-control">
              <span>Text Color</span>
              <input type="color" disabled className="colorPicker" />
            </div>

            <div className="color-control">
              <span>Background Color</span>
              <input type="color" disabled  className="colorPicker" />
            </div>

            <div className="color-control">
              <span>Column Lines</span>
              <input type="color" disabled  className="colorPicker" />
            </div>

            <div className="color-control">
              <span>Center Column</span>
              <input type="color" disabled  className="colorPicker" />
            </div>
          </div>
         </div>
      </div>
      )}
      <div id="creatorContent">
     
        <div className="bingoGrid bingoGrid--medium" style={{backgroundColor:`${colors.background}`}}>
          {card.map((row, r) =>
            row.map((cell, c) => (
    
              <div className="cell-wrapper" key={`${r}-${c}`}>
               {r===2&&c===2?(
                  <div className="cell free" style={{background: `linear-gradient(135deg, ${colors.center[0] || '#3a82f7'}, ${colors.center[1] || '#f73340'})`}}>2026</div>
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
                  style={{
                  border:`1px solid ${colors.lines}`,
                  color:`${colors.text}`,
                  
                }}
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