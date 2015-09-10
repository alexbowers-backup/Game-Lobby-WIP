//collision
var game;
var username;
var config;
var gameInit = function () {
    var canvasWrap = document.getElementById('game-wrap');
    var canvas = document.getElementById("game");
    var tooltip = document.getElementById('tooltip');
    var curCol, curRow;
    var safeZoneImage = new Image();
    var openSeaImage = new Image();
    safeZoneImage.src = 'images/safe-zone.png';
    openSeaImage.src = 'images/open-sea.png';
    canvas.width = config.field.width;
    canvas.height = config.field.height;
    canvas.onmousemove = function showTooltip(e) {
        var mouseX, mouseY;
        var wrapX = (e.pageX - canvasWrap.offsetLeft) * 0.99;
        var wrapY = (e.pageY - canvasWrap.offsetTop) * 0.97;

        if(e.offsetX) {
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        }
        else if(e.layerX) {
            mouseX = e.layerX;
            mouseY = e.layerY;
        }
        var newCol = Math.floor(mouseX / game.field.cellWidth());
        var newRow = Math.floor(mouseY / game.field.cellHeight());

        if (newCol != curCol || newRow != curRow) {
            if (isNaN(newCol) || isNaN(newRow)) return;
            curCol = newCol;
            curRow = newRow;
        }
        for (var i in game.ships) {
            var ship = game.ships[i];
            if (curCol == ship.col && curRow == ship.row) {
                tooltip.style.top = (wrapY + 30) + 'px';
                tooltip.style.left = (wrapX + 30) + 'px';
                tooltip.innerHTML = '' +
                    'Name: <b>' + ship.name + '</b> <br>' +
                    'HP: ' + ship.hp;
                tooltip.style.display = 'block';
                ship.showCircle = true;
                break;
            }
            else {
                tooltip.style.display = 'none';
                ship.showCircle = false;
            }
        }
    };

    if (canvas.getContext) {
        game = {
            ctx: canvas.getContext("2d"),
            ships: [],
            flags: [],
            score: {
                left: 0,
                right: 0
            },
            field: {
                columns: config.field.columns,
                rows: config.field.rows,
                width: config.field.width,
                height: config.field.height,
                cellWidth: function () {
                    return this.width / this.columns
                },
                cellHeight: function () {
                    return this.width / this.columns
                }
            },
            drawGrid: function () {
                //width
                for (var i = 1; i < this.field.columns; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(i * this.field.cellWidth(), 0);
                    this.ctx.lineTo(i * this.field.cellWidth(), this.field.height);
                    this.ctx.stroke();
                }
                //height
                for (var i = 1; i < this.field.rows; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, i * this.field.cellHeight());
                    this.ctx.lineTo(this.field.width, i * this.field.cellHeight());
                    this.ctx.stroke();
                }
            },
            drawZones: function () {
                for (var i = 0; i < game.field.columns; i++) {
                    for (var j = 0; j < config.field.rows; j++) {
                        this.ctx.drawImage(safeZoneImage, this.field.cellWidth() * i, this.field.cellHeight() * j);
                    }
                    if (i === 2) {
                        i = game.field.columns - 4;
                    }
                }
                for (var i = 3; i < game.field.columns - 3; i++) {
                    for (var j = 0; j < config.field.rows; j++) {
                        this.ctx.drawImage(openSeaImage, this.field.cellWidth() * i, this.field.cellHeight() * j);
                    }

                }
            },
            drawShip: function (ship) {
                var shift = 0;
                if (ship.isDead) {
                    this.ctx.fillStyle = 'black';
                }
                else {
                    if (ship.name === game.userShip.name) {
                        this.ctx.fillStyle = config.colors.userColor;
                        ship.teamColor = config.colors.allyColor;
                    }
                    else if (ship.team === game.userShip.team) {
                        this.ctx.fillStyle = config.colors.allyColor;
                        ship.teamColor = config.colors.allyColor;
                    }
                    else {
                        this.ctx.fillStyle = config.colors.enemyColor;
                        ship.teamColor = config.colors.enemyColor;
                    }
                }
                var triangle = new Path2D();
                if (ship.isDamaged) {
                    shift = ship.isDamaged % 2 ? 5 : -5;
                }
                switch (ship.direction) {
                    case 'right':
                        triangle.moveTo(
                            ship.col * this.field.cellWidth() + this.field.cellHeight() / 4,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() / 4 + shift
                        );
                        triangle.lineTo(
                            ship.col * this.field.cellWidth() + this.field.cellHeight() / 4,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() * 0.75 + shift
                        );
                        triangle.lineTo(
                            ship.col * this.field.cellWidth() + this.field.cellWidth() * 0.75,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() / 2 + shift
                        );
                        break;
                    case 'left':
                        triangle.moveTo(
                            ship.col * this.field.cellWidth() + this.field.cellWidth() * 0.75,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() / 4 + shift
                        );
                        triangle.lineTo(
                            ship.col * this.field.cellWidth() + this.field.cellWidth() * 0.75,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() * 0.75 + shift
                        );
                        triangle.lineTo(
                            ship.col * this.field.cellWidth() + this.field.cellHeight() / 4,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() / 2 + shift
                        );
                        break;
                    case 'up':
                        triangle.moveTo(
                            ship.col * this.field.cellWidth() + this.field.cellHeight() / 4 + shift,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() * 0.75
                        );
                        triangle.lineTo(
                            ship.col * this.field.cellWidth() + this.field.cellWidth() * 0.75 + shift,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() * 0.75
                        );
                        triangle.lineTo(
                            ship.col * this.field.cellWidth() + this.field.cellHeight() / 2 + shift,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() / 4
                        );
                        break;
                    case 'down':
                        triangle.moveTo(
                            ship.col * this.field.cellWidth() + this.field.cellHeight() / 4 + shift,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() / 4
                        );
                        triangle.lineTo(
                            ship.col * this.field.cellWidth() + this.field.cellWidth() * 0.75 + shift,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() / 4
                        );
                        triangle.lineTo(
                            ship.col * this.field.cellWidth() + this.field.cellHeight() / 2 + shift,
                            ship.row * this.field.cellHeight() + this.field.cellHeight() * 0.75
                        );
                        break;
                }

                this.ctx.fill(triangle);
            },
            drawFlag: function (flag) {
                this.ctx.fillStyle = flag.color;
                this.ctx.fillRect(
                    flag.col * this.field.cellWidth() + this.field.cellWidth() * 0.125,
                    flag.row * this.field.cellHeight() + this.field.cellHeight() * 0.25,
                    this.field.cellWidth() * 0.750,
                    this.field.cellHeight() * 0.5
                );
                this.ctx.fillStyle = flag.color === 'white' ? 'black': 'white';
                this.ctx.font = (this.field.cellWidth() * 0.375) + 'px Arial';
                this.ctx.fillText(
                    flag.points,
                    (flag.col * this.field.cellWidth() + this.field.cellWidth() * 0.5) - (this.field.cellWidth() * 0.375) * 0.25,
                    (flag.row * this.field.cellHeight() + this.field.cellHeight() * 0.5) + (this.field.cellWidth() * 0.375) * 0.33
                );

                //flag.col * this.field.cellWidth() + this.field.cellHeight() / 4 + shift;
                //flag.row * this.field.cellHeight() + this.field.cellHeight() / 4;
            },
            drawCircle: function (ship) {
                this.ctx.beginPath();
                this.ctx.arc(
                   ship.col * this.field.cellWidth() + this.field.cellWidth() * 0.5,
                   ship.row * this.field.cellHeight() + this.field.cellHeight() * 0.5,
                   this.field.cellWidth() * 3.5,
                   0, 2 * Math.PI,
                   false
                );
                //this.ctx.strokeStyle = 'black';
                this.ctx.stroke();
            },
            update: function () {
                var game = this;
                game.resolveCollisions();
                game.drawZones();
                game.drawGrid();
                game.flags.forEach(function (flag) {
                    game.drawFlag(flag);
                });
                game.ships.forEach(function (ship, i) {
                    if (ship.isDamaged === true) {
                        game.ships[i].isDamaged = 1;
                    }
                    game.drawShip(ship);
                    if (ship.showCircle) {
                        game.drawCircle(ship);
                    }
                    if (ship.isDamaged !== false) {
                        game.ships[i].isDamaged++;
                    }
                    if (ship.isDamaged > 10) {
                        game.ships[i].isDamaged = false;
                    }
                });
            },
            getShip: function (col, row) {
                for (var i in this.ships) {
                    var ship = this.ships[i];
                    if (ship.col === col && ship.row === row) {
                        return ship;
                    }
                }
                return false;
            },
            checkFlag: function (flag, lastRound) {
                var ships = [];
                var game = this;
                game.ships.forEach(function (ship) {
                    var shipX = (ship.col + 0.5) * game.field.cellWidth();
                    var shipY = (ship.row + 0.5) * game.field.cellHeight();
                    var flagX = (flag.col + 0.5) * game.field.cellWidth();
                    var flagY = (flag.row + 0.5) * game.field.cellHeight();
                    var flagR = game.field.cellWidth() * 3.5;
                    if (Math.pow(shipX - flagX, 2) + Math.pow(shipY - flagY, 2) < Math.pow(flagR, 2)) {
                        ships.push(ship);
                    }
                });
                var teams = {
                    left: false,
                    right: false
                };
                var points = {
                    left: 0,
                    right: 0
                };
                var div = document.getElementById('message-wrap');
                div.innerHTML = '';
                flag.color = 'white';
                ships.forEach(function (ship) {
                    div.innerHTML += ship.name + '<br>';
                    teams[ship.team] = true;
                    if (teams.left && teams.right) {
                        flag.color = 'black';
                        points.left = 0;
                        points.right = 0;
                    }
                    else {
                        flag.color = ship.teamColor;
                        if (lastRound) {
                            points[ship.team] = flag.points;
                        }
                    }
                });
                game.score.left += points.left;
                game.score.right += points.right;
            },
            checkCollision: function (col, row) {
                var ships = [];
                for (var i in this.ships) {
                    var ship = this.ships[i];
                    if (ship.col === col && ship.row === row) {
                        ships.push(ship);
                    }
                }
                return ships.length > 1 ? ships : false;
            },
            resolveCollisions: function (move) {
                var ships = [];
                for (var i = 0; i < config.field.columns; i++) {
                    for (var j = 0; j < config.field.rows; j++) {
                        if (ships = this.checkCollision(i, j)) {

                            ships.forEach(function (ship) {
                                if (ship.turning)
                                    ship.turning = false;
                                if (ship.roundMoves[move].move !== undefined && ship.roundMoves[move].move !== 'stay')
                                    ship.restorePosition();
                                ship.takeDamage(ship.bumpDamage);
                            });
                        }
                    }
                }
            },
            runMove: function (move) {
                var turningShips = [];
                this.ships.forEach(function (ship) {
                    ship.turning = false;
                    if (ship.isDead) return;
                    if (!ship.roundMoves.length) return;
                    switch (ship.roundMoves[move].move) {
                        case 'forward':
                            ship.forwardMove();
                            break;
                        case 'turn-left':
                            if (ship.forwardMove())
                                turningShips.push(ship);
                            ship.rotate('left');
                            ship.turning = true;
                            break;
                        case 'turn-right':
                            if (ship.forwardMove())
                                turningShips.push(ship);
                            ship.rotate('right');
                            ship.turning = true;
                            break;
                        case 'stay':
                        default:
                            return;
                    }
                });
                this.resolveCollisions(move);
                turningShips.forEach(function (ship) {
                    if (ship.turning)
                        ship.forwardMove();
                });
                this.resolveCollisions(move);
                this.ships.forEach(function (ship) {
                    if (ship.isDead) return;
                    if (!ship.roundMoves.length) return;
                    switch (ship.roundMoves[move].fire) {
                        case 'left':
                            ship.cannonFire('left');
                            break;
                        case 'right':
                            ship.cannonFire('right');
                            break;
                        case 'no':
                        default:
                            return;
                    }
                });
            },
            getShipByName: function (name) {
                for (var i in this.ships) {
                    var ship = this.ships[i];
                    if (ship.name === name) {
                        return ship;
                    }
                }
                return false;
            },
            setUserShip: function (name) {
               this.userShip = this.getShipByName(name);
            },
            updateShips: function (ships) {
                this.ships = ships;
                this.setUserShip(username);
                ships.forEach(function (ship) {
                    ship.rotate = function (side) {
                        var directions = ['up', 'right', 'down', 'left'];
                        var dirIndex = directions.indexOf(this.direction);
                        if (side == 'left') dirIndex--;
                        else if (side == 'right') dirIndex++;
                        if (dirIndex == -1) dirIndex = 3;
                        else if(dirIndex == 4) dirIndex = 0;
                        this.direction = directions[dirIndex];
                    };
                    ship.forwardMove = function () {
                        this.savePosition();
                        switch (this.direction) {
                            case 'up':
                                if (this.row === 0) {
                                    this.takeDamage(this.bumpDamage);
                                    return false;
                                }
                                this.row--;
                                break;
                            case 'down':
                                if (this.row === config.field.rows - 1) {
                                    this.takeDamage(this.bumpDamage);
                                    return false;
                                }
                                this.row++;
                                break;
                            case 'left':
                                if (this.col === 0) {
                                    this.takeDamage(this.bumpDamage);
                                    return false;
                                }
                                this.col--;
                                break;
                            case 'right':
                                if (this.col === config.field.columns - 1) {
                                    this.takeDamage(this.bumpDamage);
                                    return false;
                                }
                                this.col++;
                                break;
                        }
                        return true;
                    };
                    ship.turnMove = function (side) {
                        if (!this.forwardMove()) {
                            this.rotate(side);
                            return false;
                        }
                        this.rotate(side);
                        return this.forwardMove();
                    };
                    ship.move = function (move) {
                        switch (move) {
                            case 'forward':
                                this.movesOrder.push('forward');
                                break;
                            case 'turn-left':
                                this.movesOrder.push('forward');
                                this.movesOrder.push('rotate');
                                this.movesOrder.push('left');
                                this.movesOrder.push('forward');
                                break;
                            case 'turn-right':
                                this.movesOrder.push('forward');
                                this.movesOrder.push('rotate');
                                this.movesOrder.push('right');
                                this.movesOrder.push('forward');
                                break;
                            case 'stay':
                                this.movesOrder.push('stay');
                                break;
                            case 'fire-no':
                                this.movesOrder.push('fire');
                                this.movesOrder.push('no');
                                break;
                            case 'fire-left':
                                this.movesOrder.push('fire');
                                this.movesOrder.push('left');
                                break;
                            case 'fire-right':
                                this.movesOrder.push('fire');
                                this.movesOrder.push('right');
                                break;
                        }
                    };
                    ship.takeDamage = function (val) {
                        if ((this.col < 3 || this.col > config.field.columns - 4) || this.isDead)
                            return;
                        this.hp -= val;
                        this.isDamaged = true;
                        if (this.hp <= 0){
                            this.hp = 0;
                            this.isDead = true;
                        }
                    };
                    ship.cannonFire = function (side) {
                        var modifier, ship;
                        if (side === 'left')
                            modifier = -1;
                        else if (side === 'right')
                            modifier = 1;
                        for (var i = 1; i <= config.ship.cannonRange; i++) {
                            switch (this.direction) {
                                case 'right':
                                    ship = game.getShip(this.col, this.row + i * modifier);
                                    break;
                                case 'left':
                                    ship = game.getShip(this.col, this.row - i * modifier);
                                    break;
                                case 'up':
                                    ship = game.getShip(this.col + i * modifier, this.row);
                                    break;
                                case 'down':
                                    ship = game.getShip(this.col - i * modifier, this.row);
                                    break;
                            }
                            if (ship) ship.takeDamage(this.cannonDamage);
                        }
                    };
                    ship.savePosition = function () {
                        this.prevPosition = {
                            //direction: this.direction,
                            col: this.col,
                            row: this.row
                        };
                    };
                    ship.restorePosition = function () {
                        if (!Object.keys(this.prevPosition).length) {
                            return;
                        }
                        //this.direction = this.prevPosition.direction;
                        this.col = this.prevPosition.col;
                        this.row = this.prevPosition.row;
                    };
                    ship.getSideCells = function () {
                        var cells = [];
                        switch (this.direction) {
                            case 'right':
                            case 'left':
                                cells.push({
                                        col: this.col,
                                        row: this.row - 1
                                    }, {
                                        col: this.col,
                                        row: this.row + 1
                                    }
                                );
                                break;
                            case 'up':
                            case 'down':
                                cells.push({
                                        col: this.col - 1,
                                        row: this.row
                                    }, {
                                        col: this.col + 1,
                                        row: this.row
                                    }
                                );
                                break;
                        }
                        return cells;
                    };
                })
            }
        };
    }

    var lastTime;
    var requiredElapsed = 40;

    requestAnimationFrame(loop);

    function loop(now) {
        requestAnimationFrame(loop);

        if(!lastTime){
            lastTime = now;
        }
        var elapsed = now - lastTime;

        if(elapsed > requiredElapsed){
            //console.log(game.ships);
            game.update();
            lastTime = now;
        }
    }
};