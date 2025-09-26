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
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    // this.scene.start('MainMenu');
    this.scene.start("Game");
  }
}
