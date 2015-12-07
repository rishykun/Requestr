var configureReviewModal;

$(document).ready(function() {
	/*
		Instantiates review submission function
	*/
	$(".review-form").submit(function (event) {
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
			$('#review-modal').modal('hide');
			clearReviewModal();
		}).fail(function (error) {
			console.error("ERROR: ", error);
			$("#review-error").html("Your review could not be submitted.");
		});
	});

	//Modifies the review modal window accordingly to the participants of a request
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

			$(".review-form").attr('id', request._id);
		});
	}

	/*
		Clears review modal
	*/
	var clearReviewModal = function () {
	    $(".review-form").attr('id', "");
	    $("#review-victim").html("");
	    $("#review-text").val("");
	    $("#review-success").html("");
	    $("#review-error").html("");
	    $("#review-rating-default").attr("selected", "selected");
	}

	/*
		Clear the review modal when it closes.
	*/
	$('#review-modal').on('hidden.bs.modal', function () {
		clearReviewModal();
	});
});