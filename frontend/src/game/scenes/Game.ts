import { Client, getStateCallbacks, Room } from "colyseus.js";
import { Scene } from "phaser";

export const BACKEND_URL =
  window.location.href.indexOf("localhost") === -1
    ? `${window.location.protocol.replace("http", "ws")}//${
        window.location.hostname
      }${window.location.port && `:${window.location.port}`}`
    : "ws://localhost:2567";

export const BACKEND_HTTP_URL = BACKEND_URL.replace("ws", "http");

export class Game extends Scene {
  client = new Client("ws://localhost:2567");
  room: Room;

  currentPlayer: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  playerEntities: {
    [sessionId: string]: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  } = {};

  playerUsernames: {
    [sessionId: string]: Phaser.GameObjects.Text;
  } = {};

  // Estrellas en el juego
  starEntities: {
    [starId: string]: Phaser.GameObjects.Image;
  } = {};

  // UI del ranking
  rankingPanel: Phaser.GameObjects.Container;
  rankingTexts: Phaser.GameObjects.Text[] = [];

  debugFPS: Phaser.GameObjects.Text;

  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  wasdKeys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  inputPayload: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    tick?: number;
  } = {
    left: false,
    right: false,
    up: false,
    down: false,
    tick: undefined,
  };

  elapsedTime = 0;
  fixedTimeStep = 1000 / 60;

  currentTick: number = 0;

  constructor() {
    super({ key: "Game" });
  }

  async create() {
    this.cursorKeys = this.input!.keyboard!.createCursorKeys();

    // Crear controles WASD
    this.wasdKeys = {
      W: this.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.debugFPS = this.add.text(4, 4, "", { color: "#ff0000" });

    // connect with the room
    await this.connect();

    const $ = getStateCallbacks(this.room);

    $(this.room.state).players.onAdd((player, sessionId) => {
      // Crear sprite con la nave específica del jugador
      const entity = this.physics.add.image(
        player.x,
        player.y,
        player.shipType
      );
      this.playerEntities[sessionId] = entity;

      // Crear texto del username arriba del jugador
      const usernameText = this.add
        .text(player.x, player.y - 30, player.username, {
          fontSize: "12px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 2,
          align: "center",
        })
        .setOrigin(0.5);
      this.playerUsernames[sessionId] = usernameText;

      // Actualizar ranking cuando se agregue un nuevo jugador
      this.updateRanking();

      // is current player
      if (sessionId === this.room.sessionId) {
        this.currentPlayer = entity;

        $(player).onChange(() => {
          // Sincronización del servidor (opcional para debug)
          // No necesitamos mostrar la posición remota visualmente
          this.updateRanking(); // Actualizar ranking cuando cambie cualquier propiedad
        });
      } else {
        // listening for server updates
        $(player).onChange(() => {
          //
          // we're going to LERP the positions during the render loop.
          //
          entity.setData("serverX", player.x);
          entity.setData("serverY", player.y);
          this.updateRanking(); // Actualizar ranking para otros jugadores también
        });
      }
    });

    // remove local reference when entity is removed from the server
    $(this.room.state).players.onRemove((_player, sessionId) => {
      const entity = this.playerEntities[sessionId];
      const usernameText = this.playerUsernames[sessionId];

      if (entity) {
        entity.destroy();
        delete this.playerEntities[sessionId];
      }

      if (usernameText) {
        usernameText.destroy();
        delete this.playerUsernames[sessionId];
      }

      // Actualizar ranking cuando un jugador se desconecte
      this.updateRanking();
    });

    // Manejar estrellas
    $(this.room.state).stars.onAdd((star, starId) => {
      // Crear imagen de estrella
      const starEntity = this.add.image(star.x, star.y, "star");

      // Agregar animación de brillo
      this.tweens.add({
        targets: starEntity,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.starEntities[starId] = starEntity;
    });

    // Remover estrellas
    $(this.room.state).stars.onRemove((_star, starId) => {
      const starEntity = this.starEntities[starId];
      if (starEntity) {
        // Animación de desaparición
        this.tweens.add({
          targets: starEntity,
          scale: 2,
          alpha: 0,
          duration: 300,
          ease: "Back.easeIn",
          onComplete: () => {
            starEntity.destroy();
          },
        });
        delete this.starEntities[starId];
      }
    });

    // Crear panel de ranking
    this.createRankingPanel();

    // this.cameras.main.startFollow(this.ship, true, 0.2, 0.2);
    // this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(0, 0, 800, 600);
  }

  async connect() {
    // add connection status text
    const connectionStatusText = this.add
      .text(0, 0, "Trying to connect with the server...")
      .setStyle({ color: "#ff0000" })
      .setPadding(4);

    // Solicitar username al usuario
    let username = prompt(
      "¡Bienvenido al juego!\n\nIngresa tu nombre de usuario:"
    );

    // Validar username
    if (!username || username.trim() === "") {
      username = `Player_${Math.floor(Math.random() * 1000)}`;
    }

    // Limitar longitud del username
    username = username.trim().substring(0, 12);

    const client = new Client(BACKEND_URL);

    try {
      // Enviar username como opción al unirse a la sala
      this.room = await client.joinOrCreate("my_room", { username });

      // connection successful!
      connectionStatusText.destroy();
    } catch (e) {
      // couldn't connect
      connectionStatusText.text = "Could not connect with the server.";
    }
  }

  update(time: number, delta: number): void {
    // skip loop if not connected yet.
    if (!this.currentPlayer) {
      return;
    }

    this.elapsedTime += delta;
    while (this.elapsedTime >= this.fixedTimeStep) {
      this.elapsedTime -= this.fixedTimeStep;
      this.fixedTick(time, this.fixedTimeStep);
    }

    this.debugFPS.text = `Frame rate: ${this.game.loop.actualFps}`;
  }

  fixedTick(_time: any, _delta: any) {
    this.currentTick++;

    // const currentPlayerRemote = this.room.state.players.get(this.room.sessionId);
    // const ticksBehind = this.currentTick - currentPlayerRemote.tick;
    // console.log({ ticksBehind });

    const velocity = 2;

    // Combinar controles de flechas y WASD
    this.inputPayload.left =
      this.cursorKeys.left.isDown || this.wasdKeys.A.isDown;
    this.inputPayload.right =
      this.cursorKeys.right.isDown || this.wasdKeys.D.isDown;
    this.inputPayload.up = this.cursorKeys.up.isDown || this.wasdKeys.W.isDown;
    this.inputPayload.down =
      this.cursorKeys.down.isDown || this.wasdKeys.S.isDown;
    this.inputPayload.tick = this.currentTick;
    this.room.send(0, this.inputPayload);

    if (this.inputPayload.left) {
      this.currentPlayer.x -= velocity;
    } else if (this.inputPayload.right) {
      this.currentPlayer.x += velocity;
    }

    if (this.inputPayload.up) {
      this.currentPlayer.y -= velocity;
    } else if (this.inputPayload.down) {
      this.currentPlayer.y += velocity;
    }

    // Aplicar límites de pantalla en el cliente (predicción)
    this.currentPlayer.x = Math.max(0, Math.min(800, this.currentPlayer.x));
    this.currentPlayer.y = Math.max(0, Math.min(600, this.currentPlayer.y));

    // Actualizar posición del username del jugador actual
    const currentPlayerUsername = this.playerUsernames[this.room.sessionId];
    if (currentPlayerUsername) {
      currentPlayerUsername.x = this.currentPlayer.x;
      currentPlayerUsername.y = this.currentPlayer.y - 30;
    }

    for (let sessionId in this.playerEntities) {
      // interpolate all player entities
      // (except the current player)
      if (sessionId === this.room.sessionId) {
        continue;
      }

      const entity = this.playerEntities[sessionId];
      const usernameText = this.playerUsernames[sessionId];
      const { serverX, serverY } = entity.data.values;

      entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
      entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);

      // Actualizar posición del username siguiendo al jugador
      if (usernameText) {
        usernameText.x = entity.x;
        usernameText.y = entity.y - 30;
      }
    }
  }

  private createRankingPanel() {
    // Crear contenedor para el ranking en la esquina superior derecha
    this.rankingPanel = this.add.container(650, 20);

    // Título del ranking (sin fondo)
    const title = this.add
      .text(0, 0, "🏆 RANKING", {
        fontSize: "14px",
        color: "#FFD700",
        fontStyle: "bold",
        align: "left",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0, 0);
    this.rankingPanel.add(title);

    // Crear textos para el ranking como tabla (mostrar todos los jugadores)
    for (let i = 0; i < 10; i++) {
      const rankText = this.add
        .text(0, 25 + i * 18, "", {
          fontSize: "11px",
          color: "#ffffff",
          align: "left",
          stroke: "#000000",
          strokeThickness: 1,
        })
        .setOrigin(0, 0);
      this.rankingTexts.push(rankText);
      this.rankingPanel.add(rankText);
    }

    this.rankingPanel.setDepth(100); // Asegurar que esté encima de todo

    // Actualizar ranking inmediatamente
    this.updateRanking();
  }

  private updateRanking() {
    if (!this.room.state.players) return;

    // Crear array con jugadores y sus puntuaciones
    const playerScores: Array<{ username: string; score: number }> = [];

    this.room.state.players.forEach((player) => {
      playerScores.push({
        username: player.username,
        score: player.score || 0,
      });
    });

    // Ordenar por puntuación (mayor a menor)
    playerScores.sort((a, b) => b.score - a.score);

    // Actualizar textos del ranking como tabla
    for (let i = 0; i < this.rankingTexts.length; i++) {
      if (i < playerScores.length) {
        const player = playerScores[i];
        const position = i + 1;
        const medal =
          i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${position}.`;
        const color = i < 3 ? "#FFD700" : "#ffffff";

        // Formato tabla: posición + nombre + estrellas
        const maxNameLength = 12;
        const truncatedName =
          player.username.length > maxNameLength
            ? player.username.substring(0, maxNameLength - 2) + ".."
            : player.username.padEnd(maxNameLength);

        this.rankingTexts[i].setText(
          `${medal} ${truncatedName} ${player.score}⭐`
        );
        this.rankingTexts[i].setColor(color);
        this.rankingTexts[i].setVisible(true);
      } else {
        this.rankingTexts[i].setVisible(false);
      }
    }
  }
}
