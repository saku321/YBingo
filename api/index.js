'use strict';
const express = require('express');
const app = express();
const cors = require('cors');
const { saveBingoBoard } = require('./databaseHandler');
const {nanoid}=require("nanoid");
app.use(cors());
app.use(express.json());

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