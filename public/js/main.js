/* Functions for general use */

/* This function returns the value associated with 'whichParam' on the URL */

function getURLParameters(whichParam) {
    var pageURL = window.location.search.substring(1);
    var pageURLVariables = pageURL.split('&');
    for(var i = 0; i < pageURLVariables.length; i++) {
        var parameterName = pageURLVariables[i].split('=');
        if(parameterName[0] == whichParam) {
            return parameterName[1];
        }
    }
}

var username = getURLParameters('username');
if('undefined' == typeof username || !username) {
    username = 'Anonymous_'+Math.random();
}

var chat_room = getURLParameters('game_id');
if('undefined' == typeof chat_room || !chat_room) {
    chat_room = 'lobby';
}

/* Connect to the socket server */

var socket = io.connect();

/* What to do when the server sends me a log message */

socket.on('log',function(array) {
    console.log.apply(console,array);
});

/* What to do when the server responds that someone joined a room */

socket.on('join_room_response',function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    /* If we are being notified that we joined the room, then ignore it */
    if(payload.socket_id == socket.id) {
        return;
    }

    /* If someone joined the room, then add a new row to the lobby table */
    var dom_elements = $('.socket_'+payload.socket_id);

    /* If we don't already have an entry for this person */
    if(dom_elements.length == 0) {
        var nodeA = $('<div></div>');
        nodeA.addClass('socket_'+payload.socket_id);
        
        var nodeB = $('<div></div>');
        nodeB.addClass('socket_'+payload.socket_id);
        
        var nodeC = $('<div></div>');
        nodeC.addClass('socket_'+payload.socket_id);

        nodeA.addClass('w-100');

        nodeB.addClass('col-9 text-right');
        nodeB.append('<h4>'+payload.username+'</h4>');

        nodeC.addClass('col-3 text-left');
        var buttonC = makeInviteButton(payload.socket_id);
        nodeC.append(buttonC);

        nodeA.hide();
        nodeB.hide();
        nodeC.hide();
        $('#players').append(nodeA,nodeB,nodeC);
        nodeA.slideDown(1000);
        nodeB.slideDown(1000);
        nodeC.slideDown(1000);
    }
    /* If we've already seen the person who just joined (something weird happened) */
    else{
        uninvite(payload.socket_id);
        var buttonC = makeInviteButton(payload.socket_id);
        $('.socket_'+payload.socket_id+' button').replaceWith(buttonC);
        dom_elements.slideDown(1000);
    }

    /* Manage the message that a new player has joined */
    var newHTML = '<p>'+payload.username+' just entered the lobby</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.slideDown(1000);
});

/* What to do when the server responds that someone has left */

socket.on('player_disconnected',function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    /* If we are being notified that we left the room, then ignore it */
    if(payload.socket_id == socket.id) {
        return;
    }

    /* If someone left the room, then animate out all their content */
    var dom_elements = $('.socket_'+payload.socket_id);

    /* If somehting exists */
    if(dom_elements.length != 0) {
        dom_elements.slideUp(1000);
    }
    
    /* Manage the message that a player has left */
    var newHTML = '<p>'+payload.username+' has left the room</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.slideDown(1000);
});

