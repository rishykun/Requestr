var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var passwordHasher = require("password-hash-and-salt");

/*
	We currently have both schemas in the same file because of their circular dependency. In the future, we will figure out how to separate the schemas into two separate files
*/
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
	email: {
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

//Callback on query entry for a username
UserSchema.statics.getAllUsers = function(cb){
	var that = this;

	that.find({}, function(err, userQuery){
		if (err) {
			cb({err: "Failed to query user"});
		}
		else {
			cb(null, userQuery);
		}
	});
}

//callback on true if candidatepw matches user pw else false
UserSchema.statics.verifyPassword = function(user, candidatepw, cb){
	var that = this;

	that.getUser(user, function(err, user) {
		if (err) {
			cb(err);
		}
		else {
			passwordHasher(candidatepw).verifyAgainst(user.password, function(error, verified) {
				if (error) {
					cb(error);
				}
				else {
					if (!verified) {
						cb(null, false);
					} else {
						cb(null, true); //successful authentication
					}
				}
			});
		}
	});
}

//creates a user in the model if username doesn't already exists (callbacks on false)
//else callbacks on true if the username is taken
UserSchema.statics.createNewUser = function(user, password, email, cb){
	var that = this;
	that.getUser(user, function(err, userQuery){
		if (err){
			if (err.msg === "No such user!"){

				passwordHasher(password).hash(function(error, hash) {
					if (error) {
						utils.sendErrResponse(res, 500, 'An unknown error has occurred.');
					}

					that.create({
						'username': user,
						'password': hash,
						'email': email,
						'myRequests': [],
						'requestsTaken': []
					},  function(err, res) {

						if (err) cb({err: "Failed to create user"});
						else cb(null, false); //not taken
					});
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
				if (err) cb({err: "Failed to populate requests taken"});
				else {
					that.populate(result, {path: 'requestsTaken.creator', model: 'User'}, function(err, result){
						if (err) cb({err: "Failed to populate creator"});
						else {
							that.populate(result, {path: 'requestsTaken.candidates', model: 'User'}, function(err, result){
								if (err) cb({err: "Failed to populate candidates"});
								else {
									that.populate(result, {path: 'requestsTaken.helpers', model: 'User'}, function(err, result){
										if (err) cb({err: "Failed to populate helpers"});
										else {
											that.populate(result, {path: 'requestsTaken.unpaidUsers', model: 'User'}, function(err, result){
												if (err) cb({err: "Failed to populate unpaid users"});
												else {
													that.populate(result, {path: 'myRequests.creator', model: 'User'}, function(err, result){
														if (err) cb({err: "Failed to populate creator"});
														else {
															that.populate(result, {path: 'myRequests.candidates', model: 'User'}, function(err, result){
																if (err) cb({err: "Failed to populate candidates"});
																else {
																	that.populate(result, {path: 'myRequests.helpers', model: 'User'}, function(err, result){
																		if (err) cb({err: "Failed to populate helpers"});
																		else {
																			that.populate(result, {path: 'myRequests.unpaidUsers', model: 'User'}, function(err, result){
																				if (err) cb({err: "Failed to populate unpaid users"});
																				else cb(null, result);
																			})
																		}
																	});
																}
															});
														}
													});
												}
											})
										}
									});
								}
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
	if (status !== "Open" && status !== "In progress" && status !== "Completed"){
		cb({err: "Invalid status"});
	}
	else {
		this.getUserData(user, function(err, user){
			if (err) cb(err);
			else {
				filteredRquests = user.myRequests.filter(function(el){
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
	reward: Number,
	paid: Boolean,
	candidates: [{type: Schema.Types.ObjectId, ref:'User'}],
	helpers: [{type: Schema.Types.ObjectId, ref:'User'}],
	unpaidUsers: [{type: Schema.Types.ObjectId, ref:'User'}],
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
								that.populate(result, {path: 'unpaidUsers'}, function (err, result) {
									if (err) cb({err: "Failed to populate unpaid users"});
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
		});
	}
};

RequestSchema.statics.payHelper = function(requestId, helperId, cb){
	var that = this;
	that.update({"_id": requestId}, {$pull:{'unpaidUsers':helperId}}, {upsert: true}, function(err){
		if (err) cb(err);
		else cb(null);
	});
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

//Callback on requests with the corresponding status and have title, description, or tags in keywords or at least one tag in tagQuery
RequestSchema.statics.getRequestByFilter = function(status, keywords, tagQuery, cb){
	var that = this;
	var filter = {};

	if (keywords === undefined || keywords === null || keywords.length === 0) keywords = [];
	if (tagQuery === undefined || tagQuery === null || tagQuery.length === 0) tagQuery = [];

	filter['$or'] = [{tags: {$in: tagQuery}}, {tags: {$in: keywords}}];

	if(keywords.length != 0){
		var regex = "";
		keywords.forEach(function(el){
			regex = "|"+regex+el; 
		});

		regex = regex.substring(1);
		filter['$or'].push({title: {$regex: regex}});
		filter['$or'].push({description: {$regex: regex}});
	}

	if (status !== null) filter.status = status;

	that.find(filter, function(err, requestQuery){;
		that.populateRequests(err, requestQuery, cb);
	});
}

//Creates a new request and adds it to the corresponding user in userModel
RequestSchema.statics.createRequest = function(userModel, user, requestData, cb){
	var that = this;
	requestData.status = 'Open';
	requestData.candidates = [];
	requestData.helpers = [];
	requestData.unpaidUsers = [];
	requestData.comments = [];
	requestData.paid = false;
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
			var helpersCopy = request.helpers.slice(0);
			that.update({"_id":  requestId}, {status: 'In progress', $set: {'candidates': [], 'unpaidUsers': helpersCopy}}, {upsert: true}, function(err){
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
			that.update({"_id":  requestId}, {status: 'Completed'}, {upsert: true}, function(err){
				if (err) cb({err: "Failed to complete request"});
				else cb(null);
			});
		}
	})
}

//Adds a candidate to a request
RequestSchema.statics.addCandidate = function(requestId, userModel, candidate, cb){
	var that = this;

	userModel.getUser(candidate, function(err, candidate) {
		if (err) cb(err);
		else {
			that.getRequestById(requestId, function(err, result){
				if (err) cb(err);
				else {
					that.update({"_id":  requestId}, {$push: {'candidates': candidate._id}}, {upsert: true}, function(err){
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
					that.update({"_id":  requestId}, {$pull: {'candidates': userObj._id}, $push: {'helpers': userObj._id}}, {upsert: true}, function(err){
						if (err) {
							cb({err: "Failed to accept candidate"});
						}
						else {
							userModel.update({"_id": userObj._id}, {$push: {'requestsTaken': requestId}}, {upsert: true}, function (err) {
								if (err) {
									cb({err: "Failed to add request to requests taken."});
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
					var commentObj = {user: userObj._id, comment: commentString, dateCreated: currentDate};
					var returnComment = {user: userObj.username, comment: commentString, dateCreated: currentDate.toLocaleString()};
					that.update({"_id": requestId}, {$push: {'comments': commentObj}}, {upsert: true}, function (err) {
						if (err) {
							cb({err: "Failed to add comment"});
						} else {
							cb(null, returnComment);
						}
					});
				}
			});
		}
	});
};

exports.User = mongoose.model('User', UserSchema);
exports.Request = mongoose.model('Request', RequestSchema);