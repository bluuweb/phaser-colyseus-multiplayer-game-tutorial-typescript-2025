import { MapSchema, Schema, type } from "@colyseus/schema";

export interface InputData {
  left: false;
  right: false;
  up: false;
  down: false;
  tick: number;
}

export class Player extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("number") tick: number;
  @type("string") username: string = "Player";
  @type("string") shipType: string = "ship_0001";
  @type("number") score: number = 0; // Puntuación del jugador
  inputQueue: InputData[] = [];
}

export class Star extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("string") id: string;
}

export class Bomb extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("string") id: string;
}

export class MyRoomState extends Schema {
  @type("number") mapWidth: number;
  @type("number") mapHeight: number;
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Star }) stars = new MapSchema<Star>(); // Estrellas en el mapa
  @type({ map: Bomb }) bombs = new MapSchema<Bomb>(); // Bombas en el mapa
}
