var socket = io();

var setActiveChat;
var openMessageModal;
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
			$("#online-badges").html(userKeys.length - 1); //account for self
			userKeys.forEach(function(username) {
				if (username !== loggedInUser) {
					$("#online").append('<li role="presentation" class="user-labels" id="' + username + '_label"><a id="' + username + '_button" href="#" onclick="setActiveChat(\'' + username + '\')" style="border-radius: 0px;">' + username + '</a></li>');
				}
			})
			console.log("received userList: ", data); //debug
		})
		.fail(function (error) {
			console.error("ERROR: ", error);
		});
	}

	openMessageModal = function() {
		$("#message-badges").html(""); //clear badges
		$('#message-modal').modal('show'); //then show modal
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
			var msg = $("#message-content").val();
			$("#messages").append("<div style='background-color: lightskyblue; text-align: right; padding: 5px; color: darkblue; margin-top: 5px; width:60%; position: relative; left: 40%; border-radius: 10px; word-wrap: break-word'> " + msg + "</div>");
			socket.emit("chat message", msg, loggedInUser, target_user, date.toLocaleString());
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
		if ($("#online-badges").html() == "") {
			$("#online-badges").html("1");
		} else {
			$("#online-badges").html(parseInt($("#online-badges").html()) + 1);
		}
		$("#online").append('<li role="presentation" class="user-labels" id="' + username + '_label"><a id="' + username + '_button" href="#" onclick="setActiveChat(\'' + username + '\')" style="border-radius: 0px;">' + username + '</a></li>');
	});

	//if a user logged out since we logged in, remove that user from the user list
	socket.on("logout user", function(username) {
		console.log("user logged out: " + username); //debug
		if ($("#online-badges").html() == "1" || $("#online-badges").html() == "") {
			$("#online-badges").html("0");
		} else {
			$("#online-badges").html(parseInt($("#online-badges").html()) - 1);
		}
		$("#" + username + "_label").remove();
	});

	socket.on("chat message", function(msg, src, dest, date) {
		if (dest === loggedInUser) {
			//show badge if message-modal isn't visible
			if (!$("#message-modal").is(":visible")) {
				if ($("#message-badges").html() == "") {
					$("#message-badges").html("1");
				} else {
					$("#message-badges").html(parseInt($("#message-badges").html()) + 1);
				}
			}
			$("#messages").append("<div style='background-color: lightgreen; text-align:left; padding: 5px; color: darkgreen; margin-top: 5px; width:60%; position: relative; border-radius: 10px; word-wrap: break-word'> " + msg + "</div>");
		}
	});
});