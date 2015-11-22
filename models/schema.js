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
      if (candidatepw === userQuery[0].password) cb(null, true);
      else cb(null, false);
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
      this.populate(userQuery[0], {path: 'myRequests'}, function(err, result){
        if (err) console.log(err);
        else cb(null, result); //candidates and helpers not populated
      });
    }
  });
}

UserSchema.statics.getRequestsTaken = function(user, cb){
  this.find({ username: user }, function(err, userQuery){
    if (err) console.log(err);
    else if (userQuery.length == 0) cb({msg: "No such user!"});
    else if (userQuery.length > 1) cb({msg: "Multiple usernames exist!"});
    else {
      this.populate(userQuery[0], {path: 'requestsTaken'}, function(err, result){
        if (err) console.log(err);
        else cb(null, result); //candidates and helpers not populated
      })
    }
  });
}

UserSchema.statics.addRequest = function(user, requestId, cb){
  this.find({ username: user }, function(err, userQuery){
    if (err) console.log(err);
    else if (userQuery.length == 0) cb({msg: "No such user!"});
    else if (userQuery.length > 1) cb({msg: "Multiple usernames exist!"});
    else {
      this.update(userQuery[0],{$push: {'myRequests': requestId}},{upsert:true},function(err){
        if(err) console.log(err);
        else cb(null);
      });
    }
  });
}

UserSchema.statics.removeRequest = function(user, requestModel, requestId, cb){
  this.find({ username: user }, function(err, userQuery){
    if (err) console.log(err);
    else if (userQuery.length == 0) cb({msg: "No such user!"});
    else if (userQuery.length > 1) cb({msg: "Multiple usernames exist!"});
    else {
      this.update(userQuery[0],{$pull: {'myRequests': requestId}},{upsert:true},function(err){
        if(err) console.log(err);
        else {
          requestModel.removeRequest(requestId, function(err){
            if (err) console.log(err);
            else cb(null);
          });
        }
      });
    }
  });
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

RequestSchema.statics.getRequestById = function(requestId, cb){
  this.find({ _id: requestId }, function(err, requestQuery){
    if (err) console.log(err);
    else {
      this.populate(requestQuery, {path: 'creator'}, function(err, requestQuery){ //creator populated
        if (err) console.log(err);
        else {
          this.populate(requestQuery, {path: 'candidates'}, function(err, result){
            if (err) console.log(err);
            else {
              this.populate(result[0], {path: 'helpers'}, function(err, result){
                if(err) console.log(err);
                else cb(null, result[0]); //candidates and helpers populated
              });
            }
          });
        }
      });
    }
  });
}

RequestSchema.statics.getAllRequests = function(cb){
  this.find({}, function(err, requestQuery){
    if (err) console.log(err);
    else {
      this.populate(requestQuery, {path: 'creator'}, function(err, requestQuery){ //creator populated
        if (err) console.log(err);
        else {
          this.populate(requestQuery, {path: 'candidates'}, function(err, result){
            if (err) console.log(err);
            else {
              this.populate(result, {path: 'helpers'}, function(err, result){
                if(err) console.log(err);
                else cb(null, result); //candidates and helpers populated
              });
            }
          });
        }
      });
    }
  });
};

RequestSchema.statics.createRequest = function(userModel, user, requestData, cb){
  requestData.status = 'Open';
  requestData.candidates = [];
  requestData.helpers = [];
  this.create(requestData, function(err, request){
    if (err) console.log(err);
    else {
      userModel.addRequest(user, request, function(err){
        if (err) console.log(err);
        else cb(null);
      });
    }
  });
}

RequestSchema.statics.removeRequest = function(requestId, cb){
  this.remove({ _id: requestId }, function(err){
    if (err) console.log(err);
    else cb(null);
  });
}

RequestSchema.statics.addCandidate = function(requestId, candidate, cb){
  this.getRequestById(requestId, function(err, result){

  });
}

RequestSchema.statics.acceptCandidate = function(requestId, candidate, cb){

}

exports.User = mongoose.model('User', UserSchema);
exports.Request = mongoose.model('Request', RequestSchema);