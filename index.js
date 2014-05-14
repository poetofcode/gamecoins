////////////////////////////////
function Player() {
	this.position = 1;
}

Player.prototype.moveLeft = function() {
	if(this.position < 1) {
		return;
	}
	this.position--;
}

Player.prototype.moveRight = function() {
	if(this.position > 2) {
		return;
	}
	this.position++;
}

////////////////////////////////
function Gameplay(canvas) {
	this.canvas = canvas;
	this.player = new Player();
	this.balls = [];
	this.timer = null;
	this.tickIntervalMsec = 50;
	this.time = 0;
	this.countCatched = 0;
	this.alertCatched = new Audio('assets/catched.mp3');
	this.alertUncatched = new Audio('assets/uncatched.mp3');
}

Gameplay.prototype.start = function() {
	if(this.isLaunched()) {
		return;
	}
	this.timer = setInterval(this.tick.bind(this), this.tickIntervalMsec);
	this.updateScreen();
}

Gameplay.prototype.stop = function() {
	if(!this.isLaunched()) {
		return;
	}
	clearInterval(this.timer);
	this.timer = null;
}

Gameplay.prototype.isLaunched = function() {
	if(this.timer !== null) {
		return true;
	}
	return false;
}

Gameplay.prototype.tick = function() {
	if(this.time > 10) {
		var factory = new RandomBallFactory();
		var newBall = factory.create();
		var lastBall = this.balls[this.balls.length-1];
		var lastBallPosition = 0;
		if(lastBall !== undefined) {
			lastBallPosition = lastBall.position;
		}
		if(newBall.position !== lastBallPosition) {
			this.balls.push(newBall);
		}
		this.time = 0;
	}

	for (var i = this.balls.length - 1; i >= 0; i--) {
		var ball = this.balls[i];

		ball.step();

		if(ball.isTimeForCatch()) {
			if(this.player.position == ball.position) {
				this.balls.splice(i, 1);
				this.alertCatched.currentTime = 0;			
				this.alertCatched.play();
				this.countCatched++;
			} else {
				ball.fallen = true;
				this.updateScreen();
				this.alertUncatched.play();
				this.stop();
				this.onGameOverFunc();
			}
		}
	};

	this.updateScreen();
	this.time++;
}

Gameplay.prototype.updateScreen = function() {
	if(!this.isLaunched()) {
		return;
	}
	// dimensions
	var screenWidth = this.canvas.width;
	var screenHeight = this.canvas.height;
	var playerWidth = 150;
	var playerHeight = 100;
	var pipeWidth = 170;
	var pipeHeight = 70;
	var ballRadius = 50;
	var ballStep = 5;

	var cyan = "#008CB7";
	var yellow = "#E5CF51";

	// calc
	var step = screenWidth/4;
	var playerPosCentexX = step/2 + step*this.player.position;

	this.redraw();
	var context = this.canvas.getContext("2d");

	// draw balls
	for (var i = this.balls.length - 1; i >= 0; i--) {
		var ball = this.balls[i];
		context.beginPath();
		context.arc(step/2 + step*ball.position, ball.timeFromBorn*ballStep, ballRadius, 0, 2 * Math.PI, false);
		context.fillStyle = ball.fallen ? "#D33": cyan;
		context.fill();	
	};	

	// draw pipes
	for(var i=0; i<4; i++) {
		context.beginPath();
		context.rect(step/2 + step*i - pipeWidth/2, 0, pipeWidth, pipeHeight);
		context.fillStyle = "#45B729";
		context.fill();	
	}

	// draw player
	var playerPosX = playerPosCentexX - playerWidth/2;
	context.beginPath();
	context.rect(playerPosX, screenHeight - playerHeight - 20, playerWidth, playerHeight);
	context.fillStyle = yellow;
	context.fill();	
	context.font="36px Verdana";
	context.fillStyle = "#33A";
	context.textAlign = "center";
	context.fillText(this.countCatched?this.countCatched:"", playerPosCentexX, screenHeight - playerHeight/2 - 10);
}

Gameplay.prototype.redraw = function() {
	var context = this.canvas.getContext("2d");
	context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

Gameplay.prototype.onGameOver = function(callback) {
	this.onGameOverFunc = callback;
}

/////////////////////////////////////
function Ball(position) {
	this.position = position;
	this.timeFromBorn = 0;
	this.uncaughtTime = 80;
	this.fallen = false;
}

Ball.prototype.step = function() {
	this.timeFromBorn++;
}

Ball.prototype.isTimeForCatch = function() {
	if(this.timeFromBorn > this.uncaughtTime) {
		return true;
	}
	return false;
}

/////////////////////////////////////
function RandomBallFactory() {}

RandomBallFactory.prototype.create = function() {
	var randomPosition = Math.round(Math.random() * 3);
	var ball = new Ball(randomPosition);
	return ball;
}

/////////////////////////////////////
$(document).ready(function() {
	var goBtnHtml = '<a href="#" id="go" class="btn">Go!</a>'
	$('.btn-container').html(goBtnHtml);

	var gameplay;

	$('#go').live('click', function() {
		if(gameplay && gameplay.isLaunched()) {
			return false;
		}
		var that = this;
		$(this).animate({ opacity: 0 });
		gameplay = new Gameplay($("#gameScreen")[0]);
		gameplay.onGameOver(function() {
			$(that).animate({ opacity: 1 });
			$(that).focus();
		});
		gameplay.start();
	}).focus();

	$(this).keydown(function(e) {
		switch(e.keyCode) {
			case 37:
				gameplay.player.moveLeft();
				gameplay.updateScreen();
				break;
			case 39:
				gameplay.player.moveRight();
				gameplay.updateScreen();
				break;
		}
	});
});
