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

      // is current player
      if (sessionId === this.room.sessionId) {
        this.currentPlayer = entity;

        $(player).onChange(() => {
          // Sincronización del servidor (opcional para debug)
          // No necesitamos mostrar la posición remota visualmente
        });
      } else {
        // listening for server updates
        $(player).onChange(() => {
          //
          // we're going to LERP the positions during the render loop.
          //
          entity.setData("serverX", player.x);
          entity.setData("serverY", player.y);
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
    });

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
}
