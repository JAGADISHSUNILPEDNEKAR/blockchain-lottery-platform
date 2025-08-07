// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILottery {
    enum LotteryState {
        CLOSED,
        OPEN,
        CALCULATING
    }

    function startLottery(uint256 _duration) external;
    function buyTickets(uint256 _numberOfTickets) external payable;
    function endLottery() external;
    function withdrawWinnings() external;
    
    function getPlayers() external view returns (address[] memory);
    function getPlayerTicketCount(address player) external view returns (uint256);
    function getTotalTickets() external view returns (uint256);
    function getTimeRemaining() external view returns (uint256);
    
    function getLotteryInfo() external view returns (
        uint256 _lotteryId,
        LotteryState _state,
        uint256 _prizePool,
        uint256 _ticketPrice,
        uint256 _totalTickets,
        uint256 _startTime,
        uint256 _endTime
    );
}