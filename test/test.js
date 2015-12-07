var assert = require("assert");

//import backend database handler
var mongoose = require("mongoose");
//connect to backend database
mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost:27017/requestr'); // connect to our database


//import modules for testing
var User = require('../models/schema').User; //model
var Request = require('../models/schema').Request; //model
var Reviews = require("../models/ReviewSchema"); //model

/*
	testing the User model
	all public methods are tested for accuracy and reliability
*/
describe("User", function() {
	user = User;

	//createNewUser is the method under test
	describe("createNewUser", function() {
		it("able to create a new user", function (done) {
			user.createNewUser("AA", "Board", "test@test.com", function(err, data) {
				if (err) {
					throw err;
				}

				user.getUser("AA", function(err, data) {
					if (err) {
						throw err;
					}

					assert.deepEqual(data.username, "AA");
					//assert.deepEqual(data.password, "Board")
					assert.deepEqual(data.email, "test@test.com")
					user.removeUser("AA", function(err) {
						if (err) {
							throw err;
						}
						done();
					}); //remove traces of test from database

				});
			});
		});

		it("unable to create an already existing user (identified by username)", function (done) {
			user.createNewUser("A", "B", "test@test.com", function(err, taken) {
				if (err) {
					throw err;
					done();
				}
				user.createNewUser("A", "Baaaa", "test@test.com", function(err, taken) {
					if (err) {
						throw err;
						done();
					}
					if (taken) {
						user.removeUser("A", function(err) {
							done();
						}); //remove traces of test from database
					} else {
						user.removeUser("A", function(err) {
							throw {msg: "Fail"};
							done();
						}); //remove traces of test from database
					}
				});
			});
		});
	});
	
	//getUser is the method under test
	describe("getUser", function() {
		it("able to find a newly created user", function (done) {
			user.createNewUser("A", "B", "test@test.com", function(err, taken) {
				if (err) {
					throw err;
					done();
				}
				if (taken) {
					throw err;
					done();
				}
				user.getUser("A", function(err, data2) {
					if (err) {
						throw err;
						done();
					}
					assert.deepEqual(data2.username, "A");
					//assert.deepEqual(data2.password, "B");
					user.removeUser("A", function(err) {
						done();
					}); //remove traces of test from database
				});
			});
		});

		it("properly throws an error when trying to find a nonexistent user", function (done) {
			user.getUser("nonexist", function(err, data3) {
				if (err) {
					if (err.msg === "No such user!") {
						done();
					} else {
						throw err;
						done();
					}
				} else {
					throw err;
					done();
				}
			});
		});
	});
	
	//VerifyPassword is the method under test
	describe("verifyPassword", function() {
		it("able to appropriately verify password for newly created user", function (done) {
			user.createNewUser("A", "B", "test@test.com", function(err, data) {
				if (err) {
					throw err;
					done();
				}
				user.verifyPassword("A", "B", function (err, data) {
					if (err) {
						user.removeUser("A", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}
					if (data) {
						user.removeUser("A", function(err) {
							done();
						}); //remove traces of test from database
					} else {
						user.removeUser("A", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}
				});
			});
		});

		it("appropriately returns false for attempting to verify with the wrong username or password", function (done) {
			user.createNewUser("A", "B", "test@test.com", function (err, data) {
				if (err) {
					throw err;
					done();
				}
				user.verifyPassword("A", "aaqweB", function (err, verified) {

					if (err) {
						user.removeUser("A", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}
					if (verified) {
						user.removeUser("A", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					} else {
						//should return an error because it can't find the user
						user.verifyPassword("Aasdas", "B", function (err, verified) {
							if (err) {
								user.removeUser("A", function(err) {
									done();
								}); //remove traces of test from database
							} else {
								throw err;
								done();
							}
						});
					}
				});
			});
		});
	});
	
	//addrequest is the method under test.
	describe("addRequest", function() {
		it("cannot add a message without a non-existing user", function (done) {
			user.addRequest("userSZAS", "5664e7669763725a475bd922", function(err, data) {
				if (err) {
					done();
				} else {
					user.removeUser("userSZAS", function(err) {
						throw err;
						done();
					}); //remove traces of test from database
				}
			});
		});

		
		it("adding a request shows up", function (done) {
			user.createNewUser("userS", "S", "test@test.com", function (err, userData) {
				if (err) {
					throw err;
					done();
				}
				user.addRequest("userS", "5664e7669763725a475cc922", function(err) {
					if (err) {
						user.removeUser("userS", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}
					user.getUser("userS", function(err, findData) {
						if (err) {
							user.removeUser("userS", function(err) {
								throw err;
								done();
							}); //remove traces of test from database
						}
						assert.equal("5664e7669763725a475cc922", findData.myRequests[0]);
						user.removeUser("userS", function(err) {
							done();
						}); //remove traces of test from database
					});
				});
			});
		});
	});

	//removeMessage is the method under test.
	describe("removeRequest", function() {
		it("cannot remove a request with a non-existing user", function (done) {
			user.removeRequest("userSZAS", Request, 1234, function(err) {
				if (err) {
					done();
				} else {
					throw {msg: "FAIL"};
					done();
				}
			});
		});

		
		it("successfully remove an added message", function (done) {
			user.createNewUser("userSS", "S", "test@test.com", function (err, userData) {
				if (err) {
					throw err;
					done();
				}
				user.addRequest("userSS", "5664e7669763725a475cc922", function(err, addID) {
					if (err) {
						user.removeUser("userSS", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}
					user.removeRequest("userSS", Request, "5664e7669763725a475cc922", function(err) {

						if (err) {
							user.removeUser("userSS", function(err) {
								throw err;
								done();
							}); //remove traces of test from database
						} else {
							user.removeUser("userSS", function(err) {
								done();
							}); //remove traces of test from database
						}
					});
				});
			});
		}); 
	});
});

/*
	testing the Message model
	all public methods are tested for accuracy and reliability
*/
/*
describe("Message", function() {
	msg = Message;

	//findById is the method under test
	describe("findById", function() {
		it("able to find a message that was added", function (done) {
			msg.addMessage("bleh", 6170, "dummy", function(err, data) {
				if (err) {
					throw err;
					done();
				}
				msg.findById(6170, function(err, data) {
					if (err) {
						throw err;
						done();
					}
					assert.equal(data.id, 6170);
					assert.equal(data.author, "bleh");
					assert.equal(data.value, "dummy");
					msg.removeMessage(6170, function (err) {
						done();
					});
				});
			});
		});

		it("attempting to find a nonexistent message returns an error", function (done) {
			msg.findById(617090, function(err, data) {
				if (err) {
					done();
				} else {
					throw err;
>>>>>>> Stashed changes
					done();
				}
			});
		});

		
		it("gets all requests by a filter (i.e. open)", function (done) {
			user.createNewUser("userSS", "S", "test@test.com", function (err, userData) {
				if (err) {
					throw err;
					done();
				}
				Request.createRequest(user, "userSS",
					{
						"_id": "5664e76697a3aa5a475bd9d1",
						"title": "hott",
						"dateCreated": "2015-12-07T01:56:54.314Z",
						"description": "asdaa",
						"expirationDate": "2016-12-07T01:56:54.314Z",
						"reward": 3,
						"status": "Open",
						"paid": false,
						"creator": "56649af50c1986f34aaa6894",
						"comments": [],
						"tags": [],
						"unpaidUsers": [],
						"helpers": [],
						"candidates": []
					}, function(err, addID) {
					if (err) {
						user.removeUser("userSS", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}

					user.getRequestsByStatus ("userSS", "Open", function (err, data) {
						if (err) {
							throw err;
							done();
						}
						user.removeUser("userSS", function(err) {
							if (err) {
								throw err;
							}

							Request.removeRequest("5664e76697a3aa5a475bd9d1", function(err) {
								if (err) {
									throw err;
								}
								done();
							});
						}); //remove traces of test from database
					});
				});
			});
		}); 
	});
});

/*
	testing the Requests model
	all public methods are tested for accuracy and reliability
*/


describe("Request", function() {

	//getRequestById is the method under test
	//this also inherently tests for removeRequest
	describe("getRequestById", function() {
		it("able to find a request that was added", function (done) {
			user.createNewUser("userSS", "S", "test@test.com", function (err, userData) {
				if (err) {
					throw err;
					done();
				}
				Request.createRequest(user, "userSS",
					{
						"_id": "5664e76697a3aa5a475bd9d1",
						"title": "hott",
						"dateCreated": "2015-12-07T01:56:54.314Z",
						"description": "asdaa",
						"expirationDate": "2016-12-07T01:56:54.314Z",
						"reward": 3,
						"status": "Open",
						"paid": false,
						"creator": "56649af50c1986f34aaa6894",
						"comments": [],
						"tags": [],
						"unpaidUsers": [],
						"helpers": [],
						"candidates": []
					}, function(err, addID) {
					if (err) {
						user.removeUser("userSS", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}

					Request.getRequestById ("5664e76697a3aa5a475bd9d1", function (err, data) {
						if (err) {
							throw err;
							done();
						}
						user.removeUser("userSS", function(err) {
							if (err) {
								throw err;
								done();
							}
							Request.removeRequest("5664e76697a3aa5a475bd9d1", function(err) {
								if (err) {
									throw err;
									done();
								}
								done();
							});
						}); //remove traces of test from database
					});
				});
			});
		});

	
		it("attempting to find a nonexistent message returns an error", function (done) {
			Request.getRequestById(617090, function(err, data) {
				if (err) {
					done();
				} else {
					throw err;
					done();
				}
			});
		});
	});

	
	//addRequest is the method under test.
	//this also inherently tests for removeRequest
	describe("addRequest", function() {

		it("adding a message shows up", function (done) {
			user.createNewUser("userSS", "S", "test@test.com", function (err, userData) {
				if (err) {
					throw err;
					done();
				}
				Request.createRequest(user, "userSS",
					{
						"_id": "5664e76697a3aa5a475bd9d1",
						"title": "hottaaaaa",
						"dateCreated": "2015-12-07T01:56:54.314Z",
						"description": "asdaa",
						"expirationDate": "2016-12-07T01:56:54.314Z",
						"reward": 3,
						"status": "Open",
						"paid": false,
						"creator": "56649af50c1986f34aaa6894",
						"comments": [],
						"tags": [],
						"unpaidUsers": [],
						"helpers": [],
						"candidates": []
					}, function(err, addID) {
					if (err) {
						user.removeUser("userSS", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}

					Request.getRequestById ("5664e76697a3aa5a475bd9d1", function (err, data) {
						if (err) {
							throw err;
							done();
						}
						user.removeUser("userSS", function(err) {
							if (err) {
								throw err;
								done();
							}
							Request.removeRequest("5664e76697a3aa5a475bd9d1", function(err) {
								if (err) {
									throw err;
									done();
								}
								done();
							});
						}); //remove traces of test from database
					});
				});
			});
		});
	});


	//startRequest is the method under test.
	describe("startRequest", function() {

		it("able to start request", function (done) {
			user.createNewUser("userSS", "S", "test@test.com", function (err, userData) {
				if (err) {
					throw err;
					done();
				}
				Request.createRequest(user, "userSS",
					{
						"_id": "5664e76697a3aa5a475bd9d1",
						"title": "hotteee",
						"dateCreated": "2015-12-07T01:56:54.314Z",
						"description": "asdaa",
						"expirationDate": "2016-12-07T01:56:54.314Z",
						"reward": 3,
						"status": "Open",
						"paid": false,
						"creator": "56649af50c1986f34aaa6894",
						"comments": [],
						"tags": [],
						"unpaidUsers": [],
						"helpers": [],
						"candidates": []
					}, function(err, addID) {
					if (err) {
						user.removeUser("userSS", function(err) {
							throw err;
							done();
						}); //remove traces of test from database
					}

					Request.startRequest("5664e76697a3aa5a475bd9d1", function(err) {
						if (err) {
							throw err;
							done();
						}
						Request.getRequestById ("5664e76697a3aa5a475bd9d1", function (err, data) {
							if (err) {
								throw err;
								done();
							}
							assert.deepEqual(data.id, "5664e76697a3aa5a475bd9d1");
							assert.deepEqual(data.status, "In progress");
							user.removeUser("userSS", function(err) {
								if (err) {
									throw err;
									done();
								}
								Request.removeRequest("5664e76697a3aa5a475bd9d1", function(err) {
									if (err) {
										throw err;
										done();
									}
									done();
								});
							}); //remove traces of test from database
						});
					});
				});
			});
		});

	});
});
/*
	testing the Review model
	all public methods are tested for accuracy and reliability
*/
describe("Review", function() {
	review = Reviews;

	describe("addReview", function() {
		
		it("should add a review", function (done) {
			User.createNewUser("writer", "a", "a@a.com", function(err, taken){
				if (err) {
					throw err;
					done();
				}
				User.createNewUser("victim", "b", "b@b.com", function(err, taken){
					if (err) {
						throw err;
						done();
					}
					Request.createRequest(User, "writer", {}, function(err){
						if(err){
							throw err;
							done();
						}
						User.getUser("writer", function(err, result){
							if(err){
								throw err;
								done();
							}
							var requestId = result.myRequests[0];
							Request.addCandidate(requestId, User, "victim", function(err){
								if(err){
									throw err;
									done();
								}
								Request.acceptCandidate(requestId, User, "victim", function(err){
									if(err){
										throw err;
										done();
									}
									review.addReview("writer", "victim", "review", 3, requestId, function(err){
										if(err){
											throw err;
											done();
										}
										review.getReviewsByVictimId("victim", function(err, result){
											if(err){
												throw err;
												done();
											}
											var reviewId = result[0]._id;
											assert.equal(result[0].text, "review");
											User.removeUser("writer", function(err){
												if(err){
													throw err;
													done();
												}
												User.removeUser("victim", function(err){
													if(err){
														throw err;
														done();
													}
													Request.removeRequest(requestId, function(err){
														if(err){
															throw err;
															done();
														}
														review.removeReview(reviewId, function(err){
															if (err){
																throw err;
																done();
															}
															else{
																done();
															}
														});
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
});