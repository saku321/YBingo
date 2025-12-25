'use strict';
const express = require('express');
const app = express();
const cors = require('cors');
const { saveBingoBoard } = require('./databaseHandler');
const {nanoid}=require("nanoid");
const { verify } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { verifyGoogleToken,requireAuth } = require('./authHandler');
const { findOrCreateUser,findUserById } = require('./databaseHandler');
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
  res.json(user);
});
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite:"strict",
    secure: process.env.NODE_ENV === 'production',
  });
  return res.status(200).json({ ok: true });
});

app.post('/api/createCard', async (req, res) => {
  try {
   
    const { card } = req.body;
    const owner= req.body.owner;
    if (!card) return res.status(400).json({ error: 'Missing card in request body' });
    const cardID=nanoid();
    const insertedId = await saveBingoBoard(cardID, {owner,card, createdAt: new Date() });
    return res.status(201).json({ ok: true, id: insertedId });
  } catch (err) {
    console.error('createCard error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3001, () => {
  console.log('server running on 3001 port');
});