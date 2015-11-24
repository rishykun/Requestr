var mongoose = require("mongoose");
var Schema = mongoose.Schema;

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
  tags: [String],
  comments: [{
    user: {type: Schema.Types.ObjectId, ref:'User'},
    comment: String,
    dateCreated: Date
  }]
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
              if (err) cb({err: "Failed to populate helpers"});
              else {
                that.populate(result, {path: 'comments.user'}, function (err, result) {
                  if (err) cb({err: "Failed to populate comment users"});
                  else cb(null, result);
                });
              }
            });
          }
        });
      }
    });
  }
};

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
  requestData.comments = [];
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
        cb(err);
      }
        else {
          that.update(result, {$pull: {'candidates': userObj._id}, $push: {'helpers': userObj._id}}, {upsert: true}, function(err){
            if (err) {
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
};

//Adds a comment to a request
RequestSchema.statics.addComment = function(requestId, userModel, user, commentString, cb) {
  var that = this;

  userModel.getUser(user.username, function(err, userObj) {
    if (err) {
      cb(err);
    } else {
      that.getRequestById(requestId, function (err, data) {
        if (err) {
          cb(err);
        } else {
          var currentDate = new Date();
          that.update({"_id": requestId}, {$push: {'comments': {user: userObj._id, comment: commentString, dateCreated: currentDate}}}, {upsert: true}, function (err) {
            if (err) {
              cb({err: "Failed to add comment"});
            } else {
              cb(null);
            }
          });
        }
      });
    }
  });
};

exports.Request = mongoose.model('Request', RequestSchema);