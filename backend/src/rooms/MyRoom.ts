import { Client, Room } from "@colyseus/core";
import { InputData, MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 100;
  state = new MyRoomState();
  fixedTimeStep = 1000 / 60;

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

      while (elapsedTime >= this.fixedTimeStep) {
        elapsedTime -= this.fixedTimeStep;
        this.fixedTick(this.fixedTimeStep);
      }
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

        player.tick = input.tick;
      }
    });
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
