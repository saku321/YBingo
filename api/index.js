'use strict';
const express = require('express');
const app = express();
const cors = require('cors');
const {nanoid}=require("nanoid");
const { verify } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { verifyGoogleToken,requireAuth } = require('./authHandler');
const { findOrCreateUser,findUserById,findUserBingoBoards,findRecentBingoBoards,saveBingoBoard,editBingoBoard,deleteCard,findCardById} = require('./databaseHandler');
const cookieParser = require('cookie-parser');
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const userData = await verifyGoogleToken(token);

     const user = await findOrCreateUser({
      googleId: userData.googleId,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
    });

    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('auth_token', appToken, {
      httpOnly: true,
      sameSite:"strict",
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    const filterData={
      _id:user._id,
      email:user.email,
      name:user.name,
      picture:user.picture
    };


    return res.status(200).json({ user: filterData });
  } catch (err) {
    console.error('login error', err);
   return res.status(401).json({ error: 'Invalid Google token' });

  }
});
app.post("/api/auth/checkLogin", requireAuth, async (req, res) => {
  const user = await findUserById(req.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const filterData={
    
    name:user.name,
    picture:user.picture
  }
  
  res.json(filterData);
});
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite:"strict",
    secure: process.env.NODE_ENV === 'production',
  });
  return res.status(200).json({ ok: true });
});

app.post('/api/createCard',requireAuth, async (req, res) => {
  try {
   
    const { card } = req.body;
    const owner= req.userId;
    if (!card) return res.status(400).json({ error: 'Missing card in request body' });
    const cardID=nanoid(7);
    const insertedId = await saveBingoBoard(cardID, {owner,card, createdAt: new Date() });
    return res.status(201).json({ ok: true, id: insertedId });
  } catch (err) {
    console.error('createCard error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/yourCards', requireAuth, async (req, res) => {
  try {
    const owner = req.userId;
    const boards = await findUserBingoBoards({ owner });
    const formattedBoards = boards.map((board, idx) => ({
      ...board,
      _id: idx,
      boardData: {
        ...board.boardData,
        createdAt: board.boardData.createdAt ? new Date(board.boardData.createdAt).toLocaleDateString() : 'Unknown',
     
      },
      updatedAt: board.updatedAt ? new Date(board.updatedAt).toLocaleDateString() : 'Unknown',
    }));

    return res.status(200).json({ boards: formattedBoards });
  } catch (err) {
    console.error('yourCards error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/editCard', requireAuth, async (req, res) => { 
  try {
    const { boardId, newData } = req.body;
    const owner = req.userId;
    if (!boardId || !newData) {
      return res.status(400).json({ error: 'Missing cardId or newCard in request body' });
    }

    const updatedId = await editBingoBoard(boardId, owner, { card: newData });

    if (!updatedId) {
      return res.status(404).json({ error: "Card not found or you're not the owner" });
    }

    return res.status(200).json({ ok: true, id: updatedId });
  }
  catch (err) {
    console.error('editCard error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/deleteCards', requireAuth, async (req, res) => {
  try {
    const { boardIds } = req.body;  
    const owner = req.userId;
    if (!boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid boardIds in request body' });
    }
    let deletedCount = 0;
    for (const boardId of boardIds) {
      const success = await deleteCard(boardId, owner);
      if (success) {
        deletedCount++;
      }
    }
    return res.status(200).json({ ok: true, deletedCount });
  } catch (err) {
    console.error('deleteCards error', err);
    return res.status(500).json({ error: 'Internal server error' });

  }
});

app.get('/api/card/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;


    const board = await findCardById(cardId,true);
    if (!board) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    const filterData={
      boardId:board.boardId,
      boardData:{
      ...board.boardData,
      owner: board.ownerInfo,
      },
      createdAt:board.boardData.createdAt,
    }

  
    // Optionally, remove sensitive info like owner email/ID if you want
    return res.status(200).json({ filterData});
  } catch (err) {
    console.error('getCard error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/recentCards", async (req, res) => {
  try {
    const boards = await findRecentBingoBoards(5);

      const formattedBoards = boards.map((board) => ({
      boardData: {
           _id:board._id,
        ...board.boardData,
        owner: board.ownerData.name,
        ownerPicture: board.ownerData.picture,
        createdAt: board.boardData.createdAt
     
          ? new Date(board.boardData.createdAt).toLocaleDateString()
          : 'Unknown',
      },
    }));
    
    return res.status(200).json({ boards: formattedBoards });
  } catch (err) {
    console.error('recentCards error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(3001, () => {
  console.log('server running on 3001 port');
});