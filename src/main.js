import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { LevelUp } from './scenes/LevelUp.js';

const config = {
    type: Phaser.AUTO,
    title: 'Dreamlight',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [
        Boot,
        Preloader,
        Game,
        LevelUp,
        GameOver
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
