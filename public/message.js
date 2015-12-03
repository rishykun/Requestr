var socket = io();

$(document).ready(function() {
	$("#message-form").submit(function(event) {
		event.preventDefault();
		if ($("#message-content").val() !== "") {
			var username = $("#username").text();
			var date = new Date();
			socket.emit("chat message", $("#message-content").val(), username, username, date.toString());
			//TODO, REPLACE THIRD ARGUMENT WITH INTENDED TARGET
			$("#message-content").val("");
		}
	});

	$("#message-clear").click(function(event) {
		event.preventDefault();
		console.log("reached")
		$("#messages").empty();
	});

	socket.on("chat message", function(msg, src, dest, date) {
		var username = $("#username").text();
		if (dest === username) {
			if ($("#messages").text() !== "") {
				$("#messages").append("<br>");
			}
			$("#messages").append($("<b>").text(date + " " + src + ": ").append(msg));
		}
	});
});