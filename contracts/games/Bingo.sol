// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract Bingo is VRFConsumerBaseV2, ReentrancyGuard, Ownable {
    // Chainlink VRF
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    
    uint256 public constant CARD_SIZE = 25; // 5x5 bingo card
    uint256 public constant MAX_NUMBER = 75; // Traditional bingo uses 1-75
    uint256 public cardPrice = 0.01 ether;
    uint256 public gameId;
    uint256 public currentGameId;
    uint256 public prizePool;
    uint256 public numberDrawInterval = 30 seconds;
    uint256 public lastDrawTime;
    
    enum GameState {
        WAITING,
        ACTIVE,
        DRAWING,
        ENDED
    }
    
    struct BingoCard {
        uint8[25] numbers;
        bool[25] marked;
        address owner;
        bool hasWon;
    }
    
    struct Game {
        GameState state;
        uint256 startTime;
        uint256 prizePool;
        uint8[] drawnNumbers;
        address[] players;
        address[] winners;
        mapping(address => uint256[]) playerCards;
        mapping(uint256 => BingoCard) cards;
        uint256 totalCards;
        uint256 requestId;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerBalances;
    mapping(uint256 => uint256) public requestToGame;
    
    event GameStarted(uint256 indexed gameId, uint256 startTime);
    event CardPurchased(address indexed player, uint256 gameId, uint256 cardId);
    event NumberDrawn(uint256 indexed gameId, uint8 number);
    event NumberMarked(address indexed player, uint256 cardId, uint8 number);
    event BingoClaimed(address indexed winner, uint256 gameId, uint256 prize);
    event GameEnded(uint256 indexed gameId, address[] winners, uint256 totalPrize);
    
    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
    }
    
    function startNewGame() external onlyOwner {
        require(
            games[currentGameId].state == GameState.ENDED || currentGameId == 0,
            "Current game still active"
        );
        
        gameId++;
        currentGameId = gameId;
        
        Game storage newGame = games[gameId];
        newGame.state = GameState.WAITING;
        newGame.startTime = block.timestamp;
        
        emit GameStarted(gameId, block.timestamp);
    }
    
    function buyCard() external payable nonReentrant {
        require(msg.value == cardPrice, "Incorrect payment");
        require(games[currentGameId].state == GameState.WAITING, "Game not accepting players");
        
        Game storage game = games[currentGameId];
        
        // Generate card with VRF
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            3,
            i_callbackGasLimit,
            25 // Need 25 numbers for the card
        );
        
        requestToGame[requestId] = currentGameId;
        
        // Add player if first card
        if (game.playerCards[msg.sender].length == 0) {
            game.players.push(msg.sender);
        }
        
        game.prizePool += msg.value;
        prizePool += msg.value;
    }
    
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 gameId = requestToGame[requestId];
        Game storage game = games[gameId];
        
        if (game.state == GameState.WAITING) {
            // Generate bingo card
            uint256 cardId = game.totalCards++;
            BingoCard storage card = game.cards[cardId];
            card.owner = tx.origin; // Use tx.origin carefully, consider alternatives
            
            // Generate unique numbers for card
            bool[76] memory used;
            for (uint256 i = 0; i < 25; i++) {
                uint8 num;
                do {
                    num = uint8((randomWords[i % randomWords.length] + i) % 75) + 1;
                } while (used[num]);
                used[num] = true;
                card.numbers[i] = num;
            }
            
            game.playerCards[card.owner].push(cardId);
            emit CardPurchased(card.owner, gameId, cardId);
            
        } else if (game.state == GameState.DRAWING) {
            // Draw a new number
            uint8 drawnNumber = uint8(randomWords[0] % 75) + 1;
            
            // Check if number was already drawn
            bool alreadyDrawn = false;
            for (uint256 i = 0; i < game.drawnNumbers.length; i++) {
                if (game.drawnNumbers[i] == drawnNumber) {
                    alreadyDrawn = true;
                    break;
                }
            }
            
            if (!alreadyDrawn) {
                game.drawnNumbers.push(drawnNumber);
                emit NumberDrawn(gameId, drawnNumber);
                lastDrawTime = block.timestamp;
            } else {
                // Request new number if duplicate
                drawNumber();
            }
            
            game.state = GameState.ACTIVE;
        }
    }
    
    function startGame() external onlyOwner {
        require(games[currentGameId].state == GameState.WAITING, "Game not in waiting state");
        require(games[currentGameId].players.length >= 2, "Need at least 2 players");
        
        games[currentGameId].state = GameState.ACTIVE;
        lastDrawTime = block.timestamp;
    }
    
    function drawNumber() public {
        require(games[currentGameId].state == GameState.ACTIVE, "Game not active");
        require(
            block.timestamp >= lastDrawTime + numberDrawInterval || msg.sender == owner(),
            "Draw interval not met"
        );
        
        Game storage game = games[currentGameId];
        require(game.drawnNumbers.length < MAX_NUMBER, "All numbers drawn");
        
        game.state = GameState.DRAWING;
        
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            3,
            i_callbackGasLimit,
            1
        );
        
        requestToGame[requestId] = currentGameId;
    }
    
    function markNumber(uint256 cardId, uint8 number) external {
        Game storage game = games[currentGameId];
        BingoCard storage card = game.cards[cardId];
        
        require(card.owner == msg.sender, "Not your card");
        require(!card.hasWon, "Card already won");
        
        // Check if number was drawn
        bool wasDrawn = false;
        for (uint256 i = 0; i < game.drawnNumbers.length; i++) {
            if (game.drawnNumbers[i] == number) {
                wasDrawn = true;
                break;
            }
        }
        require(wasDrawn, "Number not drawn yet");
        
        // Mark the number on card
        for (uint256 i = 0; i < 25; i++) {
            if (card.numbers[i] == number && !card.marked[i]) {
                card.marked[i] = true;
                emit NumberMarked(msg.sender, cardId, number);
                break;
            }
        }
    }
    
    function claimBingo(uint256 cardId) external nonReentrant {
        Game storage game = games[currentGameId];
        BingoCard storage card = game.cards[cardId];
        
        require(card.owner == msg.sender, "Not your card");
        require(!card.hasWon, "Already claimed");
        require(checkWin(cardId), "No winning pattern");
        
        card.hasWon = true;
        game.winners.push(msg.sender);
        
        // Calculate prize (split if multiple winners)
        uint256 prize = game.prizePool / (game.winners.length);
        playerBalances[msg.sender] += prize;
        
        emit BingoClaimed(msg.sender, currentGameId, prize);
        
        // End game if sufficient winners or all numbers drawn
        if (game.winners.length >= 3 || game.drawnNumbers.length >= MAX_NUMBER) {
            endCurrentGame();
        }
    }
    
    function checkWin(uint256 cardId) public view returns (bool) {
        BingoCard storage card = games[currentGameId].cards[cardId];
        
        // Check rows
        for (uint256 row = 0; row < 5; row++) {
            bool win = true;
            for (uint256 col = 0; col < 5; col++) {
                if (!card.marked[row * 5 + col]) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
        
        // Check columns
        for (uint256 col = 0; col < 5; col++) {
            bool win = true;
            for (uint256 row = 0; row < 5; row++) {
                if (!card.marked[row * 5 + col]) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
        
        // Check diagonals
        bool diagonal1 = true;
        bool diagonal2 = true;
        for (uint256 i = 0; i < 5; i++) {
            if (!card.marked[i * 5 + i]) diagonal1 = false;
            if (!card.marked[i * 5 + (4 - i)]) diagonal2 = false;
        }
        
        return diagonal1 || diagonal2;
    }
    
    function endCurrentGame() private {
        Game storage game = games[currentGameId];
        game.state = GameState.ENDED;
        
        emit GameEnded(currentGameId, game.winners, game.prizePool);
        
        // Reset for next game
        prizePool = 0;
    }
    
    function withdraw() external nonReentrant {
        uint256 balance = playerBalances[msg.sender];
        require(balance > 0, "No balance");
        
        playerBalances[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function getGameInfo(uint256 _gameId) external view returns (
        GameState state,
        uint256 startTime,
        uint256 pool,
        uint256 totalPlayers,
        uint256 numbersDrawn
    ) {
        Game storage game = games[_gameId];
        return (
            game.state,
            game.startTime,
            game.prizePool,
            game.players.length,
            game.drawnNumbers.length
        );
    }
    
    function getPlayerCards(address player, uint256 _gameId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return games[_gameId].playerCards[player];
    }
    
    function getCardDetails(uint256 _gameId, uint256 cardId) 
        external 
        view 
        returns (uint8[25] memory numbers, bool[25] memory marked, address owner) 
    {
        BingoCard storage card = games[_gameId].cards[cardId];
        return (card.numbers, card.marked, card.owner);
    }
    
    function getDrawnNumbers(uint256 _gameId) external view returns (uint8[] memory) {
        return games[_gameId].drawnNumbers;
    }
    
    // Admin functions
    function setCardPrice(uint256 _price) external onlyOwner {
        cardPrice = _price;
    }
    
    function setDrawInterval(uint256 _interval) external onlyOwner {
        numberDrawInterval = _interval;
    }
    
    receive() external payable {}
}