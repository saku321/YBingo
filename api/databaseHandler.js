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

async function editBingoBoard(boardId,ownerId, newBoardData) {
  const db = await connect();
  const coll = db.collection('bingoBoards');

  const updatedBoardData = {
    ...newBoardData,
    owner: ownerId,
  };

  const res = await coll.updateOne(
    { 
      boardId,                  // match by board ID
      'boardData.owner': ownerId // match by owner
    },
    { $set: { boardData: updatedBoardData, updatedAt: new Date() } }
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
async function findRecentBingoBoards(limit = 5) {
  const db = await connect();
  const collection = db.collection('bingoBoards');
  const boards = await collection.find().sort({ createdAt: -1 }).limit(limit).toArray();
  
  const creator = db.collection('users');
  for (let board of boards) {
    const user = await creator.findOne({ _id: new ObjectId(board.boardData.owner) });
    board.ownerName = user ? user.name : 'Unknown';
  }

  return boards;
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

async function createUser(userData) {
  const db = await connect();
  const checkExisting = await findUserByGoogleId(userData.googleId);
  if (checkExisting) {
    return checkExisting._id;
  }
  const res = await db.collection('users').insertOne(userData);
  return res.insertedId;
}
async function findOrCreateUser(userData) {
  let user = await findUserById(userData.userId);
  if (!user) {
    const result = await createUser(userData);
    user = await findUserById(result);
  }
  return user;
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
  findUserById,
  editBingoBoard,
  deleteCard,
findUserByGoogleId,
  findOrCreateUser,

  close
};
