var mongoose = require("mongoose");
var Schema = mongoose.Schema;

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

//Callback on query entry for a username
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

//callback on true if candidatepw matches user pw else false
UserSchema.statics.verifyPassword = function(user, candidatepw, cb){
  var that = this;

  that.getUser(user, function(err, user) {
    if (err) cb(err);
    else if (candidatepw === user.password) cb(null, true);
    else cb(null, false);
  });
}

//creates a user in the model if username doesn't already exists (callbacks on false)
//else callbacks on true if the username is taken
UserSchema.statics.createNewUser = function(user, password, cb){
  var that = this;
  that.getUser(user, function(err, userQuery){
    if (err){
      if (err.msg === "No such user!"){
        that.create({
          'username': user,
          'password': password,
          'myRequests': [],
          'requestsTaken': []
        },  function(err, res) {
          if (err) cb({err: "Failed to create user"});
          else cb(null, false); //not taken
        });
      }
      else cb(err);
    }
    else {
          cb(null, true); //taken
        }
    });
}

//Callback on query entry for a user after population
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
              that.populate(result, {path: 'myRequests.helpers', model: 'User'}, function(err, result){
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

//Callback on requests by a user with the corresponding status
UserSchema.statics.getRequestsByStatus = function(user, status, cb){
  if (status !== "Open" || status !== "In progress" || status !== "Completed"){
    cb({err: "Invalid status"});
  }
  else {
    this.getUserData(user, function(err, user){
      if (err) cb(err);
      else {
        filteredRquests = user.requests.filter(function(el){
          return el.status === status;
        });
        cb(null, filteredRquests);
      }
    });
  }
}

//Adds a request with the corresponding requestId to the user
UserSchema.statics.addRequest = function(user, requestId, cb){
  var that = this;
  that.getUser(user, function(err, user){
    if (err) cb(err);
    else {
      that.update(user,{$push: {'myRequests': requestId}},{upsert:true},function(err){
        if (err) cb({err: "Failed to add user request"});
        else cb(null);
      });
    }
  });
}

//Removes a request with the corresponding requestId to the user
UserSchema.statics.removeRequest = function(user, requestModel, requestId, cb){
  var that = this;
  that.getUser(user, function(err, user){
    if (err) cb(err);
    else {
      that.update(user,{$pull: {'myRequests': requestId}},{upsert:true},function(err){
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

exports.User = mongoose.model('User', UserSchema);