# 🎮 Fullstack RPG - Tutorial Completo para Principiantes

Un proyecto de juego multijugador en tiempo real desarrollado con **Phaser 3** (cliente) y **Colyseus** (servidor). Este proyecto te permitirá aprender los fundamentos del desarrollo de juegos web y sistemas multijugador.

## 📖 ¿Qué es este proyecto?

Este es un **juego RPG multijugador** donde los jugadores pueden moverse en tiempo real y ver a otros jugadores conectados. Implementa:

- ✅ **Sistema de escenas** con flujo de juego completo
- ✅ **Multijugador en tiempo real** con sincronización de estados
- ✅ **Predicción del lado del cliente** para movimiento fluido
- ✅ **Interpolación** de posiciones de otros jugadores
- ✅ **Sistema de ticks fijos** para consistencia en el servidor

## 🚀 Instalación Rápida

### Prerrequisitos

- Node.js 16+ instalado
- Un editor de código (VS Code recomendado)

### Configuración del Proyecto

1. **Clona o descarga el proyecto**
2. **Instalar dependencias del backend:**

   ```bash
   cd backend
   npm install
   ```

3. **Instalar dependencias del frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

### Ejecutar el Proyecto

1. **Iniciar el servidor (backend):**

   ```bash
   cd backend
   npm run dev
   ```

   ✅ El servidor estará en `http://localhost:2567`

2. **Iniciar el cliente (frontend):**

   ```bash
   cd frontend
   npm run dev
   ```

   ✅ El juego estará en `http://localhost:8080`

3. **¡Jugar!**
   - Abre múltiples pestañas del navegador para ver el multijugador
   - Usa las flechas del teclado para moverte

## 🎯 ¿Qué es Phaser 3?

**Phaser** es un framework de JavaScript para crear juegos 2D que funcionan en navegadores web. Es como el "motor" que maneja gráficos, sonido, física y entrada del usuario.

### Conceptos Fundamentales de Phaser

#### 1. El Game Object (Objeto Juego)

```typescript
// frontend/src/game/root.ts - Configuración principal
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO, // Usa WebGL o Canvas automáticamente
  width: 800, // Ancho del juego en píxeles
  height: 600, // Alto del juego en píxeles
  parent: "game-container", // Elemento HTML donde se renderiza
  backgroundColor: "#028af8", // Color de fondo
  physics: {
    default: "arcade", // Sistema de física arcade (simple)
  },
  pixelArt: true, // Optimizado para gráficos pixelados
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver], // Lista de escenas
};
```

#### 2. Escenas (Scenes) - Los "Estados" del Juego

Las escenas son como diferentes pantallas o estados de tu juego:

##### 🔧 Boot Scene (`frontend/src/game/scenes/Boot.ts`)

**Propósito:** Primera escena que se ejecuta, carga recursos mínimos

```typescript
export class Boot extends Scene {
  preload() {
    // Carga solo recursos esenciales (fondos, logos)
    this.load.image("background", "assets/bg.png");
  }

  create() {
    // Inmediatamente cambia a Preloader
    this.scene.start("Preloader");
  }
}
```

##### ⏳ Preloader Scene (`frontend/src/game/scenes/Preloader.ts`)

**Propósito:** Muestra progreso de carga y carga todos los assets del juego

```typescript
export class Preloader extends Scene {
  init() {
    // Muestra fondo y crea barra de progreso visual
    this.add.image(512, 384, "background");
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    // Actualiza barra cuando cargan assets
    this.load.on("progress", (progress: number) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    // Carga todos los assets del juego
    this.load.image("logo", "logo.png");
    this.load.image("ship_0001", "ship_0001.png");
  }
}
```

##### 🎮 Main Menu Scene (`frontend/src/game/scenes/MainMenu.ts`)

**Propósito:** Menú principal con logo y texto

```typescript
export class MainMenu extends Scene {
  create() {
    // Muestra logo y título
    this.add.image(512, 300, "logo");
    this.add
      .text(512, 460, "Main Menu", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Al hacer clic, inicia el juego
    this.input.once("pointerdown", () => {
      this.scene.start("Game");
    });
  }
}
```

##### 🎯 Game Scene (`frontend/src/game/scenes/Game.ts`) - ¡El Corazón!

**Propósito:** Escena principal donde ocurre toda la jugabilidad multijugador

**Métodos Principales:**

