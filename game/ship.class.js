var config = require('../game-config');

var Ship = function (options) {
    if (options.team == 'left') {
        this.direction = 'right';
    }
    else if (options.team == 'right'){
        this.direction = 'left';
    }
    this.col = options.col;
    this.row = options.row;

    this.name = options.name;
    this.team = options.team;
    this.hp = config.ship.hp;
    this.cannonDamage = config.ship.cannonDamage;
    this.bumpDamage = config.ship.bumpDamage;
    this.isDamaged = false;
    this.isDead = false;
    this.showCircle = false;
    this.prevPosition = {};
    this.movesOrder = [];
    this.roundMoves = [];
};

module.exports = Ship;