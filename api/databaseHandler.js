const { MongoClient, ServerApiVersion } = require('mongodb');
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
//joku validaatio tähä
  const db = await connect();
  const coll = db.collection('bingoBoards');

  const doc = {
    boardId,
    boardData,
    createdAt: new Date()
  };

  const res = await coll.insertOne(doc);
  return res.insertedId;
}


async function getBingoBoards(query = {}) {
  const db = await connect();
  return db.collection('bingoBoards').find(query).toArray();
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
  getBingoBoards,
  close
};
