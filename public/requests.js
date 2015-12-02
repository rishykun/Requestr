/*
	handles client-sided app-logic for requests (creating, taking, filtering, etc.)
*/
//define the following functions so that they can be used by the frontend
var handleRequest;
var getSearchRequests;
var getMyRequests;

var viewRequest;
var addComment;

var goHome;

$(document).ready(function() {

	$("#request-expires").datepicker();

	getSearchRequests = function(e) {
		if(e)
		{
			if(e.keyCode == 13){
				// keyword
			var keyword = $("#request-search").val();
				var keyArray = keyword.split(",");
				// Trim the beginning and end spaces off all tags in the array
				keyArray = keyArray.map(function(key){
					return key.trim();
				});
			$.post("/requests/search", {
				"keywords": keyArray,
			})
		
			//when done, log user in because successful signup doesn't automatically log user in
			.done(function(results) {
				$.post("/", {
					"passedData": results.content.requests
				})
				.done(function(result) {
					try {
						var resultBody  = result.split("<body")[1].split(">").slice(1).join(">").split("</body>")[0];
						$("body").html(resultBody);
					}
					catch (err) {
						alert("No results found.");
					}
				});
			})
			//failed response from registration request
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
		}
	}
	else {
			// tags
			var tagsString = $("#request-search-tags").val();
				var tagsArray = tagsString.split(",");
				// Trim the beginning and end spaces off all tags in the array
				tagsArray = tagsArray.map(function(tag){
					return tag.trim();
				});
				// keyword
			var keyword = $("#request-search-keyword").val();
			var keyArray = keyword.split(",");
				// Trim the beginning and end spaces off all tags in the array
				keyArray = keyArray.map(function(key){
					return key.trim();
				});
			var startDate = $("#request-search-expire-start").val();
			var endDate = $("#request-search-expire-end").val();
			$.post("/requests/search", {
				"tags": tagsArray,
				"keywords": keyArray,
				"startDate": startDate,
				"endDate": endDate,
			})
			//when done, log user in because successful signup doesn't automatically log user in
			.done(function(results) {
				$.post("/", {
					"passedData": results.content.requests
				})
				.done(function(result) {
					try {
						var resultBody  = result.split("<body")[1].split(">").slice(1).join(">").split("</body>")[0];
						$("body").html(resultBody);
					}
					catch (err) {
						alert("No results found.");
					}
				});
			})
			//failed response from registration request
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
	}
	}

	getMyRequests = function(filter) {
		$.get("/requests/myRequests", {
		})
		//when done, log user in because successful signup doesn't automatically log user in
		.done(function(data) {

			var requests = data.content.requests;


			$("#requests-container").css("display", "none");

			$("#my-requests-container").remove(); //remove any previously displayed self-requests

			$("#background-container").append("<div id='my-requests-container' style='margin-top:20px'></div>");

			var colorLookup = {"Open": "green", "In progress": "yellow", "Expired": "gray", "Completed": "blue"};

			requests.forEach(function(request) {
				if (request.status === filter) {
					var request_box = $("#my-requests-container").append('<div id="request-box'+ request._id +'" style="background-color:rgb(231,231,231); width:50%; margin-left:25%; margin-top: 10px; border-left: 7px solid ' + colorLookup[filter] + '; padding: 10px"></div>');
					var this_request_box = $("#request-box" + request._id);

					var request_header = this_request_box.append('<div id="request-header'+ request._id + '" style="background-color:rgb(208,208,208); padding: 10px"></div>');
					var this_request_header = $("#request-header" + request._id);
					this_request_header.append('<div id="request-status" style="display: inline-block; font-weight: bold; color: ' + colorLookup[filter] + '; text-shadow: 1px 1px 1px rgb(32,32,32); background-color: rgb(244,244,244); padding:2px">' + request.status + '</div>')
					this_request_header.append('<div id="request-title-bar" style="display: inline-block; margin-left: 5px">Title: ' + request.title + '</div>');
					this_request_header.append('<button class="btn-btn-primary" id="request_view-button" onclick="viewRequest(\'' + request._id + '\')">View</button>');
					this_request_header.append('<div id="request-expdate-bar" style="float:right; display: inline-block">Expires: ' + request.expirationDate + '</div>');
					this_request_header.append('<div id="request-creator-bar" style="margin-top:5px">Requester: ' + request.creator+ '</div>');

					var request_body = this_request_box.append('<div id="request-body'+ request._id + '" style="padding:10px"></div>');
					var this_request_body = $("#request-body" + request._id);
					this_request_body.append('<div id="request-desc-bar">Description: ' + request.description + '</div>');
					this_request_body.append('<div id="request-rewards-bar" style="margin-top:5px">Rewards: 1 cookie</div>');

					var request_footer = this_request_box.append('<div id="request-footer'+ request._id + '"></div>');
					var this_request_footer = $("#request-footer" + request._id);

					if (filter === "Open") {
						if (request.candidates.length > 0) {
							request.candidates.forEach(function(candidate) {
								this_request_footer.append('<button class="btn btn-success" onclick="handleCandidate(\'' + request._id + '\', \'' + candidate.username + '\', \'accept\')">Accept ' + candidate.username + '</button>');
								this_request_footer.append('<button class="btn btn-danger" onclick="handleCandidate(\'' + request._id + '\', \'' + candidate.username + '\', \'reject\')">Reject ' + candidate.username + '</button>');
							});
						}
						if (request.helpers.length > 0) {
							request.helpers.forEach(function(helper) {
								this_request_footer.append('<button class="btn btn-danger" onclick="handleCandidate(\'' + request._id + '\', \'' + helper.username + '\', \'reject\')">Reject ' + helper.username + '</button>');
							});
							this_request_footer.append('<br><button class="btn btn-primary" onclick="handleRequest(\'' + request._id + '\', \'start\')">Start Request</button>');
						}
						if (request.candidates.length === 0 && request.helpers.length === 0) {
							this_request_footer.append("No candidates yet.");
						}
					}
					else if (filter === "In progress") {
						this_request_footer.append('<br><button class="btn btn-success" onclick="handleRequest(\'' + request._id + '\', \'complete\')">Complete Request</button>');
					}
				}
			});
		})
		//failed response from registration request
		.fail(function(error) {
			console.error("ERROR: ", error);
		});
	}

	viewRequest = function(request_id) {
		location.href="/requests/" + request_id;
	}

	goHome = function() {
		location.href="/";
	}

	$('[data-toggle="tooltip"]').tooltip(); //initializes all bootstrap tooltips

	/*
		makes a call to the server in attempt to "log out" the user from being "logged in" on the server
		if successful status received, the page will reload and the client will no longer have user credentials
	*/
	$("#logout-button").click(function() {
		$.post("/users/logout")
		.done(function(data) {
			//if logout was successful
			location.href="/"; //reload page
		})
		.fail(function(error) {
			console.error("ERROR: ", error);
		});
	});

	/*
		instantiates login function in the login form's login button
	*/
	$("#login-form").submit(function(event) {
		event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

		//prepare data to be sent over to backend authentication server
		//automatic data sanitization
		var username = $("#login-username").val();
		var password = $("#login-password").val();

		performLoginRequest(username, password);
	});

	/*
		instantiates signup function in the signup form's signup button
	*/
	$("#signup-form").submit(function(event) {
		event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

		//prepare data to be sent over to backend authentication server
		//automatic data sanitization
		var username = $("#signup-username").val();
		var password = $("#signup-password").val();

		$.post("/users", {
			"username": username,
			"password": password
		})
		//when done, log user in because successful signup doesn't automatically log user in
		.done(function(data) {
			performLoginRequest(username, password);
		})
		//failed response from registration request
		.fail(function(error) {
			console.error("ERROR: ", error);
			alert("Failed registration. Username probably already taken.");
		});
	});

	/*
		makes a call to the server and attempts to authenticate with the specified credentials
		if successfully authenticated, the page will reload with the correct userprofile and data
		and the user will be "logged in"
		parameters:
			username - the username to check against
			password - the password to check against
	*/
	var performLoginRequest = function(username, password) {
		//make post request to login route
		$.post("/users/login", {
			"username": username,
			"password": password
		})
		//successful response from login request
		.done(function(data) {
			//if signin was successful
			if (data.success) {
				location.href="/"; //reload page

				$("#login-modal").modal("hide");
			} else { //signup failed
				console.error("ERROR: Login failed");
			}
		})
		//failed response from login request
		.fail(function(error) {
			console.error("ERROR: ", error);
			alert("Failed authentication. Is your username/password combination correct?");
		});
	}

	handleRequest = function(request_id, eventType) {

		//prepare data to be sent over to backend

		//make post request to request route

		/*
			instantiates create request function in the request form's submit button

			submits the request form by making a call to the server in attempt to create the message on the server-side
			if successful, go to home page and the request data now appears in the client-side as well
		*/
		//CREATE REQUEST
		if (eventType === "create") {
			//event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

			//prepare data to be sent over to backend
			//reason why we don't simply just pass in the form values to the ajax request is because
			//we handle data sanitization here
			var title = $("#request-title").val();
			var desc = $("#request-desc").val();
			var expires = $("#request-expires").val();
			var tagsString = $("#request-tags").val();
			var tagsArray = tagsString.split(",");
			// Trim the beginning and end spaces off all tags in the array
			tagsArray = tagsArray.map(function(tag){
				return tag.trim();
			});

			//make post request to request route
			$.post("/requests/create", {
				"title": title,
				"desc": desc,
				"expires": expires,
				"tags": tagsArray,
			})
			//successful response from request creation
			.done(function(data) {
				//if message creation was successful
				if (data.success) {
					location.href="/"; //go to home page
				} else { //request creation failed
					console.error("ERROR: request creation failed");
				}
			})
			//failed response from request creation
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
		}
		//ADD CANDIDATE
		if (eventType === "accept") {
			//accept request
			$.post("/requests/" + request_id + "/candidates", {
			})
			//successful response from accepting request
			.done(function(data) {
				//if call was successful
				if (data.success) {
					location.href="/"; //go to home page
				} else { //call failed
					console.error("ERROR: request acceptance failed");
				}
			})
			//failed response from call
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
		}
		//START REQUEST
		if (eventType === "start") {
			console.log("START REQUEST"); //debug
			$.ajax({
				url: "/requests/" + request_id,
				method: "PUT",
				data: {
					"updateType": eventType
				},
				success: function(data) {
					//if call was successful
					if (data.success) {
						location.href="/"; //go to home page
					} else { //call failed
						console.error("ERROR: request start failed");
					}
				},
				error: function(error) {
					console.error("ERROR: ", error);
				}
			});
		}
		//COMPLETE REQUEST
		if (eventType === "complete") {

			$.ajax({
				url: "/requests/" + request_id,
				method: "PUT",
				data: {
					"updateType": eventType
				},
				success: function(data) {
					//if call was successful
					if (data.success) {
						location.href="/"; //go to home page
					} else { //call failed
						console.error("ERROR: request complete failed");
					}
				},
				error: function(error) {
					console.error("ERROR: ", error);
				}
			});
		}
	}

	handleCandidate = function(request_id, username, eventType) {

		//prepare data to be sent over to backend

		//make post request to request route

		/*
			instantiates create request function in the request form's submit button

			submits the request form by making a call to the server in attempt to create the message on the server-side
			if successful, go to home page and the request data now appears in the client-side as well
		*/
		//ACCEPT CANDIDATE
		if (eventType === "accept") {
			event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

			//prepare data to be sent over to backend
			//reason why we don't simply just pass in the form values to the ajax request is because
			//we handle data sanitization here
			var title = $("#request-title").val();

			$.ajax({
				url: "/requests/" + request_id + "/candidates/" + username,
				method: "PUT",
				success: function(data) {
					//if call was successful
					if (data.success) {
						location.href="/"; //go to home page
					} else { //call failed
						console.error("ERROR: accept candidate failed");
					}
				},
				error: function(error) {
					console.error("ERROR: ", error);
				}
			});
		}
		//TODO
		//REJECT CANDIDATE
		if (eventType === "reject") {
			/*
			//accept request
			$.post("/requests/addCandidate", {
				"request_id": request_id
			})
			//successful response from request creation
			.done(function(data) {
				//if call was successful
				if (data.success) {
					location.href="/"; //go to home page
				} else { //call failed
					console.error("ERROR: request creation failed");
				}
			})
			//failed response from call
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
			*/
		}
	}

	//ADD COMMENT
	addComment = function(request_id) {
		var comment = $("#newCommentText").val();
		$.post('/requests/' + request_id + '/comments', {
			"comment": comment
		}).done(function (data) {
			location.href = "/requests/" + request_id;
		}).fail(function (error) {
			console.log("ERROR: ", error);
		});
	};
});