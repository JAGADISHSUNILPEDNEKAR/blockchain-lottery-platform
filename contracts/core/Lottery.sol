// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "./interfaces/ILottery.sol";

contract Lottery is ILottery, VRFConsumerBaseV2, ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery Variables
    uint256 public lotteryId;
    uint256 public ticketPrice;
    uint256 public maxTicketsPerPlayer;
    uint256 public lotteryStartTime;
    uint256 public lotteryEndTime;
    uint256 public prizePool;
    uint256 public platformFeePercentage; // Basis points (100 = 1%)
    uint256 public charityFeePercentage; // Basis points
    
    address public charityAddress;
    address public platformAddress;
    
    // State
    LotteryState public lotteryState;
    address[] public players;
    address public recentWinner;
    uint256 public recentRandomWord;
    
    // Mappings
    mapping(address => uint256) public ticketCount;
    mapping(uint256 => address) public lotteryHistory;
    mapping(address => uint256) public winnings;
    mapping(uint256 => RequestStatus) public s_requests;
    
    // Structs
    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
    }
    
    // Events
    event LotteryEntered(address indexed player, uint256 ticketsBought, uint256 totalTickets);
    event RequestedLotteryWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner, uint256 amount, uint256 lotteryId);
    event WinningsWithdrawn(address indexed player, uint256 amount);
    event LotteryStarted(uint256 indexed lotteryId, uint256 startTime, uint256 endTime);
    event FeesDistributed(uint256 platformFee, uint256 charityFee);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        uint256 _ticketPrice,
        uint256 _maxTicketsPerPlayer,
        address _charityAddress,
        address _platformAddress
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        
        ticketPrice = _ticketPrice;
        maxTicketsPerPlayer = _maxTicketsPerPlayer;
        charityAddress = _charityAddress;
        platformAddress = _platformAddress;
        
        platformFeePercentage = 250; // 2.5%
        charityFeePercentage = 250; // 2.5%
        lotteryState = LotteryState.CLOSED;
        lotteryId = 1;
    }

    function startLottery(uint256 _duration) external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Lottery already running");
        require(_duration > 0, "Duration must be greater than 0");
        
        lotteryState = LotteryState.OPEN;
        lotteryStartTime = block.timestamp;
        lotteryEndTime = block.timestamp + _duration;
        delete players;
        prizePool = 0;
        
        emit LotteryStarted(lotteryId, lotteryStartTime, lotteryEndTime);
    }

    function buyTickets(uint256 _numberOfTickets) external payable nonReentrant {
        require(lotteryState == LotteryState.OPEN, "Lottery not open");
        require(block.timestamp < lotteryEndTime, "Lottery ended");
        require(_numberOfTickets > 0, "Must buy at least 1 ticket");
        require(
            ticketCount[msg.sender].add(_numberOfTickets) <= maxTicketsPerPlayer,
            "Exceeds max tickets per player"
        );
        require(msg.value == ticketPrice.mul(_numberOfTickets), "Incorrect ETH amount");

        ticketCount[msg.sender] = ticketCount[msg.sender].add(_numberOfTickets);
        
        for (uint256 i = 0; i < _numberOfTickets; i++) {
            players.push(msg.sender);
        }
        
        prizePool = prizePool.add(msg.value);
        
        emit LotteryEntered(msg.sender, _numberOfTickets, ticketCount[msg.sender]);
    }

    function endLottery() external nonReentrant {
        require(lotteryState == LotteryState.OPEN, "Lottery not open");
        require(
            block.timestamp >= lotteryEndTime || msg.sender == owner(),
            "Lottery period not ended"
        );
        require(players.length > 0, "No players in lottery");
        
        lotteryState = LotteryState.CALCULATING;
        
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        
        s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        
        emit RequestedLotteryWinner(requestId);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        require(s_requests[requestId].exists, "Request not found");
        require(lotteryState == LotteryState.CALCULATING, "Not calculating");
        
        s_requests[requestId].fulfilled = true;
        s_requests[requestId].randomWords = randomWords;
        
        uint256 indexOfWinner = randomWords[0] % players.length;
        address winner = players[indexOfWinner];
        recentWinner = winner;
        recentRandomWord = randomWords[0];
        
        // Calculate fees
        uint256 platformFee = prizePool.mul(platformFeePercentage).div(10000);
        uint256 charityFee = prizePool.mul(charityFeePercentage).div(10000);
        uint256 winnerPrize = prizePool.sub(platformFee).sub(charityFee);
        
        // Update winner's balance
        winnings[winner] = winnings[winner].add(winnerPrize);
        
        // Transfer fees
        if (platformFee > 0) {
            (bool platformSuccess, ) = platformAddress.call{value: platformFee}("");
            require(platformSuccess, "Platform fee transfer failed");
        }
        
        if (charityFee > 0) {
            (bool charitySuccess, ) = charityAddress.call{value: charityFee}("");
            require(charitySuccess, "Charity fee transfer failed");
        }
        
        emit FeesDistributed(platformFee, charityFee);
        emit WinnerPicked(winner, winnerPrize, lotteryId);
        
        // Reset for next lottery
        lotteryHistory[lotteryId] = winner;
        lotteryId = lotteryId.add(1);
        lotteryState = LotteryState.CLOSED;
        
        // Clear ticket counts
        for (uint256 i = 0; i < players.length; i++) {
            delete ticketCount[players[i]];
        }
    }

    function withdrawWinnings() external nonReentrant {
        uint256 amount = winnings[msg.sender];
        require(amount > 0, "No winnings to withdraw");
        
        winnings[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit WinningsWithdrawn(msg.sender, amount);
    }

    // View Functions
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getPlayerTicketCount(address player) external view returns (uint256) {
        return ticketCount[player];
    }

    function getTotalTickets() external view returns (uint256) {
        return players.length;
    }

    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= lotteryEndTime) {
            return 0;
        }
        return lotteryEndTime - block.timestamp;
    }

    function getLotteryInfo() external view returns (
        uint256 _lotteryId,
        LotteryState _state,
        uint256 _prizePool,
        uint256 _ticketPrice,
        uint256 _totalTickets,
        uint256 _startTime,
        uint256 _endTime
    ) {
        return (
            lotteryId,
            lotteryState,
            prizePool,
            ticketPrice,
            players.length,
            lotteryStartTime,
            lotteryEndTime
        );
    }

    // Admin Functions
    function setTicketPrice(uint256 _ticketPrice) external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Cannot change during lottery");
        ticketPrice = _ticketPrice;
    }

    function setMaxTicketsPerPlayer(uint256 _max) external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Cannot change during lottery");
        maxTicketsPerPlayer = _max;
    }

    function setFees(uint256 _platformFee, uint256 _charityFee) external onlyOwner {
        require(_platformFee + _charityFee <= 1000, "Total fees cannot exceed 10%");
        platformFeePercentage = _platformFee;
        charityFeePercentage = _charityFee;
    }

    function setAddresses(address _charity, address _platform) external onlyOwner {
        charityAddress = _charity;
        platformAddress = _platform;
    }

    // Emergency Functions
    function emergencyWithdraw() external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Cannot withdraw during lottery");
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable {}
}