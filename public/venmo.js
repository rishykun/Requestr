var makePayment;

$(document).ready(function() {
	makePayment = function(request_id, user_id, venmo_email){
		$.post('/requests/' + request_id + '/pay/' + user_id,{
				'venmo_email': venmo_email,
		}).done(function(data){
			console.log(data);
		}).fail(function(error){
			console.log("error");
		});
	}
});