```typescript
export class Game extends Scene {
  async create() {
    // 1. Configurar controles
    this.cursorKeys = this.input.keyboard.createCursorKeys();

    // 2. Conectar al servidor Colyseus
    await this.connect();

    // 3. Configurar callbacks para jugadores
    this.room.state.players.onAdd((player, sessionId) => {
      // Crear sprite cuando un jugador se une
      const entity = this.physics.add.image(player.x, player.y, "ship_0001");
      this.playerEntities[sessionId] = entity;
    });
  }

  update(time: number, delta: number) {
    // Se ejecuta cada frame (60 veces por segundo)
    // Maneja el loop de juego con tiempo fijo
    this.elapsedTime += delta;
    while (this.elapsedTime >= this.fixedTimeStep) {
      this.elapsedTime -= this.fixedTimeStep;
      this.fixedTick(time, this.fixedTimeStep);
    }
  }

  fixedTick() {
    // Procesa entrada del usuario
    // Mueve jugador localmente (predicción)
    // Envía input al servidor
    // Interpola otros jugadores
  }
}
```

## 🌐 ¿Qué es Colyseus?

**Colyseus** es un framework de servidor para crear juegos multijugador en tiempo real. Maneja la comunicación entre múltiples clientes y sincroniza el estado del juego.

### Arquitectura del Servidor

#### 1. Punto de Entrada (`backend/src/index.ts`)

```typescript
// Importa configuración y inicia servidor
import { listen } from "@colyseus/tools";
import app from "./app.config";

listen(app); // Escucha en puerto 2567
```

#### 2. Configuración del Servidor (`backend/src/app.config.ts`)

```typescript
export default config({
  initializeGameServer: (gameServer) => {
    // Registra tipos de salas disponibles
    gameServer.define("my_room", MyRoom);
  },

  initializeExpress: (app) => {
    // Configura rutas HTTP adicionales
    app.get("/hello_world", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    // Panel de monitoreo en /monitor
    app.use("/monitor", monitor());
  },
});
```

#### 3. La Sala de Juego (`backend/src/rooms/MyRoom.ts`) - ¡El Cerebro!

Una **Room** es donde ocurre toda la lógica del juego multijugador:

```typescript
export class MyRoom extends Room<MyRoomState> {
  maxClients = 4; // Máximo 4 jugadores por sala
  fixedTimeStep = 1000 / 60; // 60 ticks por segundo

  onCreate(options: any) {
    // Configuración inicial
    this.state.mapWidth = 800;
    this.state.mapHeight = 600;

    // Escucha mensajes del cliente (mensaje tipo 0 = movimiento)
    this.onMessage(0, (client, input) => {
      const player = this.state.players.get(client.sessionId);
      player.inputQueue.push(input); // Agrega a cola de entrada
    });

    // Simulación de servidor a ticks fijos
    this.setSimulationInterval((deltaTime) => {
      // Procesa todos los inputs pendientes
      this.fixedTick(this.fixedTimeStep);
    });
  }

  fixedTick(timeStep: number) {
    const velocity = 2;

    this.state.players.forEach((player) => {
      let input: InputData;

      // Procesa todos los inputs en cola
      while ((input = player.inputQueue.shift())) {
        if (input.left) player.x -= velocity;
        if (input.right) player.x += velocity;
        if (input.up) player.y -= velocity;
        if (input.down) player.y += velocity;

        player.tick = input.tick; // Sincroniza tick
      }
    });
  }

  onJoin(client: Client, options: any) {
    // Se ejecuta cuando un jugador se conecta
    const player = new Player();
    player.x = Math.random() * this.state.mapWidth; // Posición aleatoria
    player.y = Math.random() * this.state.mapHeight;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    // Se ejecuta cuando un jugador se desconecta
    this.state.players.delete(client.sessionId);
  }
}
```

#### 4. Estado del Juego (`backend/src/rooms/schema/MyRoomState.ts`)

El **Estado** es lo que se sincroniza entre servidor y todos los clientes:

```typescript
export class Player extends Schema {
  @type("number") x: number; // Posición X
  @type("number") y: number; // Posición Y
  @type("number") tick: number; // Tick actual para sincronización
  inputQueue: InputData[] = []; // Cola de inputs (no se sincroniza)
}

export class MyRoomState extends Schema {
  @type("number") mapWidth: number; // Ancho del mapa
  @type("number") mapHeight: number; // Alto del mapa
  @type({ map: Player }) players = new MapSchema<Player>(); // Todos los jugadores
}

export interface InputData {
  left: boolean; // ¿Presionando izquierda?
  right: boolean; // ¿Presionando derecha?
  up: boolean; // ¿Presionando arriba?
  down: boolean; // ¿Presionando abajo?
  tick: number; // Tick del cliente cuando envió input
}
```

## 🔄 Flujo de Comunicación Cliente-Servidor

### 1. **Inicialización**

```mermaid
Cliente → Servidor: Conectar a ws://localhost:2567
Cliente → Servidor: Unirse a sala "my_room"
Servidor → Cliente: Envía estado inicial (otros jugadores)
```

### 2. **Loop de Juego (cada frame)**

