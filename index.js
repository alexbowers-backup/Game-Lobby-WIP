var express = require('express');
var socket = require('socket.io');
var jade = require('jade');
var port = (process.env.PORT) ? process.env.PORT : 80;
var app = express();
var users = [];

var io = socket.listen(app.listen(port));
console.log('Server running on port ' + port);

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', jade.__express);
app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function (client) {
    client.on('username', function (username) {
        var regexp = /^(?=.{4,12}$)[A-Za-z0-9]+(?:[_][A-Za-z0-9]+)*$/;
        if (!regexp.test(username)) {
            client.emit('login error', 'Your username is incorrect');
            client.disconnect();
            return;
        }
        if (!(users.indexOf(username) === -1)){
            client.emit('login error', 'This username is already taken');
            client.disconnect();
            return;
        }
        client.username = username;
        users.push(client.username);
        client.emit('login', users);
        client.broadcast.emit('connected user', client.username);
        logUserActions(client.username, 'connected');
    });
    client.on('start', function () {
        if (!(client.username === users[0])) return;
        io.sockets.emit('game started');
    });
    client.on('leave', function () {
       client.disconnect();
    });
    client.on('disconnect', function () {
        if (!client.username) return;
        if (client.username === users[0])
            client.broadcast.emit('kick', 'Master left the lobby');
        var index = users.indexOf(client.username);
        users.splice(index, 1);
        client.broadcast.emit('disconnected user', index);
        logUserActions(client.username, 'disconnected');
    });
});


app.get('/', function(req, res){
    res.render('lobby');
});

function logUserActions (name, action) {
    var date = new Date();
    console.log(
        date.getHours() + ':' +
        date.getMinutes() + ':' +
        date.getSeconds() +
        ' [' + name + '] ' +
        action
    );
}
