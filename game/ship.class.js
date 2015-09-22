var config = require('../game-config');

var Ship = function (props) {
    if (props.team == 'left') {
        this.direction = 'right';
    }
    else if (props.team == 'right'){
        this.direction = 'left';
    }
    this.col = props.col;
    this.row = props.row;
    this.type = 'ship';

    this.name = props.name;
    this.team = props.team;
    this.hp = config.ship.hp;
    this.cannonDamage = config.ship.cannonDamage;
    this.bumpDamage = config.ship.bumpDamage;
    this.isDamaged = false;
    this.isDead = false;
    this.showCircle = false;
    this.prevPosition = {};
    this.movesOrder = [];
    this.roundMoves = [
        {
            move: 'stay',
            fire: 'no'
        },
        {
            move: 'stay',
            fire: 'no'
        },
        {
            move: 'stay',
            fire: 'no'
        },
        {
            move: 'stay',
            fire: 'no'
        }
    ];
};

module.exports = Ship;