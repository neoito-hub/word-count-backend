const config = {
  db: "mongodb://localhost/word_freq",
  port: 3000
};

// db stuff - start
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(config.db, {
  server: {
    socketOptions: {
      keepAlive: 1
    },
    useNewUrlParser: true
  }
});
mongoose.connection.on("connected", () => {
  console.log("[app]: connected to database - " + config.db);
});
mongoose.connection.on("error", err => {
  console.error(err);
  console.error("[app]: error in database connection on ", config.db);
});

const wordsModel = require("./models/words.model");
const usersModel = require("./models/users.model");
// db stuff - end

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

// local funcs
const funcs = require("./funcs");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
app.get("/ping", (req, res) => {
  res.json({ msg: "pong" });
});

app.post("/freq", async (req, res) => {
  try {
    const user = req.header("user_id");
    if (!user) {
      return res.status(403).json({
        msg: "User id not found in header!"
      });
    }

    let str = req.body.string;
    if (!str || str === "" || typeof str !== "string") {
      return res.status(400).json({
        msg: "String is empty or not found!"
      });
    }

    str = str.trim();
    str = str.toLowerCase();
    const currentStringFreq = funcs.wordFreq(str);
    const currentStringWords = Object.keys(currentStringFreq);

    const existingData = await wordsModel.find({
      user: user,
      word: {
        $in: currentStringWords
      }
    });
    const existingMap = funcs.makeMap(existingData);

    const existingWords = existingData.map(e => e.word);
    const newWords = currentStringWords.filter(w => !existingWords.includes(w));

    // do inserts on new
    const newDocs = newWords.map(nw => {
      return {
        user: user,
        word: nw,
        frequency: currentStringFreq[nw]
      };
    });
    const insertStatus = await wordsModel.insertMany(newDocs);

    // do updates on existing
    const updateStatement = {};
    // { word: 'is', $set: {frequency: old + 12}}
    existingWords.forEach(async w => {
      await wordsModel.update(
        {
          user: user,
          word: w
        },
        { $set: { frequency: existingMap[w] + currentStringFreq[w] } }
      );
    });

    const fetch = await wordsModel.find(
      {
        user: user,
        word: {
          $in: currentStringWords
        }
      },
      {},
      {
        sort: {
          word: 1
        }
      }
    );
    // const fetchMap = fetch.map(f => {
    //   return {
    //     word: f.word,
    //     frequency: f.frequency
    //   };
    // });
    const fetchMap = funcs.makeMap(fetch);

    // save history
    const userUpdate = await usersModel.update(
      {
        _id: user
      },
      {
        $set: {
          text: str,
          result: fetchMap
        }
      }
    );

    const usersWords = await wordsModel.find({user: user}, {user: 0, _id: 0})
    const usersWordsMap = funcs.makeMap(usersWords);

    return res.status(201).json(usersWordsMap);
  } catch (e) {
    console.log(e);
    return res.status(500).json({});
  }
});

// creates a new user
app.post("/user", async (req, res) => {
  const user = new usersModel();
  const save = await user.save();
  return res.status(201).json({
    _id: save._id
  });
});

app.get("/user", async (req, res) => {
  const user = req.header("user_id");
  if (!user) {
    return res.status(403).json({
      msg: "User id not found in header!"
    });
  }
  const userData = await usersModel.findById(user);
  return res.status(200).json(userData);
});

app.listen(config.port, () => {
  console.log(`[app] listening on: ${config.port}!`);
});
