// Frontend contract utilities and ABIs
// Update these addresses after deployment

export const LOTTERY_ADDRESS = (process.env.REACT_APP_LOTTERY_ADDRESS || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9') as `0x${string}`;
export const BLACKJACK_ADDRESS = (process.env.REACT_APP_BLACKJACK_ADDRESS || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707') as `0x${string}`;
export const BINGO_ADDRESS = (process.env.REACT_APP_BINGO_ADDRESS || '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853') as `0x${string}`;

export const LOTTERY_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_duration", "type": "uint256" }
    ],
    "name": "startLottery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_numberOfTickets", "type": "uint256" }
    ],
    "name": "buyTickets",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endLottery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLotteryInfo",
    "outputs": [
      { "internalType": "uint256", "name": "_lotteryId", "type": "uint256" },
      { "internalType": "enum ILottery.LotteryState", "name": "_state", "type": "uint8" },
      { "internalType": "uint256", "name": "_prizePool", "type": "uint256" },
      { "internalType": "uint256", "name": "_ticketPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalTickets", "type": "uint256" },
      { "internalType": "uint256", "name": "_startTime", "type": "uint256" },
      { "internalType": "uint256", "name": "_endTime", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerTicketCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "recentWinner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ticketPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "ticketsBought", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalTickets", "type": "uint256" }
    ],
    "name": "LotteryEntered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "lotteryId", "type": "uint256" }
    ],
    "name": "WinnerPicked",
    "type": "event"
  }
] as const;

export const BLACKJACK_ABI = [
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stand",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "doubleDown",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getGameState",
    "outputs": [
      { "internalType": "uint256", "name": "bet", "type": "uint256" },
      { "internalType": "uint256", "name": "playerTotal", "type": "uint256" },
      { "internalType": "uint256", "name": "dealerTotal", "type": "uint256" },
      { "internalType": "enum Blackjack.GameState", "name": "state", "type": "uint8" },
      {
        "components": [
          { "internalType": "uint8", "name": "suit", "type": "uint8" },
          { "internalType": "uint8", "name": "rank", "type": "uint8" }
        ],
        "internalType": "struct Blackjack.Card[]",
        "name": "playerCards",
        "type": "tuple[]"
      },
      {
        "components": [
          { "internalType": "uint8", "name": "suit", "type": "uint8" },
          { "internalType": "uint8", "name": "rank", "type": "uint8" }
        ],
        "internalType": "struct Blackjack.Card[]",
        "name": "dealerCards",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minBet",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxBet",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "bet", "type": "uint256" }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "result", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" }
    ],
    "name": "GameEnded",
    "type": "event"
  }
] as const;

export const BINGO_ABI = [
  {
    "inputs": [],
    "name": "startNewGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyCard",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "drawNumber",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "cardId", "type": "uint256" },
      { "internalType": "uint8", "name": "number", "type": "uint8" }
    ],
    "name": "markNumber",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "cardId", "type": "uint256" }
    ],
    "name": "claimBingo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_gameId", "type": "uint256" }
    ],
    "name": "getGameInfo",
    "outputs": [
      { "internalType": "enum Bingo.GameState", "name": "state", "type": "uint8" },
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint256", "name": "pool", "type": "uint256" },
      { "internalType": "uint256", "name": "totalPlayers", "type": "uint256" },
      { "internalType": "uint256", "name": "numbersDrawn", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cardPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "startTime", "type": "uint256" }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": false, "internalType": "uint8", "name": "number", "type": "uint8" }
    ],
    "name": "NumberDrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "prize", "type": "uint256" }
    ],
    "name": "BingoClaimed",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" },
      { "internalType": "uint256", "name": "_gameId", "type": "uint256" }
    ],
    "name": "getPlayerCards",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_gameId", "type": "uint256" },
      { "internalType": "uint256", "name": "cardId", "type": "uint256" }
    ],
    "name": "getCardDetails",
    "outputs": [
      { "internalType": "uint8[25]", "name": "numbers", "type": "uint8[25]" },
      { "internalType": "bool[25]", "name": "marked", "type": "bool[25]" },
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_gameId", "type": "uint256" }
    ],
    "name": "getDrawnNumbers",
    "outputs": [
      { "internalType": "uint8[]", "name": "", "type": "uint8[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentGameId",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;