var express = require('express');
var socket = require('socket.io');
var path = require('path');
var Ship = require('./game/ship.class');
var config = require('./game-config');
//var jade = require('jade');
var port = (process.env.PORT) ? process.env.PORT : 80;
var app = express();

var io = socket.listen(app.listen(port));
console.log('Server running on port ' + port);

//app.set('views', __dirname + '/tpl');
//app.set('view engine', 'jade');
//app.engine('jade', jade.__express);
app.use(express.static(__dirname + '/public'));

io.rooms = {};
io.sockets.on('connection', function (client) {
    var room;
    var ships;
    var flags;
    client.on('create', function (username) {
        var regexp = /^(?=.{4,12}$)[A-Za-z0-9]+(?:[_][A-Za-z0-9]+)*$/;
        if (!regexp.test(username) || username === null) {
            client.emit('login error', 'Your username is incorrect');
            client.disconnect();
            return;
        }
        client.gameID = createRoom();
        client.join(client.gameID);
        room = io.rooms[client.gameID];
        client.username = username;
        room.users.push(client.username);

        //room.users.push('vasya', 'petya', 'grisha', 'dusya', 'nyusya', 'borya', 'lyusya', 'asdf', 'asdlfkj',
        //    'lsdfj', 'asdlfjl', 'aiowenf', 'osdhfa', 'oajkhq', 'osdf92'
        //);

        client.emit('login', {
            user: username,
            users: room.users,
            gameID: client.gameID
        });
        logUserActions(client.username, 'connected to (' + client.gameID + ')');
    });
    client.on('join', function (data) {
        username = data.username;
        client.gameID = data.gameID;
        room = io.rooms[client.gameID];
        if (!/^[0-9]{6}$/.test(client.gameID) || room === undefined) {
            client.emit('login error', 'Your gameID is incorrect');
            return client.disconnect();
        }
        var regexp = /^(?=.{4,12}$)[A-Za-z0-9]+(?:[_][A-Za-z0-9]+)*$/;
        if (!regexp.test(username) || username === null) {
            client.emit('login error', 'Your username is incorrect');
            return client.disconnect();
        }
        if (!(room.users.indexOf(username) === -1)) {
            client.emit('login error', 'This username is already taken');
            return client.disconnect();
        }
        if (room.isStarted) {
            client.emit('login error', 'The game has already started');
            return client.disconnect();
        }
        client.join(client.gameID);
        client.username = username;
        room.users.push(client.username);
        client.emit('login', {
            user: username,
            users: room.users,
            gameID: client.gameID
        });
        client.broadcast.to(client.gameID).emit('connected user', client.username);
        logUserActions(client.username, 'connected to (' + client.gameID + ')');
    });
    client.on('start', function () {
        console.log('start');
        if (client.username !== room.users[0]) return;
        room.isStarted = true;
        room.ships = [];
        room.users.forEach(function (user, i) {
            var team = i % 2 ? 'right' : 'left';
            //var team = 'left';
            coords = i % 2
                ? generateCoords(config.field.columns - 3, 0, config.field.columns - 1, config.field.rows - 1, room.ships)
                : generateCoords(0, 0, 2, config.field.rows - 1, room.ships);
            //coords = generateCoords(0, 0, 2, config.field.rows - 1, room.ships);
            room.ships.push(new Ship({
                name: user,
                team: team,
                col: coords.col,
                row: coords.row
            }));
        });
        room.flags = [];
        for (var i = 1; i <= 3; i++) {
            for (var j = 1; j <= config.flag.points[String(i)]; j++) {
                var coords = generateCoords(6, 1, config.field.columns - 7, config.field.rows - 2, room.flags);
                room.flags.push({
                    points: i,
                    color: 'white',
                    col: coords.col,
                    row: coords.row
                })
            }
        }
        //room.ships[0].col = 3;
        //room.ships[0].row = 2;
        //if (room.ships[1]) {
        //    room.ships[1].col = 4;
        //    room.ships[1].row = 3;
        //    room.ships[1].direction = 'up';
        //}

        io.sockets.in(client.gameID).emit('game started', {
            ships: room.ships,
            flags: room.flags,
            config: config
        });
    });
    client.on('round ended', function () {
        if (client.username !== room.users[0]) return;
        setTimeout(function () {
            io.sockets.in(client.gameID).emit('next round', {
                ships: room.ships
            });
        }, 1500);
    });
    client.on('round data', function (data) {
        var ship = getShip(room.ships, client.username);
        var updatingProps = [
            'direction',
            'col',
            'row',
            'hp',
            'isDamaged',
            'isDead',
            'prevPosition'
        ];
        updatingProps.forEach(function (prop) {
            ship[prop] = data.ship[prop];
        });
        ship.roundMoves = data.moves;
        //console.log(ship.name);
    });
    client.on('leave', function () {
        client.disconnect();
    });
    client.on('disconnect', function () {
        if (!client.username) return;
        if (client.username === room.users[0]){
            delete io.rooms[client.gameID];
            client.broadcast.to(client.gameID).emit('kick', 'Master left the room');
        }
        var index = room.users.indexOf(client.username);
        room.users.splice(index, 1);
        var ship = getShip(room.ships, client.username);
        ship.isDead = true;
        client.broadcast.to(client.gameID).emit('disconnected user', {
            user: client.username,
            users: room.users
        });
        logUserActions(client.username, 'disconnected from (' + client.gameID + ')');
    });
});

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + '/public/lobby.html'));
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
function createRoom() {
    var gameID = '';
    for (var i = 0; i < 6; i++)
        gameID += Math.floor(Math.random() * 10);
    if (io.rooms[gameID] === undefined) {
        io.rooms[gameID] = {users: []};
        return gameID;
    }
    createRoom();
}
function getShip(ships, name) {
    for (var i in ships) {
        var ship = ships[i];
        if (ship.name === name) {
            return ship;
        }
    }
    return false;
}
function generateCoords(minCol, minRow, maxCol, maxRow, arr) {
    var coords = {};
    var cols = (maxCol - minCol) + 1;
    var rows = (maxRow - minRow) + 1;
    var maxCells = cols * rows;
    if (maxCells < arr.length) return false;

    whileLoop:
    while (true) {
        coords.col = Math.floor(Math.random() * cols) + minCol;
        coords.row = Math.floor(Math.random() * rows) + minRow;
        var i = 0;
        do {
            var obj = arr[i];
            if (obj !== undefined && (obj.col === coords.col && obj.row === coords.row)) {
                continue whileLoop;
            }
            i++;
        }
        while (i < arr.length);
        return coords;
    }
}
