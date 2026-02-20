export default class DamageText extends Phaser.GameObjects.Text {
    constructor(scene, x, y, damage) {
        super(scene, x, y, `-${damage}`, {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 3,
        });

        scene.add.existing(this);
        this.setOrigin(0.5);
        this.setDepth(100);

        scene.tweens.add({
            targets: this,
            y: y - 40,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
    }
}

