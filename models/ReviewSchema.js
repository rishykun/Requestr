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
    required: true,
    unique: true
  }
});

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
                  cb("Failed to create review.");
                } else {
                  cb(null);
                }
              });
            }
          });
        }
      });
    }
  });
};

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

ReviewSchema.statics.validReview = function (requestId, writerUsername, cb) {
  var that = this;

  User.getUser(writerUsername, function (err, writerObj) {
    if (err) {
      cb(err);
    } else {
      Request.getRequestById(requestId, function (err, requestObj) {
        if (err) {
          cb(err);
        } else {
          if (requestObj.creator == writerObj._id || requestObj.helpers.indexOf(writerObj._id) > -1) {
            that.find({"writer": writerObj._id, "request": requestObj._id}, function (err, result) {
              if (err) {
                cb(err);
              } else {
                if (result.length > 0) {
                  cb(null, false); // Invalid, review already exists
                } else {
                  cb(null, true); // Valid
                }
              }
            });
          } else {
            cb(null, false); // Invalid, writer not part of request
          }
        }
      });
    }
  });
};

module.exports = mongoose.model('Review', ReviewSchema);