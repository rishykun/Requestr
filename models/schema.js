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
  reward: String,
  candidates: [{type: Schema.Types.ObjectId, ref:'User'}],
  helpers: [{type: Schema.Types.ObjectId, ref:'User'}],
  tags: [String]
});

//Callback on the request query after population
RequestSchema.statics.populateRequests = function(err, requestQuery, cb){
  if (err) cb({err: "Failed to query request"});
  else {
    var that = this;
    that.populate(requestQuery, {path: 'creator'}, function(err, requestQuery){
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
}

//Callback on all created requests
RequestSchema.statics.getAllRequests = function(cb){
  var that = this;
  that.find({}, function(err, requestQuery){
    that.populateRequests(err, requestQuery, cb);
  });
};

//Callback on request with corresponding requestId
RequestSchema.statics.getRequestById = function(requestId, cb){
  var that = this;
  that.find({ _id: requestId }, function(err, requestQuery){
    that.populateRequests(err, requestQuery, function(err, result){
      if (err) cb(err);
      else if (result.length == 0) cb({err: "No request with id"});
      else if (result.length > 1) cb({err: "Multiple requests with id"});
      else cb(null, result[0]);
    });
  });
}

//Callback on all requests with corresponding status
RequestSchema.statics.getRequestsByStatus = function(status, cb){
  if (status !== "Open" || status !== "In progress" || status !== "Completed"){
    cb({err: "Invalid status"});
  }
  else {
    var that = this;
    that.find({"status": status}, function(err, requestQuery){
      that.populateRequests(err, requestQuery, cb);
    });    
  }
}

//Callback on all requests which have at least one tag in tagQuery
RequestSchema.statics.getRequestsByTags = function(tagQuery, cb){
  var that = this;
  if (tagQuery.length == 0) that.getAllRequests(cb);
  else {
    that.find({tags: {$in: tagQuery}}, function(err, requestQuery){
      that.populateRequests(err, requestQuery, cb);
    });
  }
}

//Callback on requests with corresponding status and at least one tag in tagQuery
RequestSchema.statics.getRequestByFilter = function(status, tagQuery, cb){
  var that = this;
  if (status === null) that.getRequestsByTags(tagQuery,cb);
  else if (status !== "Open" || status !== "In progress" || status !== "Completed"){
    cb({err: "Invalid status"});
  }
  else if (tag.length == 0) that.getRequestsByStatus(status, cb);
  else {
    that.find({"status": status, "tags": {$in: tagQuery}}, function(err, requestQuery){
      that.populateRequests(err, requestQuery, cb);
    });    
  }
}

//Creates a new request and adds it to the corresponding user in userModel
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

//Removes a request
RequestSchema.statics.removeRequest = function(requestId, cb){
  var that = this;
  that.remove({ _id: requestId }, function(err){
    if (err) cb({err: "Failed to remove request"});
    else cb(null);
  });
}

//Changes the request from Open to In porgress
RequestSchema.statics.startRequest = function(requestId, cb){
  var that = this;
  that.getRequestById(requestId, function(err, request){
    if (err) cb(err);
    else if (request.status !== "Open") cb({err: "Request is not open!"});
    else {
      that.update(request, {status: 'In progress', $set: {'candidates': []}}, {upsert: true}, function(err){
        if (err) cb({err: "Failed to start request"});
        else cb(null);
      });
    }
  })
}

//Changes the request from In progress to completed
RequestSchema.statics.completeRequest = function(requestId, cb){
  var that = this;
  that.getRequestById(requestId, function(err, request){
    if (err) cb(err);
    else if (request.status !== "In progress") cb({err: "Request is not in progress!"});
    else {
      that.update(request, {status: 'Completed'}, {upsert: true}, function(err){
        if (err) cb({err: "Failed to complete request"});
        else cb(null);
      });
    }
  })
}

//Adds a candidate to a request
RequestSchema.statics.addCandidate = function(requestId, userModel, candidate, cb){
  var that = this;

  userModel.getUser(candidate, function(err, candidate){
    if (err) cb(err);
    else {
      that.getRequestById(requestId, function(err, result){
        if (err) cb(err);
        else {

          that.update(result, {$push: {'candidates': candidate._id}}, {upsert: true}, function(err){
            if (err) cb({err: "Failed to add candidate"});
            else cb(null);
          });
        }
      });
    }
  });
}

//Accepts a candidate, changing them to a helper
RequestSchema.statics.acceptCandidate = function(requestId, userModel, candidate, cb){
  var that = this;

  userModel.getUser(candidate, function(err, userObj){
    if (err) {
      cb(err);
    }
    else {
      that.getRequestById(requestId, function(err, result){
        if (err) {
        console.error(err);
        cb(err);
      }
        else {
          that.update(result, {$pull: {'candidates': userObj._id}, $push: {'helpers': userObj._id}}, {upsert: true}, function(err){
            if (err) {
              console.error(err);
              cb({err: "Failed to accept candidate"});
            }
            else {
              cb(null);
            }
          });
        }
      });
    }
  });
}

exports.User = mongoose.model('User', UserSchema);
exports.Request = mongoose.model('Request', RequestSchema);