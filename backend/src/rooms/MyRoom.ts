import { Client, Room } from "@colyseus/core";
import {
  Bomb,
  InputData,
  MyRoomState,
  Player,
  Star,
} from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 100;
  state = new MyRoomState();
  fixedTimeStep = 1000 / 60;

  // Control de generación de estrellas
  private starSpawnTimer = 0;
  private starSpawnInterval = 3000; // 3 segundos entre estrellas
  private maxStars = 5; // Máximo 5 estrellas simultáneas

  // Control de generación de bombas
  private bombSpawnTimer = 0;
  private bombSpawnInterval = 5000; // 5 segundos entre bombas
  private maxBombs = 3; // Máximo 3 bombas simultáneas

  onCreate(options: any) {
    // set map dimensions
    this.state.mapWidth = 800;
    this.state.mapHeight = 600;

    this.onMessage(0, (client, input) => {
      // handle player input
      const player = this.state.players.get(client.sessionId);

      // enqueue input to user input buffer.
      player.inputQueue.push(input);
    });

    let elapsedTime = 0;
    this.setSimulationInterval((deltaTime) => {
      elapsedTime += deltaTime;
      this.starSpawnTimer += deltaTime;
      this.bombSpawnTimer += deltaTime;

      while (elapsedTime >= this.fixedTimeStep) {
        elapsedTime -= this.fixedTimeStep;
        this.fixedTick(this.fixedTimeStep);
      }

      // Generar estrellas periódicamente
      this.handleStarSpawning();

      // Generar bombas periódicamente
      this.handleBombSpawning();
    });
  }

  private handleStarSpawning() {
    if (
      this.starSpawnTimer >= this.starSpawnInterval &&
      this.state.stars.size < this.maxStars
    ) {
      this.spawnStar();
      this.starSpawnTimer = 0;
    }
  }

  private handleBombSpawning() {
    if (
      this.bombSpawnTimer >= this.bombSpawnInterval &&
      this.state.bombs.size < this.maxBombs
    ) {
      this.spawnBomb();
      this.bombSpawnTimer = 0;
    }
  }

  private spawnStar() {
    const star = new Star();
    star.id = `star_${Date.now()}_${Math.random()}`;
    star.x = Math.random() * (this.state.mapWidth - 40) + 20; // 20px margen
    star.y = Math.random() * (this.state.mapHeight - 40) + 20; // 20px margen

    this.state.stars.set(star.id, star);
    console.log(`Star spawned at (${star.x}, ${star.y})`);
  }

  private spawnBomb() {
    const bomb = new Bomb();
    bomb.id = `bomb_${Date.now()}_${Math.random()}`;
    bomb.x = Math.random() * (this.state.mapWidth - 40) + 20; // 20px margen
    bomb.y = Math.random() * (this.state.mapHeight - 40) + 20; // 20px margen

    this.state.bombs.set(bomb.id, bomb);
    console.log(`Bomb spawned at (${bomb.x}, ${bomb.y})`);
  }

  private checkStarCollisions() {
    this.state.players.forEach((player, sessionId) => {
      this.state.stars.forEach((star, starId) => {
        const distance = Math.sqrt(
          Math.pow(player.x - star.x, 2) + Math.pow(player.y - star.y, 2)
        );

        // Si la distancia es menor a 30px, hay colisión
        if (distance < 30) {
          player.score += 1;
          this.state.stars.delete(starId);
          console.log(
            `${player.username} collected a star! Score: ${player.score}`
          );
        }
      });
    });
  }

  private checkBombCollisions() {
    this.state.players.forEach((player, sessionId) => {
      this.state.bombs.forEach((bomb, bombId) => {
        const distance = Math.sqrt(
          Math.pow(player.x - bomb.x, 2) + Math.pow(player.y - bomb.y, 2)
        );

        // Si la distancia es menor a 35px, hay colisión con bomba
        if (distance < 35) {
          player.score = 0; // El jugador pierde todas las estrellas
          this.state.bombs.delete(bombId); // La bomba explota y desaparece
          console.log(`💥 ${player.username} hit a bomb! All stars lost!`);

          // Enviar mensaje al cliente para activar efecto de explosión
          this.broadcast("bombExploded", {
            playerId: sessionId,
            x: bomb.x,
            y: bomb.y,
          });
        }
      });
    });
  }

  fixedTick(timeStep: number) {
    const velocity = 2;

    this.state.players.forEach((player) => {
      let input: InputData;

      // dequeue player inputs
      while ((input = player.inputQueue.shift())) {
        if (input.left) {
          player.x -= velocity;
        } else if (input.right) {
          player.x += velocity;
        }

        if (input.up) {
          player.y -= velocity;
        } else if (input.down) {
          player.y += velocity;
        }

        // Aplicar límites de pantalla (servidor autoritativo)
        player.x = Math.max(0, Math.min(this.state.mapWidth, player.x));
        player.y = Math.max(0, Math.min(this.state.mapHeight, player.y));

        player.tick = input.tick;
      }
    });

    // Verificar colisiones con estrellas
    this.checkStarCollisions();

    // Verificar colisiones con bombas
    this.checkBombCollisions();
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.x = Math.random() * this.state.mapWidth;
    player.y = Math.random() * this.state.mapHeight;

    // Configurar username y nave aleatoria
    player.username = options.username || "Player";

    // Seleccionar nave aleatoria del pool disponible
    const shipTypes = [
      "ship_0001",
      "ship_0002",
      "ship_0003",
      "ship_0004",
      "ship_0005",
      "ship_0006",
      "ship_0007",
      "ship_0008",
      "ship_0009",
      "ship_0010",
      "ship_0011",
      "ship_0012",
      "ship_0013",
      "ship_0014",
      "ship_0015",
      "ship_0016",
      "ship_0017",
      "ship_0018",
      "ship_0019",
      "ship_0020",
      "ship_0021",
      "ship_0022",
      "ship_0023",
    ];
    player.shipType = shipTypes[Math.floor(Math.random() * shipTypes.length)];

    console.log(`${player.username} joined with ship: ${player.shipType}`);
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
