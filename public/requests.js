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
	//var date = new Date();
	//var date_string = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear()

	$("#request-expires").datepicker();
	//$("#request-expires").attr("min", date_string); //ensure we cannot pick a date in the past

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

	getMyAcceptedRequests = function(filter) {
		$.get("/requests/myAcceptedRequests/", {
		})
		//when done, log user in because successful signup doesn't automatically log user in
		.done(function(results) {
			console.log("results.content: ", results.content);

			var filteredRequests = results.content.requests.filter(function(ele) {
				return ele.status === filter;
			});

			console.log("filteredRequests: ", filteredRequests);
			$.post("/", {
				"passedData": filteredRequests
			})
			.done(function(result) {
				try {
					var resultBody  = result.split("<body")[1].split(">").slice(1).join(">").split("</body>")[0];
					$("body").html(resultBody);
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
		//failed response from registration request
		.fail(function(error) {
			console.error("ERROR: ", error);
		});
	}


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

		console.log("expDate set to: ", expDate); //debug

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
			var reward = $("#request-rewards").val();
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
		var iframe = $("iframe").contents();
		var comment = iframe.find("#newCommentText_" + request_id).val();
		console.log("comment is: ", comment);

		$.post('/requests/' + request_id + '/comments', {
			"comment": comment
		}).done(function (data) {
			var comment = data.content;
			iframe.find("#comments").append("<div class='comment-box'> <b>" + comment.user + " : </b>" + comment.comment + " <i> @ " + comment.dateCreated + "</i></div>")
			iframe.find("#newCommentText_" + request_id).val("");

		}).fail(function (error) {
			console.log("ERROR: ", error);
		});

	};
});