/* Send an invite mesage to the server */
function invite(who){
    var payload = {};
    payload.requested_user = who;
    console.log('*** Client log message: \'invite\' payload: '+JSON.stringify(payload));
    socket.emit('invite',payload);
}
/* Handle a response after sending an invite message to the server */
socket.on('invite_response',function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makeInvitedButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

/* Handle a notification that we have been invited */
socket.on('invited',function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makePlayButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

/* Send an UNinvite mesage to the server */
function uninvite(who){
    var payload = {};
    payload.requested_user = who;
    console.log('*** Client log message: \'uninvite\' payload: '+JSON.stringify(payload));
    socket.emit('uninvite',payload);
}
/* Handle a response after sending an UNinvite message to the server */
socket.on('uninvite_response',function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makeInviteButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

/* Handle a notification that we have been UNinvited */
socket.on('uninvited',function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makeInviteButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

/* Send a game_start mesage to the server */
function game_start(who){
    var payload = {};
    payload.requested_user = who;
    console.log('*** Client log message: \'game_start\' payload: '+JSON.stringify(payload));
    socket.emit('game_start',payload);
}

/* Handle a notification that we have been engaged to play */
socket.on('game_start_response',function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makeEngagedButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
    /* Jump to a new page */
    /* BUG ALERT: If this fails, revert back to nothing but the following: window.location.href = 'game.html?username='+username+'game_id='+payload.game_id; */
    setTimeout(function() {
        window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
    }, 1500);
    /* END OF BUG ALERT */    
});

function send_message(){
    var payload = {};
    payload.room = chat_room;
    /* BUG ALERT: Video at 15:13, his code lacks this so I am removing it -->payload.username = username; */
    payload.message = $('#send_message_holder').val();
    console.log('*** Client Log Message: \'send_message\' payload: '+JSON.stringify(payload));
    socket.emit('send_message',payload);
    $('#send_message_holder').val('');
}

socket.on('send_message_response',function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newHTML = '<p><b>'+payload.username+' says:</b> '+payload.message+'</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.slideDown(1000);
});

function makeInviteButton(socket_id) {
    var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'>Invite</button>';
    var newNode = $(newHTML);
    newNode.click(function() {
            invite(socket_id)
    });
    return(newNode);
}

function makeInvitedButton(socket_id) {
    var newHTML = '<button type=\'button\' class=\'btn btn-primary\'>Invited</button>';
    var newNode = $(newHTML);
    newNode.click(function() {
        uninvite(socket_id)
});
    return(newNode);
}

function makePlayButton(socket_id) {
    var newHTML = '<button type=\'button\' class=\'btn btn-success\'>Play</button>';
    var newNode = $(newHTML);
    newNode.click(function() {
        game_start(socket_id)        
});
    return(newNode);
}

function makeEngagedButton() {
    var newHTML = '<button type=\'button\' class=\'btn btn-danger\'>Engaged</button>';
    var newNode = $(newHTML);
    return(newNode);
}

$(function(){
    var payload = {};
    payload.room = chat_room;
    payload.username = username;
    console.log('*** Client Log Message: \'join_room\' payload: '+JSON.stringify(payload));
    socket.emit('join_room',payload);

    $('#quit').append('<a href="lobby.html?username='+username+' " class="btn btn-danger btn-default active" role="button" aria-pressed="true">Quit</a>');

});

var old_board = [
                    ['?', '?', '?', '?', '?', '?', '?', '?'],
                    ['?', '?', '?', '?', '?', '?', '?', '?'],
                    ['?', '?', '?', '?', '?', '?', '?', '?'],
                    ['?', '?', '?', '?', '?', '?', '?', '?'],
                    ['?', '?', '?', '?', '?', '?', '?', '?'],
                    ['?', '?', '?', '?', '?', '?', '?', '?'],
                    ['?', '?', '?', '?', '?', '?', '?', '?'],
                    ['?', '?', '?', '?', '?', '?', '?', '?']
                ];

var my_color = ' ';
var interval_timer;

socket.on('game_update',function(payload) {

    console.log('*** Client Log Message: \'game_update\'\n\t payload: '+JSON.stringify(payload));
    /* check for a good board update */
        
        if(payload.result == 'fail'){
            console.log(payload.message);
            window.location.href = 'lobby.html?username='+username;
            return;
        }

    /* check for a good board in the payload */

    var board = payload.game.board;
    if('undefined' == typeof board || !board) {
        console.log('Internal error: received a malformed board update from the server');
        return;
    }

    /* Update my color */
   
    if(socket.id == payload.game.player_white.socket) {
        my_color = 'white';
    }
    else if(socket.id == payload.game.player_black.socket) {
        my_color = 'black';
    }
    else {
        /* Something weird is going on, like 3 people at once */
        /* Send client back to lobby */
        window.location.href = 'lobby.html?username='+username;
        return;
    }

    $('#my_color').html('<h3 id="my_color"> I am '+my_color+'</h3>');
    $('#my_color').append('<h4 id="timer">It is '+payload.game.whose_turn+'\'s turn. Elapsed time <span id="elapsed"></span></h4>');

    /* BUG ALERT: I added the id="timer" to the h4 tag above in hopes of deleting that on game over. Revert if this causes issues. */

    clearInterval(interval_timer);
    interval_timer = setInterval(function(last_time){
        return function() {
            /* Do the work of updating the UI */
            var d = new Date();
            var elapsedmilli = d.getTime() - last_time;
            var minutes = Math.floor(elapsedmilli / (60 * 1000));
            var seconds = Math.floor((elapsedmilli % (60 * 1000)) / 1000);

            if(seconds < 10) {
                $('#elapsed').html(minutes+':0'+seconds);
            }
                else {
                    $('#elapsed').html(minutes+':'+seconds);
            }

        }}(payload.game.last_move_time)
        , 1000);

    /* Animate changes to the board */

    var blacksum = 0;
    var whitesum = 0;

    var row,column;
    for(row = 0; row < 8; row++) {
        for(column = 0; column < 8; column++) {
            if(board[row][column] == 'b') {
                blacksum++;
            }
            if(board[row][column] == 'w') {
                whitesum++;
            }
        
        /* If a board space has changed */
        if(old_board[row][column] != board[row][column]) {
            if(old_board[row][column] == '?' && board[row][column] == ' ') {
                $('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square"/>');
            }
                else if(old_board[row][column] == '?' && board[row][column] == 'w') {
                    $('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white square"/>');
                }
                else if(old_board[row][column] == '?' && board[row][column] == 'b') {
                    $('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black square"/>');
                }
                else if(old_board[row][column] == ' ' && board[row][column] == 'w') {
                    $('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white square"/>');
                }
                else if(old_board[row][column] == ' ' && board[row][column] == 'b') {
                    $('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black square"/>');
                }
                else if(old_board[row][column] == 'w' && board[row][column] == ' ') {
                    $('#'+row+'_'+column).html('<img src="assets/images/white_to_empty.gif" alt="empty square"/>');
                }
                else if(old_board[row][column] == 'b' && board[row][column] == ' ') {
                    $('#'+row+'_'+column).html('<img src="assets/images/black_to_empty.gif" alt="empty square"/>');
                }
                /* SAVE THIS CODE - IT IS PROVEN TO WORK - BEGIN *****
                else if(old_board[row][column] == 'w' && board[row][column] == 'b') {
                    $('#'+row+'_'+column).html('<img src="assets/images/white_to_black.gif" alt="black square"/>');
                }
                else if(old_board[row][column] == 'b' && board[row][column] == 'w') {
                    $('#'+row+'_'+column).html('<img src="assets/images/black_to_white.gif" alt="white square"/>');
                }
                ***** END OF SAVE THIS CODE */
               /* BUG ALERT - Trying this per Grey to see if I can get the chips to flip every time */
               else if(old_board[row][column] == 'w' && board[row][column] == 'b') {
                    $('#'+row+'_'+column).html('<img src="assets/images/white_to_black.gif?rnd=' +Math.random()+ 'alt="black square"/>');
                }
                else if(old_board[row][column] == 'b' && board[row][column] == 'w') {
                    $('#'+row+'_'+column).html('<img src="assets/images/black_to_white.gif?rnd=' +Math.random()+ 'alt="white square"/>');
                }
                /* END OF BUG ALERT */
                else {
                    $('#'+row+'_'+column).html('<img src="assets/images/error.gif" alt="error square"/>');
                }
        }

        /* Set up interactivity */
        $('#'+row+'_'+column).off('click');
        $('#'+row+'_'+column).removeClass('hovered_over');

        if(payload.game.whose_turn === my_color) {
            if(payload.game.legal_moves[row][column] === my_color.substr(0,1)) {        
                    $('#'+row+'_'+column).addClass('hovered_over');
                    $('#'+row+'_'+column).click(function(r,c) {
                        return function() {
                            var payload = {};
                            payload.row = r;
                            payload.column = c;
                            payload.color = my_color;
                            console.log('*** Client Log Message: \'play_token\' payload: '+JSON.stringify(payload));
                            socket.emit('play_token',payload);
                        };
                    }(row,column));
                }    
            }
        }
    }
    $('#blacksum').html(blacksum);
    $('#whitesum').html(whitesum);

    old_board = board;

});

socket.on('play_token_response',function(payload) {

    console.log('*** Client Log Message: \'play_token_response\'\n\t payload: '+JSON.stringify(payload));
    /* check for a good play_token_response */
        
        if(payload.result == 'fail'){
            console.log(payload.message);
            alert(payload.message);
            return;
        }
        
});

socket.on('game_over',function(payload) {

    console.log('*** Client Log Message: \'game_over\'\n\t payload: '+JSON.stringify(payload));
    /* check for a good game_over messgae */
        
        if(payload.result == 'fail'){
            console.log(payload.message);
            alert(payload.message);
            return;
        }
    /* If the game is over, put in a button to jump to a new page */

    $('#game_over').html('<h1>Game Over</h1><h2>'+payload.who_won+' won!</h2>');
    $('#game_over').append('<a href="lobby.html?username='+username+' " class="btn btn-success btn-lg active" role="button" aria-pressed="true">Return to the lobby</a>');

    /* BUG ALERT: I am adding this code to see if I can remove the timer when the game is over - delete this if it causes issues */

    $('#elapsed').remove();
    $('#timer').remove();
    
    /* END OF BUG ALERT: */

});