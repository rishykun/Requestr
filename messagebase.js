var loggedInUsers = {};

var Messagebase = (function Messagebase() {
	var that = Object.create(Messagebase.prototype);

	var io = null;

	that.setIO = function(IO) {
		io = IO;

		//io connection
		io.on('connection', function(socket){
			console.log('a user connected');
			socket.on('disconnect', function(){
				console.log('user disconnected');
			});

			socket.on('chat message', function(msg, from, to, date) {
				console.log('message: ' + msg + " from " + from + " to " + to + " on " + date);
				io.emit("chat message", msg, from, to, date);
			});
		});
	}

	that.login = function(username) {
		loggedInUsers[username] = true;
		if (io) {
			io.emit("login user", username);
		}
	}

	that.logout =  function(username) {
		loggedInUsers[username] = false;
		if (io) {
			io.emit("logout user", username);
		}
	}

	that.getActiveUsers = function() {
		return loggedInUsers;
	}
	Object.freeze(that); //prevent any further modifications to the member fields and methods of this class
	return that;
})();

module.exports = Messagebase;