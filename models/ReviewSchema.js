var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var User = require("./schema").User;
var Request = require("./schema").Request;

var ReviewSchema = mongoose.Schema({
  writer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  victim: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  request: {
    type: Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  }
});

//Adds a review of a victimUsername
//  -text: written review
//  -rating: 1,2,3,4,5 (higher the better)
ReviewSchema.statics.addReview = function (writerUsername, victimUsername, text, rating, requestId, cb) {
  var that = this;

  User.getUser(writerUsername, function (err, writerObj) {
    if (err) {
      cb(err);
    } else {
      User.getUser(victimUsername, function (err, victimObj) {
        if (err) {
          cb(err);
        } else {
          that.validReview(requestId, writerObj.username, victimObj.username, function (err, isValid) {
            if (err) {
              cb(err);
            } else {
              if (isValid) {
                Request.getRequestById(requestId, function (err, requestObj) {
                  if (err) {
                    cb(err);
                  } else {
                    that.create({
                      'writer': writerObj._id,
                      'victim': victimObj._id,
                      'text': text,
                      'rating': rating,
                      'request': requestObj._id
                    }, function (err, res) {
                      if (err) {
                        cb(err);
                      } else {
                        cb(null);
                      }
                    });
                  }
                });
              } else {
                cb({err: "Invalid review."});
              }
            }
          });
        }
      });
    }
  });
};

//Removes a review
ReviewSchema.statics.removeReview = function(reviewId, cb){
  var that = this;
  that.remove({ _id: reviewId }, function(err){
    if (err) cb({err: "Failed to remove request"});
    else cb(null);
  });
}

//Gets the review of victimUsername
ReviewSchema.statics.getReviewsByVictimId = function (victimUsername, cb) {
  var that = this;

  User.getUser(victimUsername, function (err, victimObj) {
    if (err) {
      cb(err);
    } else {
      that.find({"victim": victimObj}).populate("writer").populate("victim").populate("request").exec(function (err, reviewQuery) {
        if (err) {
          cb(err);
        } else {
          cb(null, reviewQuery);
        }
      });
    }
  });
};

// Checks whether the specified writer can submit a review for the specified victim for the specified request.
// Each writer gets one review per other involved individual per request.
ReviewSchema.statics.validReview = function (requestId, writerUsername, victimUsername, cb) {
  var that = this;

  User.getUser(writerUsername, function (err, writerObj) {
    if (err) {
      cb(err);
    } else {
      User.getUser(victimUsername, function (err, victimObj) {
        if (err) {
          cb(err);
        } else {
          Request.getRequestById(requestId, function (err, requestObj) {
            if (err) {
              cb(err);
            } else {
              var helperNames = requestObj.helpers.map(function (helper) {return helper.username;});
              if (requestObj.creator.username === writerObj.username || helperNames.indexOf(writerObj.username) > -1) {
                that.find({"writer": writerObj._id, "victim": victimObj._id, "request": requestObj._id}, function (err, result) {
                  if (err) {
                    cb(err);
                  } else {
                    if (result.length > 0) {
                      console.log("false 1");
                      cb(null, false); // Invalid, review already exists
                    } else {
                      cb(null, true); // Valid
                    }
                  }
                });
              } else {
                console.log("false 2");
                cb(null, false); // Invalid, writer not part of request
              }
            }
          });
        }
      });
    }
  });
};

module.exports = mongoose.model('Review', ReviewSchema);