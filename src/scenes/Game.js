import ANIMATION from '../animation.js';
import Player from '../gameObjects/Player.js';
import Enemy from '../gameObjects/Enemy.js';
import XpGem from '../gameObjects/XpGem.js';
import DamageText from '../gameObjects/DamageText.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.initVariables();
        this.initAnimations();
        this.initMap();
        this.initPlayer();
        this.initGroups();
        this.initPhysics();
        this.initCamera();
        this.initHUD();
        this.initSpawner();
    }

    update(time, delta) {
        if (!this.isGameOver) {
            this.updateTimer(delta);
            this.updateHUD();
            this.updateDifficulty();
        }
    }

    initVariables() {
        this.isGameOver = false;
        this.isPaused = false;
        this.elapsedTime = 0;
        this.difficultyMultiplier = 1;
        this.spawnInterval = 3000;
        this.minSpawnInterval = 400;

        this.mapTileSize = 64;
        this.mapWidthTiles = 80;
        this.mapHeightTiles = 80;
        this.worldWidth = this.mapWidthTiles * this.mapTileSize;
        this.worldHeight = this.mapHeightTiles * this.mapTileSize;
    }

    initAnimations() {
        for (const key in ANIMATION) {
            const anim = ANIMATION[key];
            if (this.anims.exists(anim.key)) continue;
            this.anims.create({
                key: anim.key,
                frames: this.anims.generateFrameNumbers(anim.texture, anim.config),
                frameRate: anim.frameRate,
                repeat: anim.repeat !== undefined ? anim.repeat : 0,
            });
        }
    }

    initMap() {
        const grassTiles = [0, 0, 0, 0, 0, 1, 1, 1, 9, 9, 9, 10, 10, 18, 18, 27];

        const mapData = [];
        for (let y = 0; y < this.mapHeightTiles; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidthTiles; x++) {
                const tileIndex = Phaser.Math.RND.weightedPick(grassTiles);
                row.push(tileIndex);
            }
            mapData.push(row);
        }

        this.map = this.make.tilemap({
            data: mapData,
            tileWidth: this.mapTileSize,
            tileHeight: this.mapTileSize
        });
        const tileset = this.map.addTilesetImage('tilemap');
        this.groundLayer = this.map.createLayer(0, tileset, 0, 0);

        this.decorGroup = this.add.group();
        for (let i = 0; i < 120; i++) {
            const dx = Phaser.Math.RND.between(100, this.worldWidth - 100);
            const dy = Phaser.Math.RND.between(100, this.worldHeight - 100);
            const type = Phaser.Math.RND.pick(['rock', 'bush_sprite']);

            if (type === 'rock') {
                const rock = this.add.image(dx, dy, 'rock').setDepth(5).setAlpha(0.8);
                this.decorGroup.add(rock);
            } else {
                const bush = this.add.image(dx, dy, 'bush_sprite', 0).setDepth(5).setAlpha(0.7).setScale(0.8);
                this.decorGroup.add(bush);
            }
        }

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    }

    initPlayer() {
        const cx = this.worldWidth * 0.5;
        const cy = this.worldHeight * 0.5;
        this.player = new Player(this, cx, cy);
        this.player.setCollideWorldBounds(true);
    }

    initGroups() {
        this.enemyGroup = this.add.group();
        this.xpGemGroup = this.add.group();
        this.arrowGroup = this.physics.add.group();
    }

    initPhysics() {
        this.physics.add.overlap(this.player, this.enemyGroup, this.onEnemyHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.xpGemGroup, this.onCollectXpGem, null, this);
        this.physics.add.overlap(this.player, this.arrowGroup, this.onArrowHitPlayer, null, this);
    }

    initCamera() {
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    }

    initHUD() {
        const hudDepth = 200;

        this.hpBarBg = this.add.rectangle(20, 20, 204, 22, 0x111111)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(hudDepth)
            .setStrokeStyle(1, 0x555555);

        this.hpBarFill = this.add.rectangle(22, 22, 200, 18, 0xff3333)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(hudDepth + 1);

        this.hpText = this.add.text(122, 23, '100/100', {
            fontFamily: 'Arial', fontSize: 14, color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(hudDepth + 2);

        this.xpBarBg = this.add.rectangle(20, 48, 204, 14, 0x333355)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(hudDepth)
            .setStrokeStyle(1, 0x666699);

        this.xpBarFill = this.add.rectangle(22, 50, 0, 10, 0x6666ff)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(hudDepth + 1);

        this.levelText = this.add.text(20, 68, 'Lv. 1', {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffd700',
            stroke: '#000000', strokeThickness: 5,
        }).setScrollFactor(0).setDepth(hudDepth);

        this.killText = this.add.text(20, 102, 'Kills: 0', {
            fontFamily: 'Arial', fontSize: 16, color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
        }).setScrollFactor(0).setDepth(hudDepth);

        this.timerText = this.add.text(this.scale.width - 20, 20, '00:00', {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(hudDepth);

        this.waveText = this.add.text(this.scale.width - 20, 54, 'Difficulty: x1.0', {
            fontFamily: 'Arial', fontSize: 14, color: '#cccccc',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(hudDepth);
    }

    initSpawner() {
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer(delta) {
        this.elapsedTime += delta;
    }

    updateHUD() {
        const p = this.player;
        if (!p || !p.active) return;

        const hpRatio = Math.max(0, p.hp / p.maxHp);
        this.hpBarFill.width = 200 * hpRatio;
        this.hpText.setText(`${Math.ceil(p.hp)}/${p.maxHp}`);

        if (hpRatio > 0.5) this.hpBarFill.setFillStyle(0x44dd44);
        else if (hpRatio > 0.25) this.hpBarFill.setFillStyle(0xdddd44);
        else this.hpBarFill.setFillStyle(0xff3333);

        const xpRatio = p.getXpProgress();
        this.xpBarFill.width = 220 * xpRatio;

        this.levelText.setText(`Lv. ${p.level}`);
        this.killText.setText(`Kills: ${p.killCount}`);

        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        this.timerText.setText(`${minutes}:${seconds}`);

        this.waveText.setText(`Difficulty: x${this.difficultyMultiplier.toFixed(1)}`);
    }

    updateDifficulty() {
        const seconds = this.elapsedTime / 1000;
        this.difficultyMultiplier = 1 + Math.floor(seconds / 30) * 0.2;
        this.spawnInterval = Math.max(this.minSpawnInterval, 3000 - Math.floor(seconds / 20) * 200);

        if (this.spawnTimer && this.spawnTimer.delay !== this.spawnInterval) {
            this.spawnTimer.delay = this.spawnInterval;
        }
    }

    spawnWave() {
        if (this.isGameOver) return;

        const count = Phaser.Math.RND.between(3, 5) + Math.floor(this.difficultyMultiplier);
        for (let i = 0; i < count; i++) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        if (!this.player || !this.player.active) return;

        const cam = this.cameras.main;
        const margin = 100;
        const side = Phaser.Math.RND.between(0, 3);

        let x, y;
        switch (side) {
            case 0:
                x = Phaser.Math.RND.between(cam.scrollX - margin, cam.scrollX + cam.width + margin);
                y = cam.scrollY - margin;
                break;
            case 1:
                x = Phaser.Math.RND.between(cam.scrollX - margin, cam.scrollX + cam.width + margin);
                y = cam.scrollY + cam.height + margin;
                break;
            case 2:
                x = cam.scrollX - margin;
                y = Phaser.Math.RND.between(cam.scrollY - margin, cam.scrollY + cam.height + margin);
                break;
            case 3:
                x = cam.scrollX + cam.width + margin;
                y = Phaser.Math.RND.between(cam.scrollY - margin, cam.scrollY + cam.height + margin);
                break;
        }

        x = Phaser.Math.Clamp(x, 50, this.worldWidth - 50);
        y = Phaser.Math.Clamp(y, 50, this.worldHeight - 50);

        const diff = this.difficultyMultiplier;
        const playerLevel = this.player.level;

        const enemyTypes = [
            {
                enemyType: 'pawn',
                minLevel: 1,
                weight: 10,
                idleTexture: 'pawn_idle',
                idleAnim: 'pawn_idle',
                runAnim: 'pawn_run',
                behaviorType: 'melee',
                hp: 15 * diff,
                damage: 8,
                speed: 70 + diff * 5,
                xpValue: 5,
                scale: 0.9,
            },
            {
                enemyType: 'archer',
                minLevel: 3,
                weight: 6,
                idleTexture: 'archer_idle',
                idleAnim: 'archer_idle',
                runAnim: 'archer_run',
                behaviorType: 'ranged',
                hp: 12 * diff,
                damage: 5,
                speed: 55 + diff * 3,
                xpValue: 8,
                scale: 0.9,
                shootRange: 280,
                shootCooldown: 2500,
                projectileDamage: 10 + diff * 2,
                projectileSpeed: 280,
            },
            {
                enemyType: 'monk',
                minLevel: 5,
                weight: 4,
                idleTexture: 'monk_idle',
                idleAnim: 'monk_idle',
                runAnim: 'monk_run',
                behaviorType: 'healer',
                hp: 20 * diff,
                damage: 6,
                speed: 60 + diff * 3,
                xpValue: 12,
                scale: 0.9,
                healRange: 150,
                healAmount: 3 + diff * 1,
                healCooldown: 3000,
            },
            {
                enemyType: 'lancer',
                minLevel: 8,
                weight: 3,
                idleTexture: 'lancer_idle',
                idleAnim: 'lancer_idle',
                runAnim: 'lancer_run',
                attackAnim: 'lancer_attack',
                behaviorType: 'charger',
                hp: 40 * diff,
                damage: 18,
                speed: 85 + diff * 5,
                xpValue: 18,
                scale: 0.6,
                hitboxW: 50,
                hitboxH: 60,
                hitboxOX: 135,
                hitboxOY: 195,
                meleeAttackRange: 70,
                attackCooldownTime: 1500,
            },
        ];

        const eligible = enemyTypes.filter(e => playerLevel >= e.minLevel);

        const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
        let roll = Phaser.Math.RND.between(1, totalWeight);
        let chosen = eligible[0];
        for (const etype of eligible) {
            roll -= etype.weight;
            if (roll <= 0) {
                chosen = etype;
                break;
            }
        }

        const enemy = new Enemy(this, x, y, chosen);
        this.enemyGroup.add(enemy);
    }

    onEnemyHitPlayer(player, enemy) {
        if (!player.active || !enemy.active) return;
        player.takeDamage(enemy.getDamage());
    }

    onCollectXpGem(player, gem) {
        if (!player.active || !gem.active) return;
        gem.collect();
    }

    onArrowHitPlayer(player, arrow) {
        if (!player.active || !arrow.active) return;
        player.takeDamage(arrow.damage || 10);
        arrow.destroy();
    }

    spawnXpGem(x, y, xpValue) {
        const gem = new XpGem(this, x, y, xpValue);
        this.xpGemGroup.add(gem);
    }

    showDamageText(x, y, damage) {
        new DamageText(this, x, y, damage);
    }

    triggerExplosionOnKill(x, y) {
        if (this._isExploding) return;
        this._isExploding = true;

        const level = this.player.powerUps.explosionOnKill;
        const explosionRange = 80 + level * 20;
        const explosionDamage = 5 + level * 3;

        const explKey = Phaser.Math.RND.pick(['explosion_01', 'explosion_02']);
        const explScale = 0.8 + level * 0.15;
        const expl = this.add.sprite(x, y, explKey, 0).setDepth(55).setScale(explScale);
        expl.play(explKey);
        expl.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => expl.destroy());

        const enemies = this.enemyGroup.getChildren().slice();
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist <= explosionRange) {
                enemy.hit(explosionDamage, this.player);
            }
        }

        this._isExploding = false;
    }

    showLevelUpScreen() {
        this.physics.pause();
        this.scene.pause();
        this.scene.launch('LevelUp', { gameScene: this });
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        if (this.spawnTimer) this.spawnTimer.remove();

        this.cameras.main.shake(500, 0.02);

        this.time.delayedCall(1500, () => {
            this.scene.start('GameOver', {
                kills: this.player ? this.player.killCount : 0,
                level: this.player ? this.player.level : 1,
                time: this.elapsedTime,
            });
        });
    }
}
