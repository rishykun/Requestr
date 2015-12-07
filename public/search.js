var getSearchRequests;

$(document).ready(function() {

	/*
		Gets requests from search. Filters search by keyword, tags passed in from front end.
	*/
	getSearchRequests = function(e) {
		if(e) { //Basic search
			if(e.keyCode == 13) {
				// keyword
				var keyword = $("#request-search").val();
				var keyArray = (keyword === "") ? [] : keyword.split(",");
				// Trim the beginning and end spaces off all tags in the array
				keyArray = keyArray.map(function(key){
					return key.trim();
				});
				$.post("/requests/search", {
					"keywords": keyArray,
					"tags": null,
					"startDate": null,
					"endDate": null
				})
				.done(function(results) {
					$.post("/", {
						"passedData": results.content.requests
					})
					.done(function(result) {
						try {
							var resultBody  = result.split("<body")[1].split(">").slice(1).join(">").split("</body>")[0];
							$("body").html(resultBody);
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
				.fail(function(error) {
					console.error("ERROR: ", error);
				});
			}
		}
		else { //Advanced search

			var tagsString = $("#request-search-tags").val();
			var tagsArray = tagsString === "" ? [] : tagsString.split(",");

			// Trim the beginning and end spaces off all tags in the array
			tagsArray = tagsArray.map(function(tag){
				return tag.trim();
			});

			var keyword = $("#request-search-keyword").val();
			var keyArray = keyword === "" ? [] : keyword.split(",");
			
			// Trim the beginning and end spaces off all tags in the array
			keyArray = keyArray.map(function(key){
				return key.trim();
			});

			var startDate = $("#request-search-expire-start").val();
			var endDate = $("#request-search-expire-end").val();
			$.post("/requests/search", {
				"tags": tagsArray,
				"keywords": keyArray,
				"startDate": startDate,
				"endDate": endDate,
			})
			.done(function(results) {
				$.post("/", {
					"passedData": results.content.requests
				})
				.done(function(result) {
					try {
						var resultBody  = result.split("<body")[1].split(">").slice(1).join(">").split("</body>")[0];
						$("body").html(resultBody);
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
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
		}
	}
});