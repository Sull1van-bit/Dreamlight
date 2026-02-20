export default class XpGem extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, xpValue) {
        super(scene, x, y, 'gold');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.xpValue = xpValue || 5;
        this.setDepth(10);
        this.setScale(0.5);

        this.body.setSize(80, 80);
        this.body.setOffset(24, 24);

        this.baseMagnetRange = 80;
        this.magnetSpeed = 300;
        this.isBeingPulled = false;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.scene || !this.scene.player || !this.scene.player.active) return;

        const player = this.scene.player;
        const magnetBonus = (player.powerUps.magnet || 0) * 40;
        const magnetRange = this.baseMagnetRange + magnetBonus;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (dist < magnetRange) {
            this.isBeingPulled = true;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            const pullSpeed = this.magnetSpeed * (1 - dist / magnetRange) + 100;
            this.setVelocity(
                Math.cos(angle) * pullSpeed,
                Math.sin(angle) * pullSpeed
            );
        } else if (this.isBeingPulled) {
            this.isBeingPulled = false;
            this.setVelocity(0, 0);
        }
    }

    collect() {
        if (this.scene && this.scene.player && this.scene.player.active) {
            this.scene.player.addXp(this.xpValue);
        }
        this.scene.xpGemGroup.remove(this, true, true);
    }
}

