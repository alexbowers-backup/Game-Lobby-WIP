var express = require('express');
var socket = require('socket.io');
var path = require('path');
var Ship = require('./game/ship.class');
var Flag = require('./game/flag.class');
var Wind = require('./game/wind.class');
var Rock = require('./game/rock.class');
var Whirlpool = require('./game/whirlpool.class');
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
    var sendLog = function (message) {
        io.sockets.emit('log', message);
    };
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

        //room.users.push(
            //'grisha', 'dusya', 'nyusya', 'borya', 'lyusya', 'asdf', 'asdlfkj',
            //'lsdfj', 'asdlfjl', 'aiowenf', 'osdhfa', 'oajkhq', 'osdf92',
            //'petya'
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
        logUserActions(client.username, 'connected (' + client.gameID + ')');
    });
    client.on('start', function () {
        if (client.username !== room.users[0]) return;
        logUserActions(client.username, 'started game (' + client.gameID + ')');
        sendLog('Game started');
        room.isStarted = true;
        room.ships = [];
        room.users.forEach(function (user, i) {
            var team = i % 2 ? 'right' : 'left';
            //var team = 'left';
            coords = i % 2
                ? generateCoords({
                    minCol: config.field.columns - 3,
                    minRow: 0,
                    maxCol: config.field.columns - 1,
                    maxRow: config.field.rows - 1,
                    objects: room.ships
                })
                : generateCoords({
                    minCol: 0,
                    minRow: 0,
                    maxCol: 2,
                    maxRow: config.field.rows - 1,
                    objects: room.ships
                });
            //coords = generateCoords(0, 0, 2, config.field.rows - 1, room.ships);
            room.ships.push(new Ship({
                name: user,
                team: team,
                col: coords.col,
                row: coords.row
            }));
        });
        room.flags = [];
        for (var i in config.flag.points) {
            for (var j = 1; j <= config.flag.points[i]; j++) {
                var coords = generateCoords({
                    minCol: 6,
                    minRow: 1,
                    maxCol: config.field.columns - 7,
                    maxRow: config.field.rows - 2,
                    objects: room.flags
                });
                room.flags.push(new Flag({
                    points: Number(i),
                    color: 'white',
                    col: coords.col,
                    row: coords.row
                }))
            }
        }
        room.winds = [];
        var windsNumber = Math.floor(Math.random() * (config.wind.numberRange[1] - config.wind.numberRange[0] + 1)) + config.wind.numberRange[0];
        var directions = ['left', 'right', 'up', 'down'];
        for (var i = 0; i < windsNumber; i++) {
            var coords = generateCoords({
                minCol: 3,
                minRow: 0,
                maxCol: config.field.columns - 4,
                maxRow: config.field.rows - 1,
                objects: room.flags.concat(room.winds)
            });
            room.winds.push(new Wind({
                direction: directions[Math.floor(Math.random() * 4)],
                col: coords.col,
                row: coords.row
            }));
        }
        room.whirlpools = [];
        for (var i = 0; i < config.whirlpool.number; i++) {
            var coords = generateCoords({
                minCol: 3,
                minRow: 0,
                maxCol: config.field.columns - 5,
                maxRow: config.field.rows - 2,
                objects: room.flags.concat(room.winds, room.whirlpools),
                mode: 'whirlpool'
            });
            room.whirlpools.push(new Whirlpool({
                col: coords.col,
                row: coords.row
            }));
        }
        room.rocks = [];
        for (var i = 0; i < config.rock.number; i++) {
            var coords = generateCoords({
                minCol: 3,
                minRow: 0,
                maxCol: config.field.columns - 4,
                maxRow: config.field.rows - 1,
                objects: room.flags.concat(room.winds, room.rocks)
            });
            room.rocks.push(new Rock({
                col: coords.col,
                row: coords.row
            }))
        }

        ////////////////////////// DEVELOPMENT /////////////////////////////////
        //room.ships[0].col = 3;
        //room.ships[0].row = 1;
        //room.ships[0].direction = 'right';
        //room.ships[0].animation.angle = 90;
        //room.ships[1].col = 4;
        //room.ships[1].row = 6;
        //room.ships[1].direction = 'left';
        //room.ships[1].animation.angle = 270;
        //room.winds[0].col = 4;
        //room.winds[0].row = 1;
        //room.winds[0].direction = 'down';
        //room.ships[1].col = 4;
        //room.ships[1].row = 5;
        //room.rocks[0].col = 4;
        //room.rocks[0].row = 2;
        //room.whirlpools[0].col = [4, 5, 5, 4];
        //room.whirlpools[0].row = [1, 1, 2, 2];
        ////////////////////////// DEVELOPMENT /////////////////////////////////

        io.sockets.in(client.gameID).emit('game started', {
            ships: room.ships,
            flags: room.flags,
            winds: room.winds,
            rocks: room.rocks,
            whirlpools: room.whirlpools,
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
            'prevPosition',
            'animation'
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
        sendLog('<b>' + client.username + '</b> has left the game');
        logUserActions(client.username, 'disconnected from (' + client.gameID + ')');
    });
});

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + '/public/lobby.html'));
});
function getTime() {
    var date = new Date();
    var time = [
        date.getHours() < 10 ? '0' + date.getHours() : date.getHours(),
        date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes(),
        date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
    ];
    return time.join(':');
}
function logUserActions (name, action) {
    console.log(
        getTime() +
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
function generateCoords(props) {
    var coords = {};
    var cols = (props.maxCol - props.minCol) + 1;
    var rows = (props.maxRow - props.minRow) + 1;
    var maxCells = cols * rows;
    if (maxCells < props.objects.length) return false;

    if (props.mode === 'whirlpool') {
        whileLoop:
            while (true) {
                coords.col = Math.floor(Math.random() * cols) + props.minCol;
                coords.row = Math.floor(Math.random() * rows) + props.minRow;
                coords.col = [
                    coords.col,
                    coords.col + 1,
                    coords.col + 1,
                    coords.col
                ];
                coords.row = [
                    coords.row,
                    coords.row,
                    coords.row + 1,
                    coords.row + 1
                ];
                var i = 0;
                do {
                    var obj = props.objects[i] || {};
                    for (var k = 0; k < 4; k++) {
                        if (obj.type === 'whirlpool') {
                            for (var j = 0; j < 4; j++) {
                                if (obj.col[j] === coords.col[k] && obj.row[j] === coords.row[k]) {
                                    continue whileLoop;
                                }
                            }
                        }
                        else {
                            if (obj.col === coords.col[k] && obj.row === coords.row[k]) {
                                continue whileLoop;
                            }
                        }
                    }
                    i++;
                }
                while (i < props.objects.length);
                return coords;
            }
    }
    whileLoop:
    while (true) {
        coords.col = Math.floor(Math.random() * cols) + props.minCol;
        coords.row = Math.floor(Math.random() * rows) + props.minRow;
        var i = 0;
        do {
            var obj = props.objects[i] || {};
            if (obj.type === 'whirlpool') {
                for (var j = 0; j < 4; j++) {
                    if (obj.col[j] === coords.col && obj.row[j] === coords.row) {
                        continue whileLoop;
                    }
                }
            }
            else {
                if (obj !== undefined && (obj.col === coords.col && obj.row === coords.row)) {
                    continue whileLoop;
                }
            }
            i++;
        }
        while (i < props.objects.length);
        return coords;
    }
}
