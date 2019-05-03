const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  text: {
    type: String
  },
  result: {}
}, { versionKey: false });

module.exports = mongoose.model('user', UserSchema);