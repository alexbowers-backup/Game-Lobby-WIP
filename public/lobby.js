window.onload = function () {

    var form = document.getElementById('username-form');
    var lobby = document.getElementById('lobby-wrap');
    var startBtn = document.getElementById('start-btn');
    var leaveBtn = document.getElementById('leave-btn');
    var messageDiv = document.getElementById('message-wrap');
    var users = [];
    var username = '';

    form.onsubmit = function () {
        connection('on');
        username = document.getElementById('username').value;
        socket.emit('username', username);

        socket.on('login', function (usersArr) {
            users = usersArr;
            updateUsersList(users);
            lobby.style.display = 'inline-block';
            form.style.display = 'none';
            messageDiv.innerHTML = '';
            startBtn.style.display = users[0] === username
                ? 'inline-block'
                : 'none';
        });
        socket.on('login error', function (error) {
            showMessage('alert', error);
        });
        socket.on('kick', function(error) {
            showMessage('alert', error);
            logout();
        });
        socket.on('game started', function () {
            var message = 'Game Started';
            if (username === users[0]) message += '<br/>You are the master';
            showMessage('message', message);
        });
        socket.on('connected user', function (username) {
           users.push(username);
            updateUsersList(users);
        });
        socket.on('disconnected user', function (index) {
            users.splice(index, 1);
            updateUsersList(users);
        });

        return false;
    };

    startBtn.onclick = function () {
        socket.emit('start');
    };
    leaveBtn.onclick = logout;

    function connection(state) {
        if (state === 'on') {
            if (!window.socket)
                socket = io.connect(window.location.href);
            else if (socket.disconnected)
                socket = io.connect(window.location.href, {'forceNew': true});
        }
        else if (state === 'off')
            socket.disconnect();
    }
    function logout() {
        connection('off');
        lobby.style.display = 'none';
        form.style.display = 'inline-block';
    }
    function updateUsersList(users) {
        var usersList = document.getElementById('users-list');
        var usersArr = users.slice();
        var usersListHTML = '';
        var master = usersArr.shift();
        usersArr.sort();
        usersListHTML += '<span id="master">' + master + '</span><br/>';
        usersArr.forEach(function (user) {
            var currUser = user === username ? ' id="user"' : '';
            usersListHTML += '<span' + currUser + '>' + user + '</span><br/>';
        });
        usersList.innerHTML = usersListHTML;
    }
    function showMessage(type, message) {
        messageDiv.innerHTML = '<div class="' + type + '">' + message + '</div>';
    }
};