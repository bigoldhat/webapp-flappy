/* This is the game as (more-or-less) obtained from cambridgecoding (with annotations).

/* I define a set of global variables before the game is created. */
/* The first of these dictates the order by which the game runs (I think). */
var actions = { preload: preload, create: create, update: update };
/* Following this, we create a new game object in Phaser, which we can begin to interact with. */
// Phaser parameters:
// - game width
// - game height
// - renderer (go for Phaser.AUTO)
// - element where the game will be drawn ('game')
// - actions on the game state (or null for nothing)
var game = new Phaser.Game(700, 400, Phaser.AUTO, "game", actions);
/* The score at the start of the game begins at 0. */
var score = -3;
/* A new variable is created which will become an object to contain the score of the current game. */
var labelScore;
/* A new variable is created which will become an object to contain the score of the current game. */
var labelText;
/* A new variable is created which will become an object that can be used to create player sprites and then change their properties. */
var player;
/* A new variable is created which will become an object that can be used to change the properties of any child sprites of the player. */
var pipes = [];
/* A new variable is created to dictate the difference in time between pipe stack generations. */
var pipeInterval = 1.75;

/* These variables have been drawn out from existing values in former implementations.*/
var gameGravity = 200;
var gameVelocity = -200;
var jumpPower = 200;
var pipeGap = 100;

/* Bonuses are a new feature - these arrays store the sprites.*/
var balloons = [];
var weights =[];

/* JQuery obtains the locally stored scores and prints them to the empty unordered list on the HTML page. */
$.get("/score", function(data){
    console.log("received:", data);
    var scores = JSON.parse(data);
    for (var i = 0; i < scores.length; i++) {
        $("#scoreBoard").append("<li>" + scores[i].name + ": " +
            scores[i].score + "</li>");
    }
});

/* The images and audio are loaded to Phaser in this function. */
function preload() {
    /* Images */
    game.load.image("playerImg","../assets/flappy.png");
    game.load.image("pipe","../assets/pipe2-body.png");
    game.load.image("pipe-border","../assets/pipe2-body2.png");
    game.load.image("pipe-end","../assets/pipe-end.png");
    game.load.image("balloons","../assets/balloons.png");
    game.load.image("weight","../assets/weight.png");
    /* Audio */
    game.load.audio("score", "../assets/point.ogg");
}

function create() {
    /* The background colour for the game window is set.
     * This could also be set to an image. */
    game.stage.setBackgroundColor("#F3D3A3");
    /* At the top and bottom of the screen, blocks are placed.
     * This prevents the user from scoring points by simply dropping under all of the columns of blocks.*/
    /* A pipe is generated from the same place with a psuedo-random arrangement every time the defined amount of time (pipeInterval) has elapsed. */
    game.time.events.loop(pipeInterval * Phaser.Timer.SECOND, generatePipe);
    for (var count=0; count<16; count++) {
        addPipeBlock(50 * count, 0, false);
        addPipeBlock(50 * count, 395, false);
    }
    /* Two labels are created. The first is rather optional and simply shows a welcome message.
     * The other is the aforementioned label showing the score. */
    labelText = game.add.text(20, 20, "Welcome.",
        {font: "30px Gloucester MT Extra Condensed", fill: "#777777"});
    labelScore = game.add.text(20, 60, "0",
        {font: "30px Gloucester MT Extra Condensed", fill: "#777777"});
    /* A sprite is added and assigned to the player as an object. */
    player = game.add.sprite(80, 200, "playerImg");
    /* The player's sprite is assigned an anchor, from which it can appear to rotate according to its trajectory. */
    player.anchor.setTo(0.5, 0.5);
    /* Arcade Physics (alongside P2 physics, I think) are now-activated physics modules of the Phaser game engine. */
    game.physics.startSystem(Phaser.Physics.ARCADE);
    /* I think that the player is tied to the arcade physics modules.
     * This means that other sprites could be tied to more advanced physics modules, where necessary, such as P2.
     * This conserves processing power. */
    game.physics.arcade.enable(player);
    /* A given player sprite at a standstill is accelerated by a simulated gravitational force. */
    player.body.gravity.y = gameGravity;
    /* Pressing the spacebar will now cause the playerJump() function to run (causing the player to jump). */
    game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(playerJump);
}

