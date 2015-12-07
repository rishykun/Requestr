var socket = io();

var setActiveChat;
var openMessageModal;
var message;
var loggedInUser = "";
var messages = {};

$(document).ready(function() {
	var target_user = "";

	$.get("/users/current", {
	})
	.done(function(data) {
		//upon login, get list of logged in users and populate
		if (data.content.loggedIn) {
			loggedInUser = data.content.user;
			getActiveUsers();
		}
	})
	.fail(function(error) {
		//don't do anything because this gets called even when we're not logged in
	});

	//get list of logged in users and populate
	var getActiveUsers = function() {
		$.get("/users", {
		})
		.done(function (data) {
			var userList = data.content;
			var userKeys = Object.keys(userList);
			$("#online-badges").html("0"); //account for self
			userKeys.forEach(function(username) {
				if (userList[username] && username !== loggedInUser) {
					$("#online-badges").html(parseInt($("#online-badges").html()) + 1);
					$("#online").append('<li role="presentation" class="user-labels" id="' + username + '_label"><a id="' + username + '_button" href="#" onclick="setActiveChat(\'' + username + '\')"  style="border-radius: 0px; border-width: 0px 0px 1px 0px; border-style: solid; border-color: gray">' + username + ' <i id="' + username + '_newlabel" style="font-size:10px; color: red"></i></a></li>');
				}
			});
			
			getAllMessages();
			getOfflineUsers();
		})
		.fail(function (error) {
			console.error("ERROR: ", error);
		});
	}

	//get list of messages for logged in user
	var getAllMessages = function() {
		$.get("/users/messages", {
		})
		.done(function (data) {
			messages = data.content;

		})
		.fail(function (error) {
			console.error("ERROR: ", error);
		});
	}

	var getOfflineUsers = function() {
		$.get("/users/offline", {
		})
		.done(function (data) {
			var userList = data.content;
			$("#offline-badges").html(userList.length);
			userList.forEach(function(username) {
				$("#offline").append('<li role="presentation" class="user-labels" id="' + username + '_label"><a id="' + username + '_button" href="#" onclick="setActiveChat(\'' + username + '\')"  style="border-radius: 0px; border-width: 0px 0px 1px 0px; border-style: solid; border-color: gray">' + username + '</a></li>');
			});
		})
		.fail(function (error) {
			console.error("ERROR: ", error);
		});
	}

	//triggers messaging with a target user
	message = function(target) {
		if (target === loggedInUser) {
			$.notify({
				message: "Can't message yourself."
			},{
				element: "#iframeModal",
				type: "info"
			});
		} else {
			$("#iframeModal").modal("hide");
			openMessageModal();
			setActiveChat(target);
		}
	}

	openMessageModal = function() {
		$("#message-badges").html(""); //clear badges
		$('#message-modal').modal('show'); //then show modal
	}

	//sets chat with a target user
	setActiveChat = function(target) {
		if (target !== target_user) { //ignore if target is already active
			$(".user-labels").removeClass("active"); //clear pre-existing active label
			$("#" + target + "_label").addClass("active");

			$("#message-target-label").html("Talking to <b>" + target + "</b>");

			target_user = target;

			$("#" + target + "_newlabel").html(""); //remove "new" tag
			$("#messages").empty();

			if (Object.keys(messages).indexOf(target_user) !== -1 && messages[target_user].length > 0) {
				targetMessages = messages[target_user];

				targetMessages.forEach(function(msg) {
					if (msg[2]) {
						$("#messages").append("<div style='background-color: lightskyblue; text-align: right; padding: 5px; color: darkblue; margin-top: 5px; width:60%; position: relative; left: 40%; border-radius: 10px; word-wrap: break-word'> " + msg[0] + "</div>");
					} else {
						$("#messages").append("<div style='background-color: lightgreen; text-align:left; padding: 5px; color: darkgreen; margin-top: 5px; width:60%; position: relative; border-radius: 10px; word-wrap: break-word'> " + msg[0] + "</div>");
					}
				});
			}
		}
	}

	//Handles submitting a message
	$("#message-form").submit(function(event) {
		event.preventDefault();

		if (target_user === "") {
			$.notify({
				message: "No user selected."
			},{
				element: "#message-modal",
				type: "info"
			});
		} else if ($("#message-content").val() !== "") {
			var date = new Date();
			var msg = $("#message-content").val();

			if (Object.keys(messages).indexOf(target_user) === -1) {
				messages[target_user] = [];
			}
			messages[target_user].push([msg, date.toLocaleString(), true]);
			$("#messages").append("<div style='background-color: lightskyblue; text-align: right; padding: 5px; color: darkblue; margin-top: 5px; width:60%; position: relative; left: 40%; border-radius: 10px; word-wrap: break-word'> " + msg + "</div>");
			socket.emit("chat message", msg, loggedInUser, target_user, date.toLocaleString());
			$("#message-content").val(""); //clear message textfield after its sent
		}
	});

	//Clears messages
	$("#message-clear").click(function(event) {
		event.preventDefault();
		$("#messages").empty();
	});

	//if a user logged in since we logged in, populate user list
	socket.on("login user", function(username) {
		$("#" + username + "_label").remove(); //remove from offline

		$("#online-badges").html(parseInt($("#online-badges").html()) + 1);
		$("#online").append('<li role="presentation" class="user-labels" id="' + username + '_label"><a id="' + username + '_button" href="#" onclick="setActiveChat(\'' + username + '\')" style="border-radius: 0px; border-width: 0px 0px 1px 0px; border-style: solid; border-color: gray">' + username + ' <i id="' + username + '_newlabel" style="font-size:10px; color: red"></i></a></li>');
	
		if (target_user === username) {
			$("#" + target_user + "_label").addClass("active");
		}

		if ($("#offline-badges").html() == "1" || $("#offline-badges").html() == "0") {
			$("#offline-badges").html("0");
		} else {
			$("#offline-badges").html(parseInt($("#offline-badges").html()) - 1);
		}
	});

	//if a user logged out since we logged in, remove that user from the user list
	socket.on("logout user", function(username) {
		if ($("#online-badges").html() == "1" || $("#online-badges").html() == "0") {
			$("#online-badges").html("0");
		} else {
			$("#online-badges").html(parseInt($("#online-badges").html()) - 1);
		}
		$("#" + username + "_label").remove();
		if (target_user === username) {
			target_user = "";
			$("#messages").empty();
		}

		$("#offline-badges").html(parseInt($("#offline-badges").html()) + 1);
		$("#offline").append('<li role="presentation" class="user-labels" id="' + username + '_label"><a id="' + username + '_button" href="#" onclick="setActiveChat(\'' + username + '\')"  style="border-radius: 0px; border-width: 0px 0px 1px 0px; border-style: solid; border-color: gray">' + username + '</a></li>');
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
			} else if (target_user !== src) {
				$("#" + src + "_newlabel").html("new");
			}

			if (Object.keys(messages).indexOf(src) === -1) {
				messages[src] = [];
			}
			messages[src].push([msg, date, false]);
			if (src === target_user) {
				$("#messages").append("<div style='background-color: lightgreen; text-align:left; padding: 5px; color: darkgreen; margin-top: 5px; width:60%; position: relative; border-radius: 10px; word-wrap: break-word'> " + msg + "</div>");
			}
		}
	});
});