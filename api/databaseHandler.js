const { MongoClient, ServerApiVersion,ObjectId  } = require('mongodb');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB ;

let _client = null;
let _db = null;

async function connect() {
  if (_db) return _db;

  if (!_client) {
    _client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }

  await _client.connect();
  _db = _client.db(MONGODB_DB);
  return _db;
}

async function saveBingoBoard(boardId,boardData) {
  const db = await connect();

  
  const coll = db.collection('bingoBoards');
  const existing = await coll.findOne({ boardId });
  if (existing) {
    throw new Error('Board with this ID already exists');
  }
  const count = await coll.countDocuments({ 'boardData.owner': boardData.owner });

  if (count >= 10) {
    return "User limit reached";
  }

  const doc = {
    boardId,
    boardData,

    
  
  };

  const res = await coll.insertOne(doc);
  return res.insertedId;
}

async function editBingoBoard(boardId, ownerId, newBoardData) {
  const db = await connect();
  const coll = db.collection('bingoBoards');

  const current = await coll.findOne({ boardId, 'boardData.owner': ownerId });
  if (!current) return null;

  const updatedBoardData = {
    ...current,
    ...newBoardData,
    owner: ownerId,
    createdAt: current.boardData.createdAt || new Date(), // preserve or set if missing
  };

  const res = await coll.updateOne(
    { 
      boardId,
      'boardData.owner': ownerId
    },
    { 
   $set: {
        'boardData.card': newBoardData.card,
        'boardData.updatedAt': new Date(),
      },
    }
  );

  return res.modifiedCount > 0 ? boardId : null;
}

async function deleteCard(boardId, ownerId) {
  const db = await connect();
  const coll = db.collection('bingoBoards');
  const res = await coll.deleteOne(
    {
      boardId,
      'boardData.owner': ownerId
    }
  );
  return res.deletedCount > 0;
}
async function findUserBingoBoards(ownerQuery) {
  const db = await connect();
  const collection = db.collection('bingoBoards');
  const owner=ownerQuery.owner;
  const boards = await collection.find({'boardData.owner': owner}).toArray();
  return boards;
}
async function findRecentBingoBoards(limit) {
  const db = await connect();
  const boardsCollection = db.collection('bingoBoards');
  const usersCollection = db.collection('users');

  const boards = await boardsCollection
    .find()
    .sort({ "boardData.createdAt": -1 })
    .limit(limit)
    .toArray();

  const result = [];

  for (const board of boards) {
    let user = null;

    if (board.boardData?.owner) {
      user = await usersCollection.findOne({
        _id: new ObjectId(board.boardData.owner)
      });
    }

    result.push({
      boardData: board.boardData,
      _id:board.boardId,
      ownerData: {
        name: user?.name || 'Unknown',
        picture: user?.picture || null
      }
    });
  }

  return result;
}

async function findCardById(boardId,withOwner) {
  const db = await connect();
  if(withOwner){
    const card = await db.collection("bingoBoards").findOne({
      boardId: boardId,
    });
    if(!card){
      return null;
    }
    const userCollection = db.collection('users');
    const user = await userCollection.findOne({ _id: new ObjectId(card.boardData.owner) });
    
    const ownerInfo={
      name:user ? user.name : 'Unknown',
      profilePic:user ? user.picture: null,
    }
    return {...card,ownerInfo };
  }
  return db.collection("bingoBoards").findOne({
    boardId: boardId,
  });
}
async function findUserById(userId) {
  const db = await connect();
  return db.collection("users").findOne({
    _id: new ObjectId(userId),
  });
  
}
async function findUserByGoogleId(googleId) {
  const db = await connect();
  return db.collection('users').findOne({googleId });
}
async function findUserByTwitterId(twitterId) {
  const db = await connect();
  return db.collection('users').findOne({twitterId });
}

async function createUser(userData) {
  const db = await connect();

  // Required: at least one auth provider
  if (!userData.googleId && !userData.twitterId) {
    throw new Error("User data must contain at least one provider ID (googleId or twitterId)");
  }

  // Normalize / clean input (optional but recommended)
  const normalizedData = {
    ...userData,
    name: userData.name?.trim() || 'Anonymous',
    picture: userData.picture || null,
  
    
    isPremium: false,
    updatedAt: new Date(),
  };

  let existingUser = null;

  if (normalizedData.googleId) {
    existingUser = await findUserByGoogleId(normalizedData.googleId);
  }

  if (!existingUser && normalizedData.twitterId) {
    existingUser = await findUserByTwitterId(normalizedData.twitterId);
  }

 
  if (existingUser) {
    
    return existingUser._id;
  }

  // Create new user with defaults
  const result = await db.collection('users').insertOne(normalizedData);

  return result.insertedId;
}
async function findOrCreateUser(providerData) {
  const db = await connect();
  let user = null;

  // Try to find existing user by any provided provider ID
  if (providerData.googleId) {
    user = await findUserByGoogleId(providerData.googleId);
  }
  
  if (!user && providerData.twitterId) {
    user = await findUserByTwitterId(providerData.twitterId);
  }

  // If we found the user → return it (and optionally update profile info)
  if (user) {
    // Optional: Update name/picture if they changed
    const updates = {};
    if (providerData.name && providerData.name !== user.name) {
      updates.name = providerData.name;
    }
    if (providerData.picture && providerData.picture !== user.picture) {
      updates.picture = providerData.picture;
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { ...updates, updatedAt: new Date() } }
      );
      // Update local object too
      Object.assign(user, updates);
    }

    return user;
  }

  // No existing user → create new
  const newUserId = await createUser(providerData);
  return await findUserById(newUserId);
}
async function upgradeUser(userId, txId) {
  const db = await connect();

  // Input validation
  if (!userId || !txId) {
    throw new Error("Missing userId or transaction ID (txId)");
  }

  try {
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isPremium: true,
          updatedAt: new Date(),
          lastPremiumTx: txId          
        }
      }
    );

    // Return success/failure info
    console.log(result.modifiedCount);
    return {
      success: result.matchedCount === 1,       // at least the user exists
      updated: result.modifiedCount === 1,
   
    };
  } catch (error) {
    console.error("Error upgrading user:", error);
    throw error; 
  }
}

async function close() {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
}

module.exports = {
  connect,
  saveBingoBoard,
  findUserBingoBoards,
  findRecentBingoBoards,
  upgradeUser,
  findUserById,
  editBingoBoard,
  deleteCard,
  findUserByGoogleId,
  findUserByTwitterId,
  findOrCreateUser,
  findCardById,
  close
};
