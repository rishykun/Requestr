var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//database model type for user collection
var UserSchema = mongoose.Schema({
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

UserSchema.statics.getUser = function(user, cb){
  var that = this;
  that.find({ username: user }, function(err, userQuery){
    if (err) {
      cb({err: "Failed to query user"});
    }
    else if (userQuery.length == 0) {
      cb({msg: "No such user!"});
    }
    else if (userQuery.length > 1) {
      cb({msg: "Multiple usernames exist!"});
    }
    else {
      cb(null, userQuery[0]);
    }
  });
}

UserSchema.statics.verifyPassword = function(user, candidatepw, cb){
  var that = this;
  that.getUser(user, function(err, user){
    if (err) cb(err);
    else if (candidatepw === user.password) cb(null, true);
    else cb(null, false);
  });
}

UserSchema.statics.createNewUser = function(user, password, cb){
  var that = this;
  that.getUser(user, function(err, user){
    if (err) {
      if (err.msg && err.msg === "No such user!"){
        cb(null, true);//taken;
      }
      else cb(err);
    }
    else {
      that.create({
        'username': user.username,
        'password': password,
        'myRequests': [],
        'requestsTaken': []
      },  function(err, res) {
        if (err) cb({err: "Failed to create user"});
        else cb(null, false); //not taken
      });
    }
  });
}

UserSchema.statics.getUserData = function(user, cb){
  var that = this;
  that.getUser(user, function(err, user){
   if (err) cb({err: "Failed to query user"});
   that.populate(user, {path: 'myRequests'}, function(err, result){
    if (err) cb({err: "Failed to populate user requests"});
    else {
      that.populate(result, {path: 'requestsTaken'}, function(err, result){
        if (err) cb({err: "Failed to populate requests"});
        else {
          that.populate(result, {path: 'myRequests.candidates', model: 'User'}, function(err, result){
            if (err) cb({err: "Failed to populate candidates"});
            else {
              that.populate(result, {path: 'myRquests.helpers', model'User'}, function(err, result){
                if (err) cb({err: "Failed to populate helpers"});
                else cb(null, result);
              });
            }
          });
        } 
      });
    } 
  });
 });
}

// UserSchema.statics.getUserRequests = function(user, cb) {
//   var that = this;
//   that.find({ username: user }, function(err, userQuery){
//     if (err) cb(err);
//     else if (userQuery.length == 0) cb({msg: "No such user!"});
//     else if (userQuery.length > 1) cb({msg: "Multiple usernames exist!"});
//     else {
//       that.populate(userQuery[0], {path: 'myRequests'}, function(err, result){
//         if (err) cb(err);
//         else cb(null, result); //candidates and helpers not populated
//       });
//     }
//   });
// }

// UserSchema.statics.getRequestsTaken = function(user, cb){
//   var that = this;
//   that.find({ username: user }, function(err, userQuery){
//     if (err) cb(err);
//     else if (userQuery.length == 0) cb({msg: "No such user!"});
//     else if (userQuery.length > 1) cb({msg: "Multiple usernames exist!"});
//     else {
//       that.populate(userQuery[0], {path: 'requestsTaken'}, function(err, result){
//         if (err) cb(err);
//         else cb(null, result); //candidates and helpers not populated
//       });
//     }
//   });
// }

UserSchema.statics.addRequest = function(user, requestId, cb){
  var that = this;
  that.getUser(user, function(err, user){
    if (err) cb(err);
    else {
      that.update(userQuery[0],{$push: {'myRequests': requestId}},{upsert:true},function(err){
        if (err) cb({err: "Failed to add user request"});
        else cb(null);
      });
    }
  });
}

UserSchema.statics.removeRequest = function(user, requestModel, requestId, cb){
  var that = this;
  that.getUser(user, function(err, user){
    if (err) cb(err);
    else {
      that.update(userQuery[0],{$pull: {'myRequests': requestId}},{upsert:true},function(err){
        if(err) cb({err: "Failed to remove user request"});
        else {
          requestModel.removeRequest(requestId, function(err){
            if (err) cb(err);
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
  dateCreated: Date,
  expirationDate: Date,
  status: String,
  candidates: [{type: Schema.Types.ObjectId, ref:'User'}],
  helpers: [{type: Schema.Types.ObjectId, ref:'User'}]
  //category: String, //not for MVP
  //tag: [String], //not for MVP
});

RequestSchema.statics.getRequestById = function(requestId, cb){
  var that = this;
  that.find({ _id: requestId }, function(err, requestQuery){
    if (err) cb({err: "Failed to query request"});
    else {
      that.populate(requestQuery, {path: 'creator'}, function(err, requestQuery){ //creator populated
        if (err) cb({err: "Failed to populate creators"});
        else {
          that.populate(requestQuery, {path: 'candidates'}, function(err, result){
            if (err) cb({err: "Failed to populate candidates"});
            else {
              that.populate(result[0], {path: 'helpers'}, function(err, result){
                if(err) cb({err: "Failed to populate helpers"});
                else cb(null, result[0]);
              });
            }
          });
        }
      });
    }
  });
}

RequestSchema.statics.getAllRequests = function(cb){
  var that = this;
  that.find({}, function(err, requestQuery){
    if (err) cb({err: "Failed to query request"});
    else {
      that.populate(requestQuery, {path: 'creator'}, function(err, requestQuery){ //creator populated
        if (err) cb({err: "Failed to populate creators"});
        else {
          that.populate(requestQuery, {path: 'candidates'}, function(err, result){
            if (err) cb({err: "Failed to populate candidates"});
            else {
              that.populate(result, {path: 'helpers'}, function(err, result){
                if(err) cb({err: "Failed to populate helpers"});
                else cb(null, result);
              });
            }
          });
        }
      });
    }
  });
};

RequestSchema.statics.createRequest = function(userModel, user, requestData, cb){
  var that = this;
  requestData.status = 'Open';
  requestData.candidates = [];
  requestData.helpers = [];
  userModel.getUser(user, function(err, user){
    if (err) cb(err);
    else {
      requestData.creator = user;
      that.create(requestData, function(err, request){
        if (err) cb({err: "Failed to create request"});
        else {
          userModel.addRequest(user.username, request, function(err){
            if (err) cb(err);
            else cb(null);
          });
        }
      });
    }
  });
}

RequestSchema.statics.removeRequest = function(requestId, cb){
  var that = this;
  that.remove({ _id: requestId }, function(err){
    if (err) cb({err: "Failed to remove request"});
    else cb(null);
  });
}

RequestSchema.statics.addCandidate = function(requestId, userModel, candidate, cb){
  var that = this;
  userModel.getUser(candidate, function(err, candidate){
    if (err) cb(err);
    else {
      that.getRequestById(requestId, function(err, result){
        if (err) cb(err);
        else {
          that.update(result, {$push: {'candidates': candidate}}, {upsert: true}, function(err){
            if (err) cb({err: "Failed to add candidate"});
            else cb(null);
          });
        }
      });
    }
  });
}

RequestSchema.statics.acceptCandidate = function(requestId, candidate, cb){
  var that = this;
  userModel.getUser(candidate, function(err, candidate){
    if (err) cb(err);
    else {
      that.getRequestById(requestId, function(err, result){
        if (err) cb(err);
        else {
          that.update(result, {$pull: {'candidates': candidate}, $push: {'helpers': candidate}}, {upsert: true}, function(err){
            if (err) cb({err: "Failed to accept candidate"});
            else cb(null);
          });
        }
      });
    }
  });
}

exports.User = mongoose.model('User', UserSchema);
exports.Request = mongoose.model('Request', RequestSchema);