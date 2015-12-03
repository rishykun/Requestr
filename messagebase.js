var loggedInUsers = {};

var messages = {}; //key = target_user, value = dictionary where key = src, value = array of message tuples (msg, date, self?) including self, msg

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
				if (Object.keys(messages).indexOf(to) === -1) {
					messages[to] = {};
				}
				if (Object.keys(messages[to]).indexOf(from) === -1) {
					messages[to][from] = [];
				}
				messages[to][from].push([msg, date, false]);
				console.log("\n\t1: ", messages[to]);
				if (Object.keys(messages).indexOf(from) === -1) {
					messages[from] = {};
				}
				if (Object.keys(messages[from]).indexOf(to) === -1) {
					messages[from][to] = [];
				}
				messages[from][to].push([msg, date, true]);
				console.log("\t2: ", messages[from]);
				console.log("\tmessages: ", messages); //debug

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

	//get all messages associated with the specified user
	that.getMessagesByUsername = function(username) {
		console.log("that.getMessagesByUsername() called"); //debug

		if (Object.keys(messages).indexOf(username) !== -1) {
			console.log("returning ", messages[username]); //debug
			return messages[username];
		} else {
			console.log("returning nothing {}"); //debug
			return {};
		}
	}

	Object.freeze(that); //prevent any further modifications to the member fields and methods of this class
	return that;
})();

module.exports = Messagebase;