```mermaid
Cliente: Lee teclas presionadas
Cliente: Mueve jugador localmente (PREDICCIÓN)
Cliente → Servidor: Envía input {left: true, tick: 1234}
Servidor: Procesa input, actualiza posición oficial
Servidor → Todos: Sincroniza nuevo estado
Cliente: Compara posición local vs servidor (RECONCILIACIÓN)
```

### 3. **Otros Jugadores**

```mermaid
Servidor → Cliente: Estado de otros jugadores actualizado
Cliente: INTERPOLA posiciones suavemente
Cliente: Renderiza frame con todos los jugadores
```

## 🛠️ Técnicas Avanzadas Implementadas

### 1. **Predicción del Lado del Cliente**

```typescript
// En Game.ts - fixedTick()
// El cliente mueve al jugador INMEDIATAMENTE
if (this.inputPayload.left) {
  this.currentPlayer.x -= velocity; // ⚡ Respuesta inmediata
}
// Luego envía el input al servidor
this.room.send(0, this.inputPayload);
```

### 2. **Interpolación de Otros Jugadores**

```typescript
// En Game.ts - fixedTick()
for (let sessionId in this.playerEntities) {
  if (sessionId === this.room.sessionId) continue; // Saltar jugador local

  const entity = this.playerEntities[sessionId];
  const { serverX, serverY } = entity.data.values;

  // Mueve suavemente hacia la posición del servidor
  entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2); // 🌊 Interpolación suave
  entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
}
```

### 3. **Sistema de Ticks Fijos**

```typescript
// Tanto cliente como servidor usan tiempo fijo
const fixedTimeStep = 1000 / 60; // 60 FPS

update(time: number, delta: number) {
  this.elapsedTime += delta;
  while (this.elapsedTime >= this.fixedTimeStep) {
    this.elapsedTime -= this.fixedTimeStep;
    this.fixedTick(); // ⏰ Lógica a tiempo fijo
  }
}
```

## 🎓 Tutorial: Crear tu Primera Función

### Ejemplo 1: Agregar Sistema de Chat

**1. Añadir al estado (Backend):**

```typescript
// MyRoomState.ts
export class ChatMessage extends Schema {
  @type("string") text: string;
  @type("string") author: string;
}

export class MyRoomState extends Schema {
  // ... código existente ...
  @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();
}
```

**2. Manejar mensajes (Backend):**

```typescript
// MyRoom.ts - dentro de onCreate()
this.onMessage("chat", (client, data) => {
  const message = new ChatMessage();
  message.text = data.text;
  message.author = client.sessionId;
  this.state.messages.push(message);
});
```

**3. Enviar desde cliente (Frontend):**

```typescript
// Game.ts - dentro de create()
this.input.keyboard.on("keydown-ENTER", () => {
  const text = prompt("Escribe tu mensaje:");
  if (text) {
    this.room.send("chat", { text });
  }
});
```

### Ejemplo 2: Sistema de Salud

**1. Añadir al jugador:**

```typescript
// MyRoomState.ts
export class Player extends Schema {
  // ... código existente ...
  @type("number") health: number = 100;
}
```

**2. Mostrar en cliente:**

```typescript
// Game.ts - dentro de create()
$(this.room.state).players.onAdd((player, sessionId) => {
  const entity = this.physics.add.image(player.x, player.y, "ship_0001");

  // Crear barra de salud
  const healthBar = this.add.rectangle(
    player.x,
    player.y - 20,
    50,
    5,
    0x00ff00
  );

  $(player).onChange(() => {
    // Actualizar barra según salud actual
    healthBar.width = (player.health / 100) * 50;
    healthBar.fillColor = player.health > 50 ? 0x00ff00 : 0xff0000;
  });
});
```

## 📁 Estructura de Archivos Explicada

```
fullstack-rpg/
├── frontend/                          # 🎮 CLIENTE (Phaser 3)
│   ├── src/
│   │   ├── main.ts                   # 🚀 Punto de entrada, inicia el juego
│   │   └── game/
│   │       ├── root.ts               # ⚙️ Configuración principal de Phaser
│   │       └── scenes/               # 🎬 Todas las escenas del juego
│   │           ├── Boot.ts           # 🔧 Carga recursos básicos
│   │           ├── Preloader.ts      # ⏳ Carga assets + barra progreso
│   │           ├── MainMenu.ts       # 📋 Menú principal
│   │           ├── Game.ts           # 🎯 Juego multijugador principal
│   │           └── GameOver.ts       # 💀 Pantalla de fin de juego
│   ├── public/
│   │   ├── assets/                   # 🖼️ Imágenes, sonidos, etc.
│   │   └── style.css                 # 🎨 Estilos CSS
│   ├── index.html                    # 🌐 HTML principal
│   ├── package.json                  # 📦 Dependencias del frontend
│   └── vite/                         # ⚡ Configuración Vite (bundler)
├── backend/                          # 🖥️ SERVIDOR (Colyseus)
│   ├── src/
│   │   ├── index.ts                  # 🚀 Punto de entrada del servidor
│   │   ├── app.config.ts             # ⚙️ Configuración servidor y rutas
│   │   └── rooms/                    # 🏠 Lógica de salas multijugador
│   │       ├── MyRoom.ts             # 🧠 Sala principal, lógica del juego
│   │       └── schema/               # 📋 Definición de estados
│   │           └── MyRoomState.ts    # 🔄 Estado sincronizado jugadores
│   ├── package.json                  # 📦 Dependencias del backend
│   └── loadtest/                     # 🧪 Pruebas de carga
└── README.md                         # 📖 Esta documentación
```

