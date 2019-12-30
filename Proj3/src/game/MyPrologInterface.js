class MyPrologInterface {
    constructor() {

        // Prolog Board
        this.mainBoard = [];
        this.p1Pieces = [];
        this.p2Pieces = [];
        
        this.initBoards();
    }

    sendPrologRequest(requestString, onSuccess, onError) {
    
        var requestPort = 8081
        var request = new XMLHttpRequest();
        request.open('GET', 'http://localhost:' + requestPort + '/' + requestString, true);
    
        request.onload = onSuccess || function (data) { console.log("Request successful. Reply: " + data.target.response); };
        request.onerror = onError || function () { console.log("Error waiting for response"); };
    
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.send();
    }

    async sendAsyncPrologRequest(requestString) {
    
        var requestPort = 8081
        var request = new XMLHttpRequest();
        request.open('GET', 'http://localhost:' + requestPort + '/' + requestString, false);
    
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.send();

        if (request.status === 200) 
            return request.response
        else
            throw(new Error('Error getting data'))
    }

    initBoards() {
        this.sendPrologRequest("init_boards", (data) => { this.getBoards.call(this, data) });
    }

    getBoards(data) {
        this.parseBoardsFromString(data.target.response);
    }

    parseBoardsFromString(string) {    
        var boardsArray = JSON.parse(string);

        this.mainBoard = boardsArray[0];
        this.p1Pieces = boardsArray[1];
        this.p2Pieces = boardsArray[2];
    }

    parseBoardsToString() {
        var boardsString = []; 
        
        boardsString[0] = "[[" +this.mainBoard[0]+ "],[" +this.mainBoard[1]+ "],[" +this.mainBoard[2]+ "],[" +this.mainBoard[3]+ "]]";
        boardsString[1] = "[" + this.p1Pieces + "]";
        boardsString[2] = "[" + this.p2Pieces + "]";

        return boardsString;
    }

    async isValidMove(gameMove) {

        var destCol = gameMove.destinationTile.column + 1;
        var destLine = gameMove.destinationTile.line + 1;
        var piece = gameMove.piece.prologId;
        var boardsString = this.parseBoardsToString();

        var requestString = "valid_move("+destLine+","+destCol+","+piece+","+boardsString[0]+")";

        var response = await this.sendAsyncPrologRequest(requestString);

        return (response == "true");
    }

    async gameOver(gameMove) {
        
        var destCol = gameMove.destinationTile.column + 1;
        var destLine = gameMove.destinationTile.line + 1;
        var piece = gameMove.piece.prologId;
        var player = gameMove.piece.prologPlayer;
        var boardsString = this.parseBoardsToString();

        var requestString = "game_over("+destLine+","+destCol+","+piece+","+player+","+boardsString[0]+","+boardsString[1]+","+boardsString[2]+")";

        var response = await this.sendAsyncPrologRequest(requestString);

        var responseArray = JSON.parse(response);

        this.mainBoard = responseArray[0];
        this.p1Pieces = responseArray[1];
        this.p2Pieces = responseArray[2];

        return (responseArray[3]);
    }

    async getComputerMove(level, player) {

        var prologPlayer = ((player == "p1") ? "1" : "2");
        var boardsString = this.parseBoardsToString();

        var requestString = "choose_move("+boardsString[0]+","+boardsString[1]+","+boardsString[2]+","+level+","+prologPlayer+")";

        var response = await this.sendAsyncPrologRequest(requestString);

        var responseArray = JSON.parse(response);

        console.log(responseArray);

        var line = responseArray[0] - 1;
        var col = responseArray[1] - 1;
        var prologPiece = responseArray[2];

    }
}