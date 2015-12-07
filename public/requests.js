/*
	handles client-sided app-logic for requests (creating, taking, filtering, etc.)
*/

//define the following functions so that they can be used by the frontend
var handleRequest;
var handleCandidate;

var getMyRequests;
var getMyAcceptedRequests;

var addComment;

$(document).ready(function() {

	var minDate = new Date();
	minDate.setHours(0, 0, 0, 0);
	$("#request-expires").datepicker({"minDate": minDate});
	
	//Gets the requests of the current user under the filter status (Open, In progress, Complete)	
	getMyRequests = function(filter) {
		$.get("/requests/myRequests/"+filter, {
		})
		.done(function(results) {


			$.post("/", {
				"passedData": results.content.requests
			})
			.done(function(result) {


				try {
					var resultBody  = result.split("<!-- requests-container-start --")[1].split(">").slice(1).join(">").split("<!-- requests-container-end -->")[0];

					var parsedResult = $.parseHTML(resultBody);

					$("#requests-container").html(resultBody);
					$("#pageStatus").html("My " + filter + " Created Requests");
					$("#homeButton").css("display", "inline-block");
				}
				catch (err) {
					$.notify({
						message: "No results found."
					},{
						type: "info"
					});
				}
			});
		})
		//failed response from registration request
		.fail(function(error) {
			console.error("ERROR: ", error);
		});
	}

	/*
		Gets all requests that the user has accepted with the corresoonding filter (In progress, Completed).
	*/
	getMyAcceptedRequests = function(filter) {
		$.get("/requests/myAcceptedRequests/", {
		})
		.done(function(results) {

			var filteredRequests = results.content.requests.filter(function(ele) {
				return ele.status === filter;
			});

			$.post("/", {
				"passedData": filteredRequests
			})
			.done(function(result) {
				try {
					var resultBody  = result.split("<!-- requests-container-start --")[1].split(">").slice(1).join(">").split("<!-- requests-container-end -->")[0];

					var parsedResult = $.parseHTML(resultBody);

					$("#requests-container").html(resultBody);


					$("#pageStatus").html("My " + filter + " Accepted Requests");
					$("#homeButton").css("display", "inline-block");
				}
				catch (err) {
					$.notify({
						message: "No results found."
					},{
						type: "info"
					});
				}
			});
		})
		.fail(function(error) {
			console.error("ERROR: ", error);
		});
	}

	// Form to create a request
	$("#request-form").submit(function(event) {
		event.preventDefault();

		//do sanitization and other checks here, throw an error if checks fail
		var reward = $("#request-rewards").val();
		if (isNaN(reward)) {
			$.notify({
				message: "Rewards field must be a number!"
			},{
				element: "#createRequestModal",
				type: "danger"
			});

			return false;
		}

		var expDateArray = $("#request-expires").val().split("/");

		var hour = 0;
		var minutes = 0;

		if ($("#request-expires-time").val() !== "") {
			var expDateTimeArray = $("#request-expires-time").val().split(":")
			minutesAndPeriod = expDateTimeArray[1].split(" ");
			hour = parseInt(expDateTimeArray[0])
			minutes = parseInt(minutesAndPeriod[0])

			if (minutesAndPeriod[1] === "PM" && hour !== 12) {
				hour += 12;
			}
			if (hour === 12 && minutesAndPeriod[1] === "AM") {
				hour = 0;
			}
		}

		var expDate = new Date(expDateArray[2], expDateArray[0] - 1, expDateArray[1], hour, minutes);
		var now = new Date();

		if (expDate <= now) {
			$.notify({
				message: "Expiration date must be in the future!"
			},{
				element: "#createRequestModal",
				type: "danger"
			});

			return false;
		}

		handleRequest(null, "create");

		return false;
	});

	// Handles all actions pertaining to requests (create, accept, delete, etc.)
	// Params:
	//		- request_id - id of the request being handled
	//		- eventType - what action to do with the request
	handleRequest = function(request_id, eventType) {

		/*
			instantiates create request function in the request form's submit button

			submits the request form by making a call to the server in attempt to create the message on the server-side
			if successful, go to home page and the request data now appears in the client-side as well
		*/
		//CREATE REQUEST
		if (eventType === "create") {
			//prepare data to be sent over to backend
			//reason why we don't simply just pass in the form values to the ajax request is because
			//we handle data sanitization here

			var title = $("#request-title").val();
			var desc = $("#request-desc").val();

			var expDateArray = $("#request-expires").val().split("/");
			var hour = 0;
			var minutes = 0;
			if ($("#request-expires-time").val() !== "") {
				var expDateTimeArray = $("#request-expires-time").val().split(":")
				minutesAndPeriod = expDateTimeArray[1].split(" ");
				hour = parseInt(expDateTimeArray[0])
				minutes = parseInt(minutesAndPeriod[0])

				if (minutesAndPeriod[1] === "PM" && hour !== 12) {
					hour += 12;
				}
				if (hour === 12 && minutesAndPeriod[1] === "AM") {
					hour = 0;
				}
			}
			var expires = new Date(expDateArray[2], expDateArray[0] - 1, expDateArray[1], hour, minutes);

			var tagsString = $("#request-create-tags").val();

			var reward = $("#request-rewards").val();
			var tagsArray = tagsString.split(",");
			// Trim the beginning and end spaces off all tags in the array
			tagsArray = tagsArray.map(function(tag){
				return tag.trim();
			});

			//make post request to request route
			$.post("/requests", {
				"title": title,
				"desc": desc,
				"expires": expires,
				"tags": tagsArray,
				"reward": reward,
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
		//DELETE REQUEST
		if (eventType === "delete") {
			//prepare data to be sent over to backend
			$.ajax({
			    url: '/requests/' + request_id,
			    type: 'DELETE',
			    success: function (data) {
			        //if call was successful
			        if (data.success) {
			        	location.href="/"; //go to home page
			        } else { //call failed
			        	console.error("ERROR: request start failed");
			        }
			    },
			    error: function (error) {
			    	console.error("ERROR: ", error);
			    }
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

	// Handles all actions pertaining to candidates of a request
	/*
		Params:
			request_id - id of the request the user is a candidate of
			username - username of the candidate
			eventType - action to perform with candidate
	*/
	handleCandidate = function(request_id, username, eventType) {
		/*
			instantiates create request function in the request form's submit button

			submits the request form by making a call to the server in attempt to create the message on the server-side
			if successful, go to home page and the request data now appears in the client-side as well
		*/
		//ACCEPT CANDIDATE
		if (eventType === "accept") {
			event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

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
		//REMOVE CANDIDATE
		if (eventType === "remove") {
			event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

			$.ajax({
				url: "/requests/" + request_id + "/candidates/" + username,
				method: "DELETE",
				success: function(data) {
					//if call was successful
					if (data.success) {
						location.href="/"; //go to home page
					} else { //call failed
						console.error("ERROR: remove candidate failed");
					}
				},
				error: function(error) {
					console.error("ERROR: ", error);
				}
			});
		}
	}

	$(".new-comment-form").submit(function (event) {
		event.preventDefault();
	});

	//ADD COMMENT
	addComment = function(request_id) {
		var comment = $("#new-comment-" + request_id).val();

		$.post('/requests/' + request_id + '/comments', {
			"comment": comment
		}).done(function (data) {
			var comment = data.content;
			$("#comment-list-" + request_id).prepend("<li class='list-group-item'> <b>" + comment.user + " : </b>" + comment.comment + " <i> @ " + comment.dateCreated + "</i></li>");
			$("#new-comment-" + request_id).val("");
		}).fail(function (error) {
			console.error("ERROR: ", error);
		});

	};
});