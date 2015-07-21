// the Game object used by the phaser.io library
var stateActions = { preload: preload, create: create, update: update };

// Phaser parameters:
// - game width
// - game height
// - renderer (go for Phaser.AUTO)
// - element where the game will be drawn ('game')
// - actions on the game state (or null for nothing)
var game = new Phaser.Game(790, 400, Phaser.AUTO, 'game', stateActions);
var score = 0;
var labelScore;
var labelText;
var player;
var dirn;
var pipes = [];

/*
 * Loads all resources for the game and gives them names.
 */
function preload() {
    // Images
    game.load.image("playerImg", "../assets/flappy.png");
    game.load.image("pipe","../assets/pipe2-body.png");
    // Audio
    game.load.audio("score", "../assets/point.ogg");
}

/*
 * Initialises the game. This function is only called once.
 */
function create() {
    // set the background colour of the scene
    game.stage.setBackgroundColor("#F3D3A3");
    for (var count=0; count<16; count++) {
        addPipeBlock(50 * count, 395, false);
    }
    player = game.add.sprite(150, 200, "playerImg");
    labelScore = game.add.text(player.x+50, player.y-75, "0", {font: "30px Gloucester MT Extra Condensed", fill: "#777777"});
    labelText = game.add.text(20, 20, "Welcome.", {font: "30px Gloucester MT Extra Condensed", fill: "#777777"});
    generatePipe();
    /* game.input
        .onDown
        .add(clickHandler); */
    game.input
        .keyboard.addKey(Phaser.Keyboard.SPACEBAR)
        .onDown.add(spaceHandler);
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.enable(player);
    player.body.velocity.x = 10;
    player.body.gravity.y = 500;
    var pipeInterval = 1.75;
    game.time.events
        .loop(pipeInterval * Phaser.Timer.SECOND,
        generatePipe);

    // I assign the result of a function to the variable moveRight.
    // "right" will be at the beginning of any series of parameters in the function add - add also takes the  
    /*var moveRight = move.bind(undefined, "right");
    var moveLeft = move.bind(undefined, "left");
    var moveUp = move.bind(undefined, "up");
    var moveDown = move.bind(undefined, "down");
    game.input.keyboard.addKey(Phaser.Keyboard.RIGHT)
        .onDown.add(moveRight);
    game.input.keyboard.addKey(Phaser.Keyboard.LEFT)
        .onDown.add(moveLeft);
    game.input.keyboard.addKey(Phaser.Keyboard.UP)
        .onDown.add(moveUp);
    game.input.keyboard.addKey(Phaser.Keyboard.DOWN)
        .onDown.add(moveDown);*/
    game.input.keyboard
        .addKey(Phaser.Keyboard.SPACEBAR)
        .onDown.add(playerJump);
}

/*function clickHandler(event) {
    alert("You have intersected the screen at: " + Math.floor(event.x) + "," + Math.floor(event.y));
}*/

function spaceHandler() {
    game.sound.play("score");
}

function changeScore() {
    score++;
    labelScore.setText(score.toString());
}

/*function move(dirn){
    if(dirn=="right") {
        player.x += 10;
    }
    else if(dirn=="left"){
        player.x -= 10;
    }
    else if(dirn=="up"){
        player.y -= 10;
    }
    else if(dirn=="down"){
        player.y += 10;
    }
    labelScore.x = player.x;
    labelScore.y = player.y - 50;
}*/

function playerJump() {
    player.body.velocity.y = -200;
    labelScore.x = player.x;
    labelScore.y = player.y - 50;
}

//function generatePipe() {
    /*
     * This section of code creates a wall with a gap of a random length in a random position.
     * As far as I know, there may be bias with gameplay occurring towards the upper-end of the average bar but SHHHHH...
     */
    /*    var randInt = game.rnd.integerInRange(2, 4);
     *    var randInt2 = game.rnd.integerInRange(0, 2);
     *    for(var pipex=100; pipex<400; pipex=+300) {
     *        var filled = new Array(8);
     *        for (var ct2 = 0; ct2 < 8; ct2++) {
     *            if (ct2 < randInt) {
     *                game.add.sprite(pipex, 50 * ct2, "pipe");
     *            }
     *            else if (ct2 > randInt + randInt2) {
     *                game.add.sprite(pipex, 50 * ct2, "pipe");
     *            }
     *        }
     *    }
     *}
     */

function generatePipe() {
    // calculate a random position for the gap
    var gap = game.rnd.integerInRange(1, 5);
    // generate the pipes, except where the gap should be
    for (var count=0; count<8; count++) {
        if (count != gap && count != gap + 1) {
            addPipeBlock(500, count * 50, true);
        }
    }
    changeScore();
}

function addPipeBlock(x, y, velocityOn) {
    var pipeBlock = game.add.sprite(x,y,"pipe");
    pipes.push(pipeBlock);
    game.physics.arcade.enable(pipeBlock);
    if (velocityOn == true) {
        pipeBlock.body.velocity.x = -200;
    } else {
        pipeBlock.body.rotation = 1;
    }
}

/*
 * This function updates the scene. It is called for every new frame.
 */

function update() {
    game.physics.arcade
        .overlap(player,
    pipes,
    gameOver);
}

function gameOver(){
    labelText.setText("You lose.");
    game.destroy();
}