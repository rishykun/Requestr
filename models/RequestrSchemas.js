var mongoose = require("mongoose");

// Category field might need to be changed - can a request be in more than one category?
var requestSchema = mongoose.Schema({
  _id: String,
  title: String,
  description: String,
  creator: String,
  expirationDate: Date,
  status: String,
  signedUpHelpers: String,
  category: String,
  tag: Array,
});

var userSchema = mongooose.Schema({
	username: String,
	password: String,
	requestIds: Array,
	requestsTaken: Array,
	dateCreated: Date,
	numRequestsCompleted: Number,
});

// Not necessary for MVP
var reviewSchema = mongoos.Schema({

});
// When we 'require' this model in another file (e.g. routes),
// we specify what we are importing form this file via module.exports.
// Here, we are 'exporting' the mongoose model object created from
// the specified schema.
module.exports = mongoose.model("requestsSchema", requestSchema);