## 🔧 Comandos de Desarrollo

### Frontend

```bash
npm run dev          # 🚀 Servidor desarrollo (localhost:8080)
npm run build        # 📦 Compilar para producción
```

### Backend

```bash
npm run dev          # 🚀 Servidor desarrollo con recarga automática
npm run build        # 📦 Compilar TypeScript
npm run loadtest     # 🧪 Prueba con 2 clientes simulados
```

### URLs Útiles

- **Juego:** http://localhost:8080
- **Monitor Colyseus:** http://localhost:2567/monitor
- **Playground:** http://localhost:2567

## 🐛 Debugging y Resolución de Problemas

### Problema: "No se puede conectar al servidor"

```javascript
// Revisar en Game.ts que la URL sea correcta
const BACKEND_URL = "ws://localhost:2567"; // ✅ Debe coincidir con puerto backend
```

### Problema: "Los jugadores no se mueven suavemente"

```typescript
// Ajustar velocidad de interpolación en Game.ts
entity.x = Phaser.Math.Linear(entity.x, serverX, 0.1); // 🐌 Más suave
entity.x = Phaser.Math.Linear(entity.x, serverX, 0.5); // 🏃‍♂️ Más rápido
```

### Problema: "FPS bajos"

```typescript
// En root.ts, ajustar configuración de rendimiento
const config = {
  // ... otras opciones ...
  render: {
    pixelArt: true, // ✅ Mejor rendimiento para pixel art
    antialias: false, // ✅ Desactivar antialiasing
    roundPixels: true, // ✅ Redondear píxeles
  },
};
```

## 🚀 Próximos Pasos para Aprender Más

### Nivel Básico

1. **Añadir más sprites:** Cambiar nave por otros personajes
2. **Animaciones:** Crear animaciones de caminar para jugadores
3. **Sonidos:** Agregar efectos de sonido y música
4. **UI:** Crear interfaz con botones y menús

### Nivel Intermedio

1. **Sistema de chat:** Comunicación entre jugadores
2. **Diferentes salas:** Múltiples niveles o mapas
3. **Física avanzada:** Colisiones con obstáculos
4. **Sistema de inventario:** Items y equipamiento

### Nivel Avanzado

1. **Base de datos:** Guardar progreso de jugadores
2. **Autenticación:** Sistema de login y usuarios
3. **Balanceador de carga:** Múltiples servidores
4. **Modo producción:** Despliegue en la nube

## 📚 Recursos para Seguir Aprendiendo

### Documentación Oficial

- 📖 [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- 📖 [Colyseus Docs](https://docs.colyseus.io/)

### Tutoriales Recomendados

- 🎥 [Phaser 3 Examples](https://phaser.io/examples) - Cientos de ejemplos
- 🎥 [Colyseus Examples](https://github.com/colyseus/colyseus-examples) - Proyectos de ejemplo

### Comunidades

- 💬 [Phaser Discord](https://discord.gg/phaser)
- 💬 [Colyseus Discord](https://discord.gg/RY8rRS7)
- 🐦 [Twitter - @photonstorm](https://twitter.com/photonstorm)

## 🤝 Contribuir al Proyecto

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b mi-nueva-funcionalidad`
3. Haz tus cambios y committea: `git commit -am 'Agregué nueva funcionalidad'`
4. Push: `git push origin mi-nueva-funcionalidad`
5. Crea un Pull Request

---

### 💡 Tips Finales para Principiantes

1. **Empieza pequeño:** Modifica valores como velocidad o colores antes de añadir funcionalidades
2. **Usa console.log():** Imprime valores para entender qué está pasando
3. **Experimenta:** Cambia números, colores y textos para ver qué sucede
4. **Lee errores:** Los mensajes de error te dicen exactamente qué está mal
5. **Pregunta:** Las comunidades de gamedev son muy colaborativas

¡Diviértete creando tu primer juego multijugador! 🎮✨
