/*
	general javascript functions that serve as utility functions
*/

goHome = function() {
	location.href="/";
}

goBack = function() {
	window.history.back();
}

var openIframeModal;

$(document).ready(function() {
	openIframeModal = function(src) {
		console.log("setting src: ", src); //debug

		$("#iframe").attr("src", src); //set iframe
		$("#iframeModal").modal("show"); //open modal containing iframe
	}
});