function update() {
    /* This line checks if at any point during gameplay there is an overlap between any pipe and player sprites.
     * If this is the case, the game will end. */
    game.physics.arcade .overlap(player, pipes, gameOver);
    /* The people at CCA used the game's window's height and width here -
     * to determine if the player had passed the bounds of the window.
     * This was as follows:
     * if(0 > player.body.y || player.body.y > width){
     *     gameOver();
     * }*/

    /* Following this, rotation on the player sprite results by using the trigonometric functions in JS.*/
    player.rotation = Math.atan(player.body.velocity.y / gameVelocity);

    /* After every frame, if there is an intersection between a balloon or a weight, and the player sprite,
    * the gravity should change to replicate a net vertical force change. */
    checkBonus(balloons, -50);
    checkBonus(weights, 50);
}

function checkBonus(bonusArray, bonusEffect) {
    /* For each balloon item, if there is an intersection between a player sprite and the type of sprite in question, the player gets a bonus.
     * That sprite is then removed, along with its reference in one of the arrays. */
    // Step backwards in the array to avoid index errors from splice
    for(var i=bonusArray.length - 1; i>=0; i--){
        game.physics.arcade.overlap(player,bonusArray[i], function(){
            // destroy sprite
            bonusArray[i].destroy();
            // remove element from array
            bonusArray.splice(i,1);
            // apply the bonus effect
            changeGravity(bonusEffect);
        });
    }
}

function addPipeBlock(x, y, velocityOn) {
    if (velocityOn) {
        /* A single pipe block sprite is added at the coordinates obtained from the function generatePipe(). */
        var pipe = game.add.sprite(x,y,"pipe");
        /* This pipe has physics enabled and moves towards the player at a simulated constant velocity. */
        game.physics.arcade.enable(pipe);
        pipe.body.velocity.x = gameVelocity;
    } else {
        /* This pipe does have physics enabled.
         * The physics here is only for overlaps, not for velocities.*/
        var pipe = game.add.sprite(x,y,"pipe-border");
        game.physics.arcade.enable(pipe);
    }
    /* I think that this adds the newly-created pipe to the array of pipe sprites. */
    pipes.push(pipe);
}

/* The sprites for the ends of pipes are added here in a similar fashion. */
function addPipeEnd(x, y) {
    var pipe = game.add.sprite(x, y, "pipe-end");
    pipes.push(pipe);
    game.physics.arcade.enable(pipe);
    block.body.velocity.x = -gameSpeed;
}

function generate(){
    var diceRoll = game.rnd.integerInRange(1, 10);
    if(diceRoll==1){
        generateBalloons();
    } else if(diceRoll==2){
        generateWeight();
    } else {
        generatePipe();
    }
}


function generatePipe() {
    /* A gap is needed in each column of pipes.
     * The place at which this starts is determined by a random number, and in CCA's example, this gap will be two blocks tall. */
    /* The definition of the start of the gap has now changed.*/
    var gapStart = game.rnd.integerInRange(50, height - 50 - pipeGap);
    /* For each of the eight places in a column available to put a block,
     * a block is placed at certain coordinates along the column if it is not earmarked for the gap. */
    for (var count = 0; count < 8; count++) {
        if(count != gapStart && count != gapStart+1){
            addPipeBlock(750, count * 50, true);
        }
    }
    /* A column is created periodically, and likewise the score should be changed periodically.
     * As far as I know, this score change also just happens to occur as the player sprite goes through a gap - a new column must be being created at the same time. */
    changeScore();
}

function playerJump() {
    /* The player sprite is given a velocity of -200, and it decelerates upwards under gravity in an arc. */
    player.body.velocity.y = -100;
    game.sound.play("score");
    labelScore.x = player.x + 50;
    labelScore.y = player.y;
}

function changeScore() {
    /* The score is increased by one and set as the contents of the label's text property. */
    score++;
    if (score > 0) {
        labelScore.setText(score.toString());
    }
}

function gameOver() {
    /* The game ends upon a collision between pipe and player sprites.
     * This causes the game to stop functioning at in Phaser. */
    labelText.setText("You lose.");
    game.destroy();
    /* JQuery then begins functionality which causes the form to become visible and interactive in HTML. */
    $("#score").val(score);
    $("#greeting").show();
}