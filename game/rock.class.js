var Rock = function (props) {
    this.col = props.col;
    this.row = props.row;
    this.shift = Math.floor(Math.random() * 2);
    this.type = 'rock';
};

module.exports = Rock;