/*
	handles client-sided app-logic for requests (creating, taking, filtering, etc.)
*/
console.log("request.js loaded"); //debug
var handleRequest; //define handleRequest so that it can be used by the frontend
$(document).ready(function() {

	$("#request-expires").datepicker();

	/*
		instantiates create request function in the request form's submit button

		submits the request form by making a call to the server in attempt to create the message on the server-side
		if successful, go to home page and the request data now appears in the client-side as well
	*/
	$("#request-form").submit(function(event) {
		event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

		//prepare data to be sent over to backend
		//reason why we don't simply just pass in the form values to the ajax request is because
		//we handle data sanitization here
		var title = $("#request-title").val();
		var desc = $("#request-desc").val();
		var expires = $("#request-expires").val();

		//make post request to request route
		$.post("/requests", {
			"title": title,
			"desc": desc,
			"expires": expires,
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
	});

	handleRequest = function(request_id, eventType) {
		console.log("handle request called. id: " + request_id + ", eventType: " + eventType); //debug

		//prepare data to be sent over to backend

		//make post request to request route

		if (eventType === "create") {
			event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

			//prepare data to be sent over to backend
			//reason why we don't simply just pass in the form values to the ajax request is because
			//we handle data sanitization here
			var title = $("#request-title").val();
			var desc = $("#request-desc").val();
			var expires = $("#request-expires").val();

			//make post request to request route
			$.post("/request", {
				"title": title,
				"desc": desc,
				"expires": expires,
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
		if (eventType === "accept") {
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
		}
	}
});