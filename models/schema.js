var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//database model type for user collection
var UserSchema = mongooose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  myRequests: [{type: Schema.Types.ObjectId, ref:'Request'}],
  requestsTaken: [{type: Schema.Types.ObjectId, ref:'Request'}]
});

UserSchema.statics.verifyPassword = function(user, candidatepw, cb){
  this.find({username: user}, function(err, userQuery){
    if (err) console.log(err);
    else if (userQuery.length == 0) cb({msg: "No such user!"});
    else if (userQuery.length > 1) cb({msg: "Multiple usernames exist!"});
    else {
      if (candidatepw === userQuery[0].password) callback(null, true);
      else callback(null, false);
    }
    else cb({ msg : 'No such user!' });
  });
}

UserSchema.statics.createNewUser = function(user, password, cb){
  this.find({username: user}, function(err, userQuery){
    if (err) console.log(err);
    else if (userQuery.length == 0) {
      this.create({
        'username': user,
        'password': password,
        'myRequests': [],
        'requestsTaken': []
      },  function(err, res) {
        if (err) console.log(err);
      }));
      cb(null, false); //not taken
    }
    else cb(null, true); //taken
  });
}

UserSchema.statics.getUserRequests = function(user, cb) {
  this.find({ username: user }, function(err, userQuery){
    if (err) console.log(err);
    else if (userQuery.length == 0) cb({msg: "No such user!"});
    else if (userQuery.length > 1) cb({msg: "Multiple usernames exist!"});
    else {
      this.populate(userQuery[0], path)
    }
  });
};

UserSchema.statics.getRequestsTaken = function(user, cb){

}

// Category field might need to be changed - can a request be in more than one category?
var RequestSchema = mongoose.Schema({
  title: String,
  description: String,
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateCreated: Date
  expirationDate: Date,
  status: String,
  candidates: [{type: Schema.Types.ObjectId, ref:'User'}],
  helpers: [{type: Schema.Types.ObjectId, ref:'User'}]
  //category: String, //not for MVP
  //tag: [String], //not for MVP
});


exports.User = mongoose.model('User', UserSchema);
exports.Request = mongoose.model('Request', RequestSchema);