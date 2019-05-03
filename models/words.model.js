const mongoose = require('mongoose');

const LetterSchema = new mongoose.Schema({
  user: {
    type: String,
  },
  word: {
    type: String,
    required: true,
  },
  frequency: {
    type: Number
  }
}, { versionKey: false });

module.exports = mongoose.model('word', LetterSchema);