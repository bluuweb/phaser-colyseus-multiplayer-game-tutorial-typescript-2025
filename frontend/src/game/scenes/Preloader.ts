import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(400, 300, "background");

    //  A simple progress bar. This is the outline of the bar.
    const progressBarBg = this.add
      .rectangle(400, 300, 468, 32)
      .setStrokeStyle(2, 0xffffff)
      .setFillStyle(0x222222);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(400 - 232, 300, 4, 28, 0x00ff00);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      const barWidth = 4 + 460 * progress;
      bar.width = barWidth;
      // Reposicionar la barra para que crezca desde la izquierda pero mantenga el centrado visual
      bar.x = 400 - 232 + barWidth / 2 - 2;
    });

    // Agregar texto de carga
    const loadingText = this.add
      .text(400, 350, "Cargando...", {
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5);

    // Agregar porcentaje
    const percentText = this.add
      .text(400, 250, "0%", {
        fontSize: "18px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5);

    this.load.on("progress", (progress: number) => {
      percentText.setText(Math.round(progress * 100) + "%");
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");

    this.load.image("logo", "logo.png");

    // Cargar todas las naves disponibles
    for (let i = 1; i <= 23; i++) {
      const shipNumber = i.toString().padStart(4, "0");
      this.load.image(`ship_${shipNumber}`, `ship_${shipNumber}.png`);
    }
  }

  create() {
    // Crear gráfico de estrella usando Phaser Graphics
    this.createStarGraphic();

    // Crear gráfico de bomba usando Phaser Graphics
    this.createBombGraphic();

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    // this.scene.start('MainMenu');
    this.scene.start("Game");
  }

  private createStarGraphic() {
    // Crear una estrella de 5 puntas usando Graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffd700); // Color dorado
    graphics.lineStyle(2, 0xffa500); // Borde naranja

    const starPoints = [];
    const centerX = 15;
    const centerY = 15;
    const outerRadius = 12;
    const innerRadius = 6;

    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      starPoints.push(x, y);
    }

    graphics.beginPath();
    graphics.moveTo(starPoints[0], starPoints[1]);
    for (let i = 2; i < starPoints.length; i += 2) {
      graphics.lineTo(starPoints[i], starPoints[i + 1]);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    // Convertir el gráfico a textura
    graphics.generateTexture("star", 30, 30);
    graphics.destroy();
  }

  private createBombGraphic() {
    // Crear una bomba usando Graphics
    const graphics = this.add.graphics();

    // Cuerpo principal de la bomba (círculo negro)
    graphics.fillStyle(0x1a1a1a); // Negro oscuro
    graphics.lineStyle(3, 0x333333); // Borde gris oscuro
    graphics.fillCircle(16, 20, 12);
    graphics.strokeCircle(16, 20, 12);

    // Fusible (línea en la parte superior)
    graphics.lineStyle(2, 0x8b4513); // Marrón
    graphics.lineBetween(16, 8, 10, 2);

    // Chispa del fusible (pequeño círculo amarillo)
    graphics.fillStyle(0xffff00); // Amarillo brillante
    graphics.fillCircle(10, 2, 2);

    // Reflejo en la bomba (pequeño círculo blanco)
    graphics.fillStyle(0xffffff, 0.3); // Blanco semitransparente
    graphics.fillCircle(13, 17, 3);

    // Convertir el gráfico a textura
    graphics.generateTexture("bomb", 32, 32);
    graphics.destroy();
  }
}
