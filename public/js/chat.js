const input = $('#room input');
const form = $('#room form');
const ul = $('#room ul');

// const socket = io.connect();
const socket = io.connect('', {
	reconnect: false
});


socket
	.on('message', function (username, message) {
		printMessage(username + "> " + message);
	})
	.on('leave', function (username) {
		printStatus(username + " left chat");
	})
	.on('join', function (username) {
		printStatus(username + " joined the chat");
	})
	.on('connect', function () {
		printStatus("connection established");
		form.on('submit', sendMessage);
		input.prop('disabled', false);
	})
	.on('disconnect', function () {
		printStatus("connection lost");
		form.off('submit', sendMessage);
		input.prop('disabled', true);
		this.$emit('error');
	})
	.on('logout', function () {
		location.href = "/";
	})
	.on('error', function (reason) {
		if (reason == "handshake unauthorized") {
			printStatus("you left the chat");
		} else {
			setTimeout(function () {
				socket.socket.connect();
			}, 500);
		}
	});

function sendMessage() {
	var text = input.val();
	socket.emit('message', text, function () {
		printMessage("I > " + text);
	});

	input.val('');
	return false;
}

function printStatus(status) {
	$('<li>').append($('<i>').text(status)).appendTo(ul);
}

function printMessage(text) {
	$('<li>').text(text).appendTo(ul);
}