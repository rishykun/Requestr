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
	
	//getRequestsByStatus is the method under test.
	describe("getRequestsByStatus", function () {
		it("cannot get invalid status", function (done) {
			user.getRequestsByStatus ("abcd", "asdaa", function (err, data) {
				if (err) {
				done();
			}
			});
		});

		
		it("gets all requests by a filter (i.e. open)", function (done) {
			Request.view

			done();
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
					done();
				}
			});
		});
	});

	
	//addMessage is the method under test.
	describe("addMessage", function() {
		it("adding a message shows up", function (done) {
			msg.addMessage("user", 6170, "dummytext", function(err) {
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
					assert.equal(data.author, "user");
					assert.equal(data.value, "dummytext");
					msg.removeMessage(6170, function(err) {
						done();
					}); //remove traces of test from database
				});
			});
		});

		it("adding multiple messages, all show up", function (done) {
			msg.addMessage("user", 6170, "dummytext", function(err) {
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
					assert.equal(data.author, "user");
					assert.equal(data.value, "dummytext");

					msg.addMessage("user2", 61700, "dummytext2", function(err) {
						if (err) {
							throw err;
							done();
						}
						msg.findById(61700, function(err, data) {
							if (err) {
								throw err;
								done();
							}
							assert.equal(data.id, 61700);
							assert.equal(data.author, "user2");
							assert.equal(data.value, "dummytext2");
							msg.removeMessage(61700, function(err) {
								msg.removeMessage(6170, function(err) {
									done();
								}); //remove traces of test from database
							}); //remove traces of test from database
						});
					});
				});
			});
		});

	});
	
	//removeMessage is the method under test.
	describe("removeMessage", function() {
		it("remove an added message successfully", function (done) {
			msg.addMessage("userA", 6858, "dummyholder", function(err, data) {
				if (err) {
					throw err;
					done();
				}

				msg.removeMessage(6858, function (err) {
					if (err) {
						throw err;
						done();
					}
					msg.findById(6858, function(err, data) {
						if (err) {
							done();
						} else {
							throw err;
							done();
						}
					});
				});
			});
		});

		it("remove multiple added messages successfully", function (done) {
			msg.addMessage("userA", 6900, "dummyholder", function(err, data) {
				if (err) {
					throw err;
					done();
				}

				msg.addMessage("op", 6100, "opness", function(err2, data) {
					if (err2) {
						throw err2;
						done();
					}
					
					msg.removeMessage(6900, function (err3) {
						if (err3) {
							throw err3;
							done();
						}

						msg.findById(6900, function (findErr, data) {
							if (findErr) {
								msg.removeMessage(6100, function (err4) {
									if (err4) {
										throw err4;
										done();
									}

									msg.findById(6100, function(err3, data) {
										if (err3) {
											done();
										} else {
											throw err3;
											done();
										}
									});
								});
							} else {
								throw {msg: "WHY YOU FAIL"};
								done();
							}
						});
					});
				});
			});
		});

		it("remove a nonexistent message throws an error", function (done) {
			msg.removeMessage(6149, function (err) {
				if (err) {
					done();
				} else {
					throw {msg: "WHY YOU FAIL"};
					done();
				}
			});
		});
	});


	//getAllMessages is the method under test
	describe("getAllMessages", function() {
		it("able to find a single message that was added, length 1", function (done) {
			msg.addMessage("bleh", 6004, "dummy", function(err, addMsg) {
				if (err) {
					throw err;
					done();
				}
				msg.getAllMessages(function(err, data) {
					if (err) {
						throw err;
						done();
					}

					var valid = false;
					data.forEach(function(datapoint) {
						if (datapoint.id == 6004 && datapoint.author === "bleh" && datapoint.value === "dummy") {
							valid = true;
						}
					});
					assert.equal(valid, true);

					msg.removeMessage(addMsg.id, function(err) {
						if (err) {
							throw {msg: "WHY YOU FAIL"};
							done();
						} else {
							done();
						}
					}); //remove traces of test from database
				});
			});
		});

		it("able to find all added messages, with appropriate length, in correct time order", function (done) {
			msg.addMessage("bleh", 6004, "dummy", function(err, addMsg1) {
				if (err) {
					throw err;
					done();
				}
				msg.addMessage("blehas", 6006, "dummy5", function(err, addMsg2) {
					if (err) {
						throw err;
						done();
					}
					msg.getAllMessages(function(err, data) {
						if (err) {
							throw err;
							done();
						}

						var validCount = 0;
						data.forEach(function(datapoint) {
							if ( (datapoint.id == 6004 && datapoint.author === "bleh" && datapoint.value === "dummy")
								|| (datapoint.id == 6006 && datapoint.author === "blehas" && datapoint.value === "dummy5") ) {
								validCount += 1;
							}
						});
						assert.equal(validCount, 2);

						msg.removeMessage(addMsg1.id, function(err) {
							if (err) {
								throw {msg: "WHY YOU FAIL"};
								done();
							} else {
								msg.removeMessage(addMsg2.id, function(err) {
									if (err) {
										throw {msg: "WHY YOU FAIL"};
										done();
									} else {
										done();
									}
								});
							}
						}); //remove traces of test from database

					});
				});
			});
		});
	});
});

*/