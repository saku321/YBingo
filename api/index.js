  'use strict';
  const express = require('express');
  const app = express();
  const cors = require('cors');
  const {nanoid}=require("nanoid");
  const { verify } = require('node:crypto');
  const jwt = require('jsonwebtoken');
  const { verifyGoogleToken,requireAuth } = require('./authHandler');
  const { findOrCreateUser,findUserById,findUserBingoBoards,findRecentBingoBoards,saveBingoBoard,editBingoBoard,deleteCard,findCardById,upgradeUser} = require('./databaseHandler');
  const cookieParser = require('cookie-parser');
  const session = require('express-session');
  const passport = require('passport');
  const { Strategy: TwitterStrategy } = require('@superfaceai/passport-twitter-oauth2');
const { Client, Environment, orders } = require('@paypal/paypal-server-sdk');

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
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
      cookie: {
      sameSite: 'lax', // ✅ REQUIRED for OAuth
      secure: false,   // localhost only (true in prod)
      httpOnly: true,     // Keep this for security
      maxAge: 24 * 60 * 60 * 1000 // Optional: 1 day
    
    }
  }));


// Your client setup (looks good, but use the new Client)
const paypalClient = new Client({
  environment: process.env.PAYPAL_ENV === 'live'
    ? Environment.Live
    : Environment.Sandbox,
  clientCredentials: {
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_SECRET,
  },
});
let cachedAccessToken = null;
let tokenExpiry = 0;

async function getPayPalAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiry) {
    return cachedAccessToken;
  }
  const auth = Buffer.from(
    `${process.env.REACT_APP_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const response = await fetch(
    process.env.PAYPAL_ENV === 'live'
      ? 'https://api-m.paypal.com/v1/oauth2/token'
      : 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = now + (data.expires_in * 1000) - 60000; // refresh 1 min early

  return cachedAccessToken;
}
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user._id); // or user._id
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await findUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  passport.use(new TwitterStrategy({
    
    clientID: process.env.TWITTER_CLIENTID,
    clientSecret: process.env.TWITTER_CLIENTSECRET, 
    callbackURL: 'http://localhost:3001/auth/twitter/callback', // match exactly what you put in X dev portal
    clientType: 'confidential', 
    pkce: true,                 // required by X
    state: true,            
  },async (accessToken, refreshToken, profile, done) => {
  

    try {
      // profile contains: id, username, name, profile_image_url, etc.
    
      const user = await findOrCreateUser({
        twitterId: profile.id,
        name: profile.username || profile.name || profile.displayName,
      picture: profile._json?.profile_image_url_https 
        || profile.photos?.[0]?.value 
        || null,
      
      });

      // You can store access/refresh tokens if you plan to make API calls later
      // user.twitterAccessToken = accessToken;
      // user.twitterRefreshToken = refreshToken;

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  app.get('/auth/twitter',
    passport.authenticate('twitter', {
      scope: ['users.read', 'tweet.read', 'offline.access']
    })
  );

  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      failureRedirect: 'http://localhost:3000/login?error=twitter_failed',
      // successRedirect: 'http://localhost:3000/dashboard' // ← you can use this OR...
    }),
    (req, res) => {

      const appToken = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('auth_token', appToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect('http://localhost:3000/');
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
    
    if (!req.authenticated) {
      return res.json({ authenticated: false });
    }

    const filterData={
      
      name:user.name,
      picture:user.picture,
      auth:true,
      isPremium:!!user.isPremium,
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
      const cardColors = req.body.colors;
      if (!card) return res.status(400).json({ error: 'Missing card in request body' });
      const cardID=nanoid(7);
      const insertedId = await saveBingoBoard(cardID, {owner,card,cardColors, createdAt: new Date() });
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
    const { boardId, newData, cardColors } = req.body;
    const owner = req.userId;

    if (!boardId || !newData) {
      return res.status(400).json({ error: 'Missing boardId or newData' });
    }

    // Build update object
    const updateFields = { card: newData };

    // Only update cardColors if it was explicitly sent
    if (cardColors) {
      updateFields.cardColors = cardColors;
    }

    const updatedId = await editBingoBoard(boardId, owner, updateFields);

    if (!updatedId) {
      return res.status(404).json({ error: "Card not found or you're not the owner" });
    }

    return res.status(200).json({ ok: true, id: updatedId });
  } catch (err) {
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
app.post('/api/paypal/createOrder', requireAuth, async (req, res) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const apiBase = process.env.PAYPAL_ENV === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation', // get full object back
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: '3.49',
            },
            description: 'Premium Access - Custom Bingo Cards',
          },
        ],
        application_context: {
          brand_name: 'YearlyBingos',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Create order failed');
    }

    const order = await response.json();
    res.json({ id: order.id });
  } catch (err) {
    console.error('PayPal create error:', err);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

app.post('/api/paypal/captureOrder', requireAuth, async (req, res) => {
  const { orderID } = req.body;
  if (!orderID) return res.status(400).json({ error: 'Missing orderID' });

  try {
    const accessToken = await getPayPalAccessToken();

    const apiBase = process.env.PAYPAL_ENV === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${apiBase}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
      body: '{}', // empty body for capture
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Capture failed');
    }

    const order = await response.json();

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment not completed', status: order.status });
    }

    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture || capture.amount.value !== '3.49' || capture.amount.currency_code !== 'USD') {
      return res.status(400).json({ error: 'Invalid payment amount/currency' });
    }

    // TODO: Upgrade user in DB here
    const upgradeResult = await upgradeUser(req.userId,capture.id);
    if (upgradeResult.matchedCount === 0) {
      console.error(`User not found during premium upgrade `);
      return res.status(500).json({ error: "User not found - contact support" });
    }

    if (!upgradeResult.updated) {
      console.log(`User has already premium`);
    }
    res.json({
      success: true,
      transactionId: capture.id,
      amount: capture.amount.value,
      message: upgradeResult.updated ? "Premium activated!" : "Premium already active"
    });
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: 'Capture failed' });
  }
});





  app.listen(3001, () => {
    console.log('server running on 3001 port');
  });