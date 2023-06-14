const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");

let db = null;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

//////////////////////////////////////////////////////////
const listenAndinitializeDb = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running at  : http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error :${err.message}`);
    process.exit(1);
  }
};
listenAndinitializeDb();
/////////////////////////////////////////////////////////

// GET players
app.get("/players/", async (request, response) => {
  const playerDetails = `
    SELECT player_id  AS playerId ,
           player_name AS playerName
    FROM  player_details
    ORDER BY player_id;
   `;
  const finalOutputArray = await db.all(playerDetails);
  response.send(finalOutputArray);
});

// GET player on playerID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const playerDetails = `
    SELECT player_id  AS playerId ,
           player_name AS playerName
    FROM  player_details
    where player_id = ${playerId};`;
  const finalOutputArray = await db.get(playerDetails);
  response.send(finalOutputArray);
});

// PUT player detail

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerData = request.body;
  const { playerName } = playerData;
  const query = ` 
      UPDATE
        player_details 
        SET
          player_name = '${playerName}'        
      WHERE
          player_id = ${playerId} ;

  `;
  const responseDb = await db.run(query);
  response.send("Player Details Updated");
});

// GET match details on match_id

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const query = `
    SELECT match_id  AS matchId ,
            match ,
             year
    FROM  match_details
    where matchId = ${matchId};`;
  const finalOutput = await db.get(query);
  response.send(finalOutput);
});

// GET all matches of a PLayer
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const query = `
     SELECT    match_details.match_id AS matchId ,
               match_details.match ,
               match_details.year
     FROM   (player_details INNER JOIN  player_match_score ON  player_details.player_id = player_match_score.player_id)
      AS junction_table INNER JOIN match_details ON junction_table.match_id = match_details.match_id
        
     WHERE player_details.player_id = ${playerId} ;
  `;
  const finalOutput = await db.all(query);
  response.send(finalOutput);
});

// GET all player of match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const query = `
     SELECT   player_details.player_id AS playerId ,
               player_details.player_name AS playerName
     FROM   (match_details INNER JOIN  player_match_score ON match_details.match_id = player_match_score.match_id ) 
     AS junction_table  INNER JOIN player_details ON junction_table.player_id = player_details.player_id
        
     WHERE match_details.match_id = ${matchId} ;
  `;
  const finalOutput = await db.all(query);
  response.send(finalOutput);
});

// GET all type score of player

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const query = `
     SELECT   player_details.player_id AS playerId ,
               player_details.player_name AS playerName ,
                SUM(player_match_score.score) AS totalScore ,
               SUM (player_match_score.fours) AS totalFours ,
                SUM(player_match_score.sixes) AS totalSixes 

     FROM   player_details INNER JOIN  player_match_score ON player_details.player_id = player_match_score.player_id 
        
     WHERE player_details.player_id = ${playerId}
     GROUP BY playerId

     ;
  `;
  const finalOutput = await db.all(query);
  response.send(...finalOutput);
});

module.exports = listenAndinitializeDb;
module.exports = app;
