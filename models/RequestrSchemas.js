var mongoose = require("mongoose");

//database model type for user collection
var userSchema = mongooose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  requestIds: [String],
  requestsTaken: [String],
  dateCreated: Date,
  numRequestsCompleted: Number,
});

// Category field might need to be changed - can a request be in more than one category?
var requestSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  description: String,
  creator: {
    type: String,
    required: true
  },
  expirationDate: Date,
  status: String,
  signedUpHelpers: [String],
  //category: String, //not for MVP
  //tag: [String], //not for MVP
});

// Not necessary for MVP
var reviewSchema = mongoose.Schema({

});
// When we 'require' this model in another file (e.g. routes),
// we specify what we are importing form this file via module.exports.
// Here, we are 'exporting' the mongoose model object created from
// the specified schema.
module.exports = mongoose.model("requestsSchema", requestSchema);
