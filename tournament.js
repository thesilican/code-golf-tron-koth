"use-strict";

// Represents a bot participating in the tournament
class Bot {
  constructor(name, author, func) {
    // Name of the bot
    this.name = name;

    // Username of bot author
    this.author = author;

    // Bot evaluation function (should take 1 parameter: 'state')
    this.func = func;
  }

  // Wrapper around bot.func to handle invalid output, time-outs, and errors
  // Returns one of "N", "E", "S", "W", or null if there is an error
  getEval(state) {
    try {
      const start = performance.now();
      const result = this.func(state);
      const end = performance.now();

      if (end - start > 1000) {
        console.warn(`Bot ${this.name} exceeded 1000ms evaluation time limit`);
        return null;
      }

      if (["N", "E", "S", "W"].includes(result)) {
        return result;
      } else {
        console.warn(
          `Bot ${this.name} returned invalid value:`,
          result,
          `\n(Expected one of "N","E","S","W")`
        );
        return null;
      }
    } catch (err) {
      console.warn(`Bot ${this.name} encountered error while evaluating:`, err);
      return null;
    }
  }
}

// Represents one round of the tournament
class Round {
  constructor(bots) {
    // Array of bots
    this.bots = bots;

    // Board dimensions change with the number of bots
    const boardWidth = 12 * bots.length + 60;
    const boardHeight = 5 * bots.length + 25;
    // Board which represents the light-cycle playfield
    // " " is an empty tile, "#" is a filled tile
    this.board = [];
    for (let i = 0; i < boardWidth; i++) {
      const col = [];
      for (let j = 0; j < boardHeight; j++) {
        col.push(" ");
      }
      this.board.push(col);
    }

    // [x, y] coordinates for the heads of the bots
    this.heads = [];
    // Generate evenly-spaced spawn locations along the top/bottom edges
    for (let i = 0; i < bots.length; i++) {
      if (i % 2 === 0) {
        // Top edge
        const numBots = Math.ceil(bots.length / 2);
        const botIdx = Math.floor(i / 2);
        const x = Math.floor(boardWidth * ((botIdx + 0.5) / numBots));
        this.heads.push([x, boardHeight - 1]);
      } else {
        // Bottom edge
        const numBots = Math.floor(bots.length / 2);
        const botIdx = Math.floor(i / 2);
        const x = Math.floor(boardWidth * ((botIdx + 0.5) / numBots));
        this.heads.push([x, 0]);
      }
    }

    // An array of indicies of the bots that have been eliminated
    this.eliminated = [];

    // Turn number
    this.turnNum = 0;

    // String representation of the board at every turn
    this.frames = [this.toString()];
  }

  // Construct the 'state' object that is passed to the bot
  getStateObj(botIdx) {
    return {
      getDim: () => {
        return [this.board.length, this.board[0].length];
      },
      getSelf: () => {
        // Map to create a cloned array (to prevent bot function from modifying)
        return this.heads[botIdx].map((x) => x);
      },
      get: (x, y) => {
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
          throw new Error("Expected x and y to be integers");
        }
        const inBounds =
          x >= 0 && y >= 0 && x < this.board.length && y < this.board[0].length;
        if (!inBounds) {
          return "#";
        }
        for (const head of this.heads) {
          if (head[0] === x && head[1] === y) {
            return "@";
          }
        }
        return this.board[x][y];
      },
    };
  }

  // Returns whether or not the round is finished
  // (a round is finished when 1 or more bots have been eliminated)
  finished() {
    return this.eliminated.length > 0;
  }

  // Complete one turn of the current round
  doTurn() {
    if (this.finished()) {
      throw new Error("Cannot do turn when round is finished");
    }

    // Get bot evaluations
    const evaluations = [];
    for (let i = 0; i < this.bots.length; i++) {
      const state = this.getStateObj(i);
      const evaluation = this.bots[i].getEval(state);
      evaluations.push(evaluation);
    }

    // Update board and bot heads based on evaluation
    for (let i = 0; i < this.bots.length; i++) {
      const [oldX, oldY] = this.heads[i];
      let newPos;
      if (evaluations[i] === null) {
        continue;
      } else if (evaluations[i] === "N") {
        newPos = [oldX, oldY + 1];
      } else if (evaluations[i] === "E") {
        newPos = [oldX + 1, oldY];
      } else if (evaluations[i] === "S") {
        newPos = [oldX, oldY - 1];
      } else if (evaluations[i] === "W") {
        newPos = [oldX - 1, oldY];
      }

      this.board[oldX][oldY] = "#";
      this.heads[i] = newPos;
    }

    // Eliminate bots, if any
    for (let i = 0; i < this.bots.length; i++) {
      const boardW = this.board.length;
      const boardH = this.board[0].length;
      const [botX, botY] = this.heads[i];
      // Reasons for elimination
      const shouldEliminate =
        // Evaluation failed
        evaluations[i] === null ||
        // Head out of bounds
        botX < 0 ||
        botY < 0 ||
        botX >= boardW ||
        botY >= boardH ||
        // Head crashed into tail
        this.board[botX][botY] === "#" ||
        // Head crashed into another bot head
        this.heads.find(
          ([x, y], idx) => x === botX && y === botY && idx !== i
        ) !== undefined;

      if (shouldEliminate) {
        this.eliminated.push(i);
      }
    }

    this.turnNum++;
    this.frames.push(this.toString());
  }

  toString() {
    // Characters used to represent the heads of bots when printed
    const HEAD_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const boardW = this.board.length;
    const boardH = this.board[0].length;
    const parts = [];

    // Print turn number
    parts.push(`Turn ${this.turnNum}\n`);

    // Print board
    for (let j = boardH; j >= -1; j--) {
      for (let i = -1; i < boardW + 1; i++) {
        const findHead = this.heads
          .map(([x, y], idx) => ({ x, y, idx }))
          .find(({ x, y }) => x === i && y === j);
        if (findHead) {
          const headChar = HEAD_CHARS[findHead.idx];
          parts.push(headChar);
          continue;
        }

        const edgeX = i === -1 || i === boardW;
        const edgeY = j === -1 || j === boardH;
        if (edgeX && edgeY) {
          parts.push("+");
          continue;
        } else if (edgeX) {
          parts.push("|");
          continue;
        } else if (edgeY) {
          parts.push("-");
          continue;
        }

        parts.push(this.board[i][j]);
      }
      parts.push("\n");
    }
    parts.push("\n");

    // Print indicator for bots that have been eliminated
    if (this.eliminated.length > 0) {
      const names = this.eliminated.map((i) => this.bots[i].name);
      const plural = names.length > 1 ? "have been" : "has been";
      parts.push(`${names.join(", ")} ${plural} eliminated!\n\n`);
    }

    // Print the bots and the character for their head
    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      parts.push(`${HEAD_CHARS[i]}: ${bot.name}\n`);
    }
    return parts.join("");
  }
}

// Represents a full tournament consisting of multiple rounds
class Tournament {
  constructor(bots) {
    if (bots.length < 2) {
      throw new Error("Expected at least 2 bots in the tournament");
    }

    // Array of bots
    this.bots = bots;

    // Array of round objects, one for each round of the tournament
    this.rounds = [];

    // Array of indicies of bots that have been eliminated,
    // also used in reverse order to generate leaderboard standings
    this.eliminated = [];
  }

  // Check whether the tournament is finished
  // (a tournament is finished when there is at most 1 bot that is not eliminated)
  finished() {
    return this.bots.length - this.eliminated.length <= 1;
  }

  // Complete one round of the tournament
  doRound() {
    if (this.finished()) {
      throw new Error("Tournament cannot do round if already finished");
    }

    // Indexes of the bots participating in this round
    const roundBots = [];
    // Since this.eliminated and round.eliminated have different
    // indicies, it is necessary to keep track of the mapping
    // from round.eliminated => this.eliminated
    const roundMapping = new Map();
    for (let i = 0; i < this.bots.length; i++) {
      if (!this.eliminated.includes(i)) {
        roundBots.push(this.bots[i]);
        roundMapping.set(roundBots.length - 1, i);
      }
    }
    // Create and complete round
    const round = new Round(roundBots);
    while (!round.finished()) {
      round.doTurn();
    }
    this.rounds.push(round);
    this.eliminated.push(...round.eliminated.map((x) => roundMapping.get(x)));
  }

  // Get an array of bots, sorted based on leaderboard standings
  getLeaderboard() {
    if (!this.finished()) {
      throw new Error(
        "Cannot generate leaderboard when tournament isn't yet finished"
      );
    }

    const leaderboard = [];

    // Find the first place bot (only bot that hasn't been eliminated,
    // possibly none if all the bots crashed simultaneously in the last round)
    const firstPlace = this.bots.find((_, i) => !this.eliminated.includes(i));
    if (firstPlace) {
      leaderboard.push(firstPlace);
    }
    // Generate remaining leaderboard standings
    // from the reverse-order of the bots that were eliminated
    const remaining = this.eliminated.map((i) => this.bots[i]);
    remaining.reverse();
    leaderboard.push(...remaining);

    return leaderboard;
  }
}
