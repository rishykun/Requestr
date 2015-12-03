/*
	handles client-sided app-logic for requests (creating, taking, filtering, etc.)
*/
//define the following functions so that they can be used by the frontend
var handleRequest;
var handleCandidate;
var getSearchRequests;
var getMyRequests;

var viewRequest;
var addComment;
var configureReviewModal;

var goHome;

$(document).ready(function() {
	//var date = new Date();
	//var date_string = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear()

	$("#request-expires").datepicker();
	//$("#request-expires").attr("min", date_string); //ensure we cannot pick a date in the past

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
				"tags": null,
				"startDate": null,
				"endDate": null
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
		$.get("/requests/myRequests/"+filter, {
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
		Instantiates review submission function
	*/
	$("#review-form").submit(function (event) {
		event.preventDefault();

		var victimUsername = $("#review-victim").val();
		var rating = Number($("#review-rating").val());
		var text = $("#review-text").val();
		var currentURL = window.location.href;
		var requestId = $(this).attr("id");

		$.post("/users/" + victimUsername + "/reviews", {
			"victimUsername": victimUsername,
			"reviewText": text,
			"rating": rating,
			"requestId": requestId
		}).done(function (data) {
			$("#review-success").html("Your review has been submitted!");
			$("#review-error").html("");
			$("#review-form :input").prop("readonly", true);
		}).fail(function (error) {
			console.error("ERROR: ", error);
			$("#review-error").html("Your review could not be submitted.");
		});
	});

	configureReviewModal = function(requestId) {
		$.get(/requests/ + requestId, {"refuseRender": true}).done(function (data) {
			var request = data.content.request;
			var userProfile = data.content.userProfile;

			var participantNames = request.helpers.map(function (ele) {
				return ele.username;
			});

			participantNames.push(request.creator.username);

			participantNames.forEach(function (username) {
				if (username != userProfile.username) {
					$("#review-victim").append("<option>" + username + "</option>");
				}
			});

			$("#review-form").attr('id', request._id);
		});
	}

	/*
		Clear the review modal when it closes.
	*/
	$('#review-modal').on('hidden.bs.modal', function () {
	    $("#review-form").attr('id', "");
	    $("#review-victim").html("");
	    $("#review-text").val("");
	    $("#review-success").html("");
	    $("#review-error").html("");
	    $("#review-rating-default").attr("selected", "selected");
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