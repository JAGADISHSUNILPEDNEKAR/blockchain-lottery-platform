// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract Blackjack is VRFConsumerBaseV2, ReentrancyGuard, Ownable {
    // Chainlink VRF
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    
    uint256 public minBet = 0.001 ether;
    uint256 public maxBet = 1 ether;
    uint256 public houseEdge = 200; // 2% in basis points
    
    enum GameState {
        WAITING,
        PLAYER_TURN,
        DEALER_TURN,
        ENDED
    }
    
    struct Card {
        uint8 suit; // 0: Hearts, 1: Diamonds, 2: Clubs, 3: Spades
        uint8 rank; // 1-13 (Ace to King)
    }
    
    struct Game {
        address player;
        uint256 bet;
        Card[] playerCards;
        Card[] dealerCards;
        GameState state;
        uint256 requestId;
        bool playerStood;
        uint256 timestamp;
    }
    
    mapping(address => Game) public games;
    mapping(uint256 => address) public requestToPlayer;
    mapping(address => uint256) public playerBalances;
    
    event GameStarted(address indexed player, uint256 bet);
    event CardDealt(address indexed player, uint8 suit, uint8 rank, bool isDealer);
    event PlayerAction(address indexed player, string action);
    event GameEnded(address indexed player, string result, uint256 payout);
    event RandomnessRequested(uint256 requestId, address player);
    
    modifier gameExists() {
        require(games[msg.sender].state != GameState.WAITING, "No active game");
        _;
    }
    
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
    
    function startGame() external payable nonReentrant {
        require(msg.value >= minBet && msg.value <= maxBet, "Invalid bet amount");
        require(games[msg.sender].state == GameState.WAITING, "Game already in progress");
        require(address(this).balance >= msg.value * 2, "Insufficient house balance");
        
        Game storage game = games[msg.sender];
        game.player = msg.sender;
        game.bet = msg.value;
        game.state = GameState.PLAYER_TURN;
        game.requestId = 0;
        game.playerStood = false;
        game.timestamp = block.timestamp;
        
        // Clear arrays from previous games
        delete game.playerCards;
        delete game.dealerCards;
        
        // Request initial cards
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            3,
            i_callbackGasLimit,
            4 // Need 4 cards initially
        );
        
        games[msg.sender].requestId = requestId;
        requestToPlayer[requestId] = msg.sender;
        
        emit GameStarted(msg.sender, msg.value);
        emit RandomnessRequested(requestId, msg.sender);
    }
    
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address player = requestToPlayer[requestId];
        require(player != address(0), "Invalid request");
        
        Game storage game = games[player];
        
        if (game.playerCards.length == 0) {
            // Initial deal
            for (uint256 i = 0; i < 4; i++) {
                Card memory card = generateCard(randomWords[i % randomWords.length] + i);
                
                if (i % 2 == 0) {
                    game.playerCards.push(card);
                    emit CardDealt(player, card.suit, card.rank, false);
                } else {
                    game.dealerCards.push(card);
                    emit CardDealt(player, card.suit, card.rank, true);
                }
            }
            
            // Check for blackjack
            if (calculateHand(game.playerCards) == 21) {
                if (calculateHand(game.dealerCards) == 21) {
                    endGame(player, "push");
                } else {
                    endGame(player, "blackjack");
                }
            }
        } else {
            // Hit card
            Card memory card = generateCard(randomWords[0]);
            
            if (!game.playerStood) {
                game.playerCards.push(card);
                emit CardDealt(player, card.suit, card.rank, false);
                
                if (calculateHand(game.playerCards) > 21) {
                    endGame(player, "bust");
                }
            } else {
                // Dealer's turn
                game.dealerCards.push(card);
                emit CardDealt(player, card.suit, card.rank, true);
                
                uint256 dealerTotal = calculateHand(game.dealerCards);
                if (dealerTotal > 21) {
                    endGame(player, "dealer_bust");
                } else if (dealerTotal >= 17) {
                    finalizeDealerHand(player);
                } else {
                    // Dealer needs another card
                    requestDealerCard(player);
                }
            }
        }
    }
    
    function hit() external gameExists nonReentrant {
        Game storage game = games[msg.sender];
        require(game.state == GameState.PLAYER_TURN, "Not player's turn");
        require(!game.playerStood, "Already stood");
        
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            3,
            i_callbackGasLimit,
            1
        );
        
        requestToPlayer[requestId] = msg.sender;
        emit PlayerAction(msg.sender, "hit");
    }
    
    function stand() external gameExists nonReentrant {
        Game storage game = games[msg.sender];
        require(game.state == GameState.PLAYER_TURN, "Not player's turn");
        require(!game.playerStood, "Already stood");
        
        game.playerStood = true;
        game.state = GameState.DEALER_TURN;
        
        emit PlayerAction(msg.sender, "stand");
        
        // Start dealer's turn
        playDealerHand(msg.sender);
    }
    
    function doubleDown() external payable gameExists nonReentrant {
        Game storage game = games[msg.sender];
        require(game.state == GameState.PLAYER_TURN, "Not player's turn");
        require(game.playerCards.length == 2, "Can only double on initial hand");
        require(msg.value == game.bet, "Must match original bet");
        
        game.bet += msg.value;
        
        // Get one more card then stand
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            3,
            i_callbackGasLimit,
            1
        );
        
        requestToPlayer[requestId] = msg.sender;
        game.playerStood = true;
        
        emit PlayerAction(msg.sender, "double");
    }
    
    function playDealerHand(address player) private {
        Game storage game = games[player];
        uint256 dealerTotal = calculateHand(game.dealerCards);
        
        if (dealerTotal >= 17) {
            finalizeDealerHand(player);
        } else {
            requestDealerCard(player);
        }
    }
    
    function requestDealerCard(address player) private {
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            3,
            i_callbackGasLimit,
            1
        );
        
        requestToPlayer[requestId] = player;
    }
    
    function finalizeDealerHand(address player) private {
        Game storage game = games[player];
        uint256 playerTotal = calculateHand(game.playerCards);
        uint256 dealerTotal = calculateHand(game.dealerCards);
        
        if (dealerTotal > 21) {
            endGame(player, "dealer_bust");
        } else if (playerTotal > dealerTotal) {
            endGame(player, "win");
        } else if (dealerTotal > playerTotal) {
            endGame(player, "lose");
        } else {
            endGame(player, "push");
        }
    }
    
    function endGame(address player, string memory result) private {
        Game storage game = games[player];
        game.state = GameState.ENDED;
        
        uint256 payout = 0;
        
        if (keccak256(bytes(result)) == keccak256(bytes("blackjack"))) {
            payout = game.bet * 25 / 10; // 2.5x payout for blackjack
        } else if (keccak256(bytes(result)) == keccak256(bytes("win")) || 
                   keccak256(bytes(result)) == keccak256(bytes("dealer_bust"))) {
            payout = game.bet * 2; // 2x payout for regular win
        } else if (keccak256(bytes(result)) == keccak256(bytes("push"))) {
            payout = game.bet; // Return bet for push
        }
        
        if (payout > 0) {
            playerBalances[player] += payout;
        }
        
        emit GameEnded(player, result, payout);
        
        // Clean up
        delete games[player];
    }
    
    function withdraw() external nonReentrant {
        uint256 balance = playerBalances[msg.sender];
        require(balance > 0, "No balance to withdraw");
        
        playerBalances[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function generateCard(uint256 randomValue) private pure returns (Card memory) {
        uint8 suit = uint8(randomValue % 4);
        uint8 rank = uint8((randomValue / 4) % 13) + 1;
        return Card(suit, rank);
    }
    
    function calculateHand(Card[] memory cards) private pure returns (uint256) {
        uint256 total = 0;
        uint256 aces = 0;
        
        for (uint256 i = 0; i < cards.length; i++) {
            if (cards[i].rank == 1) {
                aces++;
                total += 11;
            } else if (cards[i].rank > 10) {
                total += 10;
            } else {
                total += cards[i].rank;
            }
        }
        
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        
        return total;
    }
    
    function getGameState(address player) external view returns (
        uint256 bet,
        uint256 playerTotal,
        uint256 dealerTotal,
        GameState state,
        Card[] memory playerCards,
        Card[] memory dealerCards
    ) {
        Game storage game = games[player];
        return (
            game.bet,
            calculateHand(game.playerCards),
            calculateHand(game.dealerCards),
            game.state,
            game.playerCards,
            game.dealerCards
        );
    }
    
    // Admin functions
    function fundHouse() external payable onlyOwner {}
    
    function withdrawHouseFunds(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    function setBettingLimits(uint256 _minBet, uint256 _maxBet) external onlyOwner {
        minBet = _minBet;
        maxBet = _maxBet;
    }
    
    receive() external payable {}
}