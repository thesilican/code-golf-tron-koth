"use-strict";

// To make a submission, add a new bot instance to the array
//
// Please ensure that your bot's evaluation function:
//
// 1. executes reasonably fast. There is a hard limit of 1000ms per call, but please
//      try to keep it much lower than that if possible. Remember that the size of the playfield
//      increases as the player count increases, and that other people's computers
//      may be slower than yours
//
// 2. is 100% deterministic (i.e. will always return the same output given the same input state)
//      However, carrying state across executions (e.g. for caching) is permitted.
//      If you choose to do this, ensure that the function is still 100% deterministic;
//      you may enclose variables in an IIFE
//
// 3. does not attempt to tamper with the judging system, modify global variables,
//      or anything else illegal
//
// Best of luck!

const SUBMISSIONS = [
  new Bot("Blind Bot", "TheSilican", (state) => {
    const [x, y] = state.getSelf();
    if (state.get(x, y + 1) === " ") {
      return "N";
    } else if (state.get(x + 1, y) === " ") {
      return "E";
    } else if (state.get(x, y - 1) === " ") {
      return "S";
    } else if (state.get(x - 1, y) === " ") {
      return "W";
    }
    return "N";
  }),
  new Bot("Space Finder", "Spitemaster", (state) => {
    const [x, y] = state.getSelf();
    let starts = [
      [x, y + 1, "N"],
      [x + 1, y, "E"],
      [x, y - 1, "S"],
      [x - 1, y, "W"],
    ];
    let toSearch = starts.slice();
    toSearch = toSearch.filter((d) => state.get(d[0], d[1]) == " ");
    let searched = [];
    let adjacent = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];
    let dirs = {
      N: toSearch.find((s) => s[2] == "N") ? 1 : 0,
      E: toSearch.find((s) => s[2] == "E") ? 1 : 0,
      S: toSearch.find((s) => s[2] == "S") ? 1 : 0,
      W: toSearch.find((s) => s[2] == "W") ? 1 : 0,
    };
    let active = { ...dirs };
    // Determine the size of the spaces adjacent to each of the possible moves
    while (toSearch.length) {
      active[toSearch[0][2]]--;
      adjacent.forEach((a) => {
        if (!toSearch[0]) return;
        let loc = [
          toSearch[0][0] + a[0],
          toSearch[0][1] + a[1],
          toSearch[0][2],
        ];
        let tile = state.get(loc[0], loc[1]);
        if (tile == " ") {
          let prev = searched.find((s) => s[0] == loc[0] && s[1] == loc[1]);
          if (prev) {
            if (prev[2] == toSearch[0][2]) {
              return;
            }
            dirs[toSearch[0][2]] = prev[2];
            searched.forEach(
              (s) => (s[2] = s[2] == toSearch[0][2] ? prev[2] : s[2])
            );
            toSearch = toSearch.filter((d) => d[2] != toSearch[0][2]);
            if (Object.values(dirs).filter((v) => !isNaN(+v)).length == 2) {
              toSearch = [null];
              return;
            }
            return;
          }
          searched.push(loc);
          toSearch.push(loc);
          dirs[loc[2]]++;
          active[loc[2]]++;
        } else if (tile == "@") {
          dirs[loc[2]] /= 2;
        }
      });
      toSearch.shift();
      if (
        (active.N == 0) + (active.E == 0) + (active.S == 0) + (active.W == 0) ==
        3
      ) {
        let key = Object.keys(active).find((k) => active[k]);
        if (
          dirs[key] >
          Math.max(
            ...Object.entries(dirs)
              .filter((v) => v[0] != key && !isNaN(+v[1]))
              .map((v) => v[1])
          )
        )
          break;
      }
    }
    // Pick the move with the largest space
    for (let key of Object.keys(dirs)) {
      if (isNaN(+dirs[key])) dirs[key] = dirs[dirs[key]];
      if (isNaN(+dirs[key])) dirs[key] = dirs[dirs[key]];
    }
    let best = Math.max(...Object.values(dirs));
    let possible = Object.keys(dirs).filter((d) => dirs[d] == best);
    // Pick the move with the fewest things adjacent to it
    if (possible.length > 1) {
      let scores = { " ": 0, "#": 0, "@": 1 };
      possible = possible.map((p) => {
        let dir = starts.find((s) => s[2] == p);
        return [
          p,
          adjacent.reduce(
            (a, c) => a + scores[state.get(c[0] + dir[0], c[1] + dir[1])],
            0
          ),
        ];
      });
      possible = possible
        .filter((p) => p[1] == Math.min(...possible.map((p) => p[1])))
        .map((p) => p[0]);
    }
    return possible[0];
  }),
  new Bot("Dodge West", "Imanton1", (state) => {
    const [x, y] = state.getSelf();

    if (
      state.get(x - 1, y) === " " &&
      !(
        state.get(x - 2, y + 0) === "@" ||
        state.get(x - 1, y + 1) === "@" ||
        state.get(x - 1, y - 1) === "@"
      )
    )
      return "W";
    if (
      state.get(x, y + 1) === " " &&
      !(
        state.get(x + 0, y + 2) === "@" ||
        state.get(x + 1, y + 1) === "@" ||
        state.get(x - 1, y + 1) === "@"
      )
    )
      return "N";
    if (
      state.get(x, y - 1) === " " &&
      !(
        state.get(x + 0, y - 2) === "@" ||
        state.get(x + 1, y - 1) === "@" ||
        state.get(x - 1, y - 1) === "@"
      )
    )
      return "S";
    if (
      state.get(x + 1, y) === " " &&
      !(
        state.get(x + 2, y + 0) === "@" ||
        state.get(x + 1, y + 1) === "@" ||
        state.get(x + 1, y - 1) === "@"
      )
    )
      return "E";

    if (state.get(x - 1, y) === " ") return "W";
    if (state.get(x, y + 1) === " ") return "N";
    if (state.get(x, y - 1) === " ") return "S";
    if (state.get(x + 1, y) === " ") return "E";

    return "N";
  }),
  new Bot("Player Avoid", "Agent Biscutt", (state) => {
    const [x, y] = state.getSelf();
    if (
      state.get(x + 1, y) === " " &&
      (state.get(x + 1, y + 1) === " " || state.get(x + 1, y - 1) === " ") &&
      state.get(x + 1, y + 1) != "@" &&
      state.get(x + 1, y - 1) != "@" &&
      ((state.get(x - 1, y + 1) != "@" && state.get(x - 1, y - 1) != "@") ||
        state.get(x + 2, y) == "#") &&
      state.get(x + 2, y + 2) != "@" &&
      state.get(x + 2, y - 2) != "@" &&
      state.get(x - 2, y + 2) != "@" &&
      state.get(x - 2, y - 2) != "@" &&
      state.get(x + 2, y + 2) != "@" &&
      state.get(x + 2, y - 1) != "@" &&
      state.get(x - 2, y + 2) != "@" &&
      state.get(x - 2, y - 1) != "@" &&
      state.get(x + 2, y) != "@"
    ) {
      return "E";
    } else if (
      state.get(x - 1, y) === " " &&
      (state.get(x - 1, y + 1) === " " || state.get(x - 1, y - 1) === " ") &&
      state.get(x - 1, y + 1) != "@" &&
      state.get(x - 1, y - 1) != "@" &&
      ((state.get(x + 1, y + 1) != "@" && state.get(x + 1, y - 1) != "@") ||
        state.get(x + 2, y) == "#") &&
      state.get(x + 2, y + 2) != "@" &&
      state.get(x + 2, y - 2) != "@" &&
      state.get(x - 2, y + 2) != "@" &&
      state.get(x - 2, y - 2) != "@" &&
      state.get(x + 2, y + 2) != "@" &&
      state.get(x + 2, y - 1) != "@" &&
      state.get(x - 2, y + 2) != "@" &&
      state.get(x - 2, y - 1) != "@" &&
      state.get(x - 2, y) != "@"
    ) {
      return "W";
    } else if (
      state.get(x, y + 1) === " " &&
      state.get(x + 1, y + 1) != "@" &&
      state.get(x - 1, y + 1) != "@" &&
      state.get(x, y + 2) != "@"
    ) {
      return "N";
    } else if (
      state.get(x, y - 1) === " " &&
      state.get(x + 1, y - 1) != "@" &&
      state.get(x - 1, y - 1) != "@" &&
      state.get(x, y + 2) != "@"
    ) {
      return "S";
    }

    if (state.get(x, y + 1) === " " && state.get(x, y + 2) != "@") {
      return "N";
    } else if (state.get(x + 1, y) === " " && state.get(x + 2, y) != "@") {
      return "E";
    } else if (state.get(x, y - 1) === " " && state.get(x, y - 2) != "@") {
      return "S";
    } else if (state.get(x - 1, y) === " " && state.get(x - 2, y) != "@") {
      return "W";
    }
    if (state.get(x, y + 1) === " ") {
      return "N";
    } else if (state.get(x + 1, y) === " ") {
      return "E";
    } else if (state.get(x, y - 1) === " ") {
      return "S";
    } else if (state.get(x - 1, y) === " ") {
      return "W";
    }
    return "S";
  }),
];
