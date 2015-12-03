var socket = io();

var setActiveChat;
var loggedInUser = "";

$(document).ready(function() {
	var target_user = "";

	$.get("/users/session", {
	})
	.done(function(data) {
		//upon login, get list of logged in users and populate
		loggedInUser = data.content;
		getActiveUsers();
	})
	.fail(function(error) {
		//don't do anything because this gets called even when we're not logged in
		//remove error below for production
		console.log("error: ", error); //debug
	});

	//get list of logged in users and populate
	var getActiveUsers = function() {
		$.get("/users", {
		})
		.done(function (data) {
			var userList = data.content;
			var userKeys = Object.keys(userList);
			userKeys.forEach(function(username) {
				if (username !== loggedInUser) {
					$("#users-chatlist").append('<li role="presentation" class="user-labels" id="' + username + '_label"><a id="' + username + '_button" href="#" onclick="setActiveChat(\'' + username + '\')" >' + username + '</a></li>');
				}
			})
			console.log("received userList: ", data); //debug
		})
		.fail(function (error) {
			console.error("ERROR: ", error);
		});
	}

	setActiveChat = function(target) {
		$(".user-labels").removeClass("active"); //clear pre-existing active label
		$("#" + target + "_label").addClass("active");
		target_user = target;
	}

	$("#message-form").submit(function(event) {
		event.preventDefault();

		if (target_user === "") {
			alert("No user selected!"); //TODO replace alert with better alert system
		} else if ($("#message-content").val() !== "") {
			var date = new Date();
			socket.emit("chat message", $("#message-content").val(), loggedInUser, target_user, date.toString());
			$("#message-content").val(""); //clear message textfield after its sent
		}
	});

	$("#message-clear").click(function(event) {
		event.preventDefault();
		$("#messages").empty();
	});

	//if a user logged in since we logged in, populate user list
	socket.on("login user", function(username) {
		console.log("new user logged in: " + username); //debug
		$("#users-chatlist").append('<li role="presentation" class="user-labels" id="' + username + '_label"><a id="' + username + '_button" href="#" onclick="setActiveChat(\'' + username + '\')" >' + username + '</a></li>');
	});

	//if a user logged out since we logged in, remove that user from the user list
	socket.on("logout user", function(username) {
		console.log("user logged out: " + username); //debug
		$("#" + username + "_label").remove();
	});

	socket.on("chat message", function(msg, src, dest, date) {
		if (dest === loggedInUser) {
			if ($("#messages").text() !== "") {
				$("#messages").append("<br>");
			}
			$("#messages").append($("<b>").text(date + " " + src + ": ").append(msg));
		}
	});
});