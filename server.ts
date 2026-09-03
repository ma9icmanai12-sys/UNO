import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { GameState, CardType, Color, Player } from "./src/types.js";
import { generateDeck, canPlayCard, calculateScore } from "./src/utils/gameLogic.js";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  // Store rooms and their game state
  const rooms: Record<string, { gameState: GameState; players: { socketId: string; id: string }[] }> = {};

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", ({ roomId, playerName, isAI }) => {
      socket.join(roomId);

      if (!rooms[roomId]) {
        // Create new room
        rooms[roomId] = {
          gameState: {
            deck: [],
            discardPile: [],
            players: [],
            currentPlayerIndex: 0,
            direction: 1,
            currentColor: 'red', // temporary
            status: 'lobby',
            winner: null,
            logs: [],
            lastAction: null,
            mustDrawCards: 0
          },
          players: []
        };
      }

      const room = rooms[roomId];
      const playerId = `p_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add player if room is not full (max 2 players, unless AI is used)
      if (room.players.length < 2) {
        room.players.push({ socketId: socket.id, id: playerId });
        room.gameState.players.push({
          id: playerId,
          name: playerName,
          hand: [],
          isAI: false,
          hasCalledUno: false
        });

        if (isAI) {
           room.gameState.players.push({
             id: 'ai_1',
             name: 'AI Opponent',
             hand: [],
             isAI: true,
             hasCalledUno: false
           });
        }
      }

      // If room is full, start game
      if (room.gameState.players.length === 2 && room.gameState.status === 'lobby') {
        startGame(roomId);
      }

      // Broadcast state to the existing player without the playerId (so it doesn't overwrite theirs)
      socket.to(roomId).emit("state_update", { gameState: room.gameState });
      
      // Send state to the new player with their assigned playerId
      socket.emit("state_update", { gameState: room.gameState, playerId });
    });

    socket.on("play_card", ({ roomId, playerId, card, chosenColor }) => {
      const room = rooms[roomId];
      if (!room || room.gameState.status !== 'playing') return;
      
      const gs = room.gameState;
      const playerIndex = gs.players.findIndex(p => p.id === playerId);
      if (playerIndex !== gs.currentPlayerIndex) return; // Not their turn
      
      const player = gs.players[playerIndex];
      const topCard = gs.discardPile[gs.discardPile.length - 1];

      if (!canPlayCard(card, topCard, gs.currentColor, gs.mustDrawCards)) {
        return;
      }

      const newColor = chosenColor || card.color;
      const newHand = player.hand.filter(c => c.id !== card.id);
      player.hand = newHand;

      let newMustDraw = gs.mustDrawCards;
      let nextIndex = (gs.currentPlayerIndex + gs.direction + 2) % 2;
      
      if (card.value === 'skip' || card.value === 'reverse') {
         nextIndex = gs.currentPlayerIndex; 
      } else if (card.value === 'draw2') {
         newMustDraw += 2;
      } else if (card.value === 'draw4') {
         newMustDraw += 4;
      }

      // Win condition
      if (newHand.length === 0) {
        gs.status = 'gameOver';
        gs.winner = player.name;
        const loserIndex = (gs.currentPlayerIndex + 1) % 2;
        const score = calculateScore(gs.players[loserIndex].hand);
        io.to(roomId).emit("game_over", { winner: player.name, score });
      }

      // UNO check
      if (newHand.length === 1 && !player.hasCalledUno && !player.isAI) {
        // Draw 2 penalty
        const { drawnCards } = drawCardsFromDeck(gs, 2);
        player.hand.push(...drawnCards);
      }

      player.hasCalledUno = false;
      gs.discardPile.push(card);
      gs.currentColor = newColor;
      gs.currentPlayerIndex = nextIndex;
      gs.mustDrawCards = newMustDraw;

      io.to(roomId).emit("state_update", { gameState: gs });
      io.to(roomId).emit("play_sound", { type: card.color === 'wild' ? 'wild' : (['skip', 'reverse', 'draw2'].includes(card.value) ? 'action' : 'play') });
    });

    socket.on("draw_card", ({ roomId, playerId }) => {
      const room = rooms[roomId];
      if (!room || room.gameState.status !== 'playing') return;
      
      const gs = room.gameState;
      const playerIndex = gs.players.findIndex(p => p.id === playerId);
      if (playerIndex !== gs.currentPlayerIndex) return;

      let cardsToDraw = gs.mustDrawCards > 0 ? gs.mustDrawCards : 1;
      const { drawnCards } = drawCardsFromDeck(gs, cardsToDraw);
      
      gs.players[playerIndex].hand.push(...drawnCards);
      gs.currentPlayerIndex = (gs.currentPlayerIndex + gs.direction + 2) % 2;
      gs.mustDrawCards = 0;

      io.to(roomId).emit("state_update", { gameState: gs });
      io.to(roomId).emit("play_sound", { type: 'draw' });
    });

    socket.on("call_uno", ({ roomId, playerId }) => {
      const room = rooms[roomId];
      if (!room || room.gameState.status !== 'playing') return;
      
      const player = room.gameState.players.find(p => p.id === playerId);
      if (player && player.hand.length <= 2) {
        player.hasCalledUno = true;
        io.to(roomId).emit("state_update", { gameState: room.gameState });
        io.to(roomId).emit("play_sound", { type: 'uno_voice', playerName: player.name });
      }
    });

    socket.on("ai_turn", ({ roomId }) => {
      // Allow client to request AI turn calculation to simplify server logic (since logic is shared)
      // For true strict server authority, we'd run AI on server interval. 
      // But keeping it simple for the demo.
      const room = rooms[roomId];
      if (!room) return;
      io.to(roomId).emit("state_update", { gameState: room.gameState });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          // If room is empty or it was an AI match (meaning the only human left), clean it up
          if (room.players.length === 0 || room.gameState.players.some(p => p.isAI)) {
            delete rooms[roomId];
          } else {
            // Notify remaining player
            io.to(roomId).emit("player_disconnected");
          }
        }
      }
    });
  });

  function startGame(roomId: string) {
    const gs = rooms[roomId].gameState;
    let deck = generateDeck();
    
    let firstCardIndex = deck.findIndex(c => c.color !== 'wild' && parseInt(c.value) >= 0);
    if (firstCardIndex === -1) firstCardIndex = 0;
    const firstCard = deck[firstCardIndex];
    deck.splice(firstCardIndex, 1);

    gs.deck = deck;
    gs.discardPile = [firstCard];
    gs.currentColor = firstCard.color;
    gs.status = 'playing';
    gs.currentPlayerIndex = 0;

    // Deal 7 cards
    for (let i = 0; i < 7; i++) {
      gs.players[0].hand.push(gs.deck.pop()!);
      gs.players[1].hand.push(gs.deck.pop()!);
    }
  }

  function drawCardsFromDeck(gs: GameState, count: number) {
    const drawnCards: CardType[] = [];
    for (let i = 0; i < count; i++) {
      if (gs.deck.length === 0) {
        const top = gs.discardPile.pop();
        gs.deck = generateDeck(); 
        if (top) gs.discardPile.push(top);
      }
      drawnCards.push(gs.deck.pop()!);
    }
    return { drawnCards };
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
