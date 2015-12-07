var makePayment;

$(document).ready(function() {

	/*
		Post request id of the request to be paid for as well as the user id for the user to be paid to the backend.
	*/
	makePayment = function(request_id, user_id, venmo_email){
		$.post('/requests/' + request_id + '/pay/' + user_id,{
				'venmo_email': venmo_email,
		}).done(function(data){
		}).fail(function(error){
		});
	}
});