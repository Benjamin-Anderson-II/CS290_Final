const rows = document.querySelectorAll('.row');
const readyButton = document.querySelector("#ready-button");
const resetButton = document.querySelector("#reset-button");
const forfeitButton = document.querySelector("#forfeit-button");
const infoDisplay = document.querySelector('#info-display');
const turnDislay = document.querySelector("#turn-display");

// board for single player matches
let board = [
	['','',''],
	['','',''],
	['','','']];

const player1 = 'X';
const player2 = 'O';
let currentPlayer = true; // true = player 1
let isGameOver = false;
let playerNum = 0; // 0 for single player. 1 & 2 for multiplayer
let ready  = false;
let enemyReady = false;
let roomId = '';

getGameMode();

function getGameMode(){
	var url = window.location.href
	var slashSplit = url.split('/');
	if(slashSplit[slashSplit.length-2]==='multiplayer'){
		forfeitButton.addEventListener('click', forfeit)
		startMultiPlayer();
	}
	else if(slashSplit[slashSplit.length-1]==='solo') {
		resetButton.addEventListener('click', reset);
		soloPlay();
	}
}

function soloPlay(){
	gameMode = 'solo'
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].textContent = board[i][j];
			rows[i].children[j].addEventListener('click', placeTileSolo);
		}
	}
	//add solo vs comp functionality
}

function vsPlay(socket){
	if(isGameOver) return;
	if(!ready){
		socket.emit('player-ready', roomId, playerNum)
		ready = true
		playerReady(playerNum);
	}
	if(enemyReady) {
		if(currentPlayer===true){
			turnDislay.textContent = "Your Go"
		}
		if(currentPlayer===false){
			turnDislay.textContent = "Enemy's Go"
		}
	}
}

function playerReady(num){
	let player = '.p' + num;
	console.log(player + ' .ready span')
	document.querySelector(player + ' .ready span').classList.toggle('green')
}

function startMultiPlayer(){
	// Get roomId from URL
	roomId = window.location.href.split('/')[window.location.href.split('/').length-1];
	
	// Instantiate Socket
	const socket = io();

	// Set playerNum (called when disconnecting)
	socket.on('set-player-num', num => localStorage.setItem('playerNum', num));

	// Get playerNum from localStorage
	playerNum = parseInt(localStorage.getItem('playerNum'));

	// Join SocketIO Room
	socket.emit('join-socket-room', roomId, playerNum)

	// On enemy ready
	socket.on('enemy-ready', num => {
		enemyReady = true;
		playerReady(num);
		if(ready) vsPlay(socket)
	})

	// Ready button click
	readyButton.addEventListener('click', () => {
		vsPlay(socket)
	})

	// setup tile listeners
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].textContent = board[i][j];
			rows[i].children[j].addEventListener('click', (event) => {
				if(ready && enemyReady){
					socket.emit('mark', roomId, playerNum, event.target.id);
					event.target.disabled = true;
				}
			});
		}
	}

	// on mark recieved
	socket.on('mark', (id, val) => {
		document.getElementById(id).textContent = val;
	})

	socket.on('game-status', over => {
		if(over) disableBoard();
	})

	socket.on('game-over', () => disableBoard())
}

function playerConnectedOrDisconnected(num){
	let player = '.p' + (parseInt(num));
	if(document.querySelector(player + ' .connected span.green')) playerReady(num);
	document.querySelector(player + ' .connected span').classList.toggle('green')
	if(parseInt(num)===playerNum) document.querySelector(player).style.fontWeight = 'bold';
}

function reset(){
	for(var i = 0; i < 3; i++){
		for(var j = 0; j < 3; j++){
			board[i][j] = '';
			rows[i].children[j].textContent = board[i][j];
			rows[i].children[j].disabled = false;
		}
	}
	currentPlayer = !currentPlayer;
}

function forfeit(){
	console.log("You forfeit the match loser")
}

function updateBoard(id, player){
	switch(id){
//--------------TOP ROW--------------
	case 'top-left':
		board[0][0] = player;
		break;
	case 'top-center':
		board[0][1] = player;
		break;
	case 'top-right':
		board[0][2] = player;
		break;
//--------------MIDDLE ROW--------------
	case 'mid-left':
		board[1][0] = player;
		break;
	case 'mid-center':
		board[1][1] = player;
		break;
	case 'mid-right':
		board[1][2] = player;
		break;
//--------------BOTTOM ROW--------------
	case 'bot-left':
		board[2][0] = player;
		break;
	case 'bot-center':
		board[2][1] = player;
		break;
	case 'bot-right':
		board[2][2] = player;
		break;

	}
}

function placeTileSolo(event){
	var player = (currentPlayer) ? player1 : player2;
	updateBoard(event.target.id, player);
	event.target.textContent = player;
	event.target.disabled = true;
	checkWinner();
	currentPlayer = !currentPlayer;
}

function disableBoard(){
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].disabled = true;
		}
	}
}

function checkWinner(){
	for(var i = 0; i < 3; i++){
		if ((board[i][0]===board[i][1] && board[i][0]===board[i][2] && board[i][0]) // row match
		||  (board[0][i]===board[1][i] && board[0][i]===board[2][i] && board[0][i]) // column match
		){
			console.log((currentPlayer) ? player1 : player2, 'Wins!');
			disableBoard();
			//dislpayWinner(board[i][0]);
			isGameOver = true;
			return;
		}
	}
	if((board[0][0]===board[1][1] && board[0][0]===board[2][2] && board[0][0]) || //diagonal 1
	   (board[0][2]===board[1][1] && board[2][0]===board[1][1] && board[1][1])){  //diagonal 2
		console.log((currentPlayer) ? player1 : player2, 'Wins!');
		disableBoard();
		//dislpayWinner(board[i][0]);
		isGameOver = true;
		return;
	}
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			if(!board[i][j]) return;
		}
	}
	console.log("Cat's Game")
	isGameOver = true;
}

/** What to do Next
 * 
*/