export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'warrior_idle', 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.setDepth(50);
        this.setScale(1);

        this.body.setSize(40, 50);
        this.body.setOffset(76, 110);

        this.hp = 100;
        this.maxHp = 100;
        this.speed = 200;
        this.attackDamage = 10;
        this.attackSpeed = 1000;
        this.attackRange = 120;
        this.hpRegen = 0;
        this.xp = 0;
        this.level = 1;
        this.killCount = 0;

        this.powerUps = {
            attackSpeed: 0,
            attackDamage: 0,
            moveSpeed: 0,
            maxHp: 0,
            hpRegen: 0,
            fireAura: 0,
            explosionOnKill: 0,
            attackRange: 0,
            magnet: 0,
        };

        this.attackCooldown = 0;
        this.isAttacking = false;
        this.facingRight = true;
        this.invincible = false;
        this.invincibilityTime = 500;
        this.regenTimer = 0;
        this.attackAnim = 1;

        this.fireAuraSprites = [];
        this.fireAuraAngle = 0;
        this.fireAuraDamageTimer = 0;

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.handleMovement();
        this.handleAttack(delta);
        this.handleRegen(delta);
        this.handleFireAura(delta);
    }

    handleMovement() {
        if (this.isAttacking) return;

        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;

        let vx = 0;
        let vy = 0;

        if (left) vx -= 1;
        if (right) vx += 1;
        if (up) vy -= 1;
        if (down) vy += 1;

        if (vx !== 0 && vy !== 0) {
            const norm = Math.SQRT1_2;
            vx *= norm;
            vy *= norm;
        }

        this.setVelocity(vx * this.speed, vy * this.speed);

        if (vx < 0) {
            this.setFlipX(true);
            this.facingRight = false;
        } else if (vx > 0) {
            this.setFlipX(false);
            this.facingRight = true;
        }

        if (vx !== 0 || vy !== 0) {
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== 'warrior_run') {
                this.play('warrior_run', true);
            }
        } else {
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== 'warrior_idle') {
                this.play('warrior_idle', true);
            }
        }
    }

    handleAttack(delta) {
        this.attackCooldown -= delta;

        if (this.attackCooldown <= 0) {
            const enemies = this.scene.enemyGroup.getChildren();
            let nearest = null;
            let nearestDist = this.attackRange;

            for (const enemy of enemies) {
                if (!enemy.active) continue;
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }

            if (nearest) {
                this.doAttack(nearest);
            }
        }
    }

    doAttack(target) {
        this.attackCooldown = this.attackSpeed;
        this.isAttacking = true;

        if (target.x < this.x) {
            this.setFlipX(true);
            this.facingRight = false;
        } else {
            this.setFlipX(false);
            this.facingRight = true;
        }

        this.setVelocity(0, 0);

        const animKey = this.attackAnim === 1 ? 'warrior_attack1' : 'warrior_attack2';
        this.attackAnim = this.attackAnim === 1 ? 2 : 1;

        this.play(animKey, true);

        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.isAttacking = false;
            const enemies = this.scene.enemyGroup.getChildren().slice();
            for (const enemy of enemies) {
                if (!enemy.active || !enemy.scene) continue;
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= this.attackRange) {
                    enemy.hit(this.attackDamage, this);
                }
            }
        });
    }

    handleRegen(delta) {
        if (this.hpRegen <= 0) return;

        this.regenTimer += delta;
        if (this.regenTimer >= 1000) {
            this.regenTimer -= 1000;
            this.hp = Math.min(this.hp + this.hpRegen, this.maxHp);
        }
    }

    handleFireAura(delta) {
        if (this.powerUps.fireAura <= 0) return;

        const count = 4 + this.powerUps.fireAura * 2;
        const radius = 50 + this.powerUps.fireAura * 15;

        while (this.fireAuraSprites.length < count) {
            const idx = this.fireAuraSprites.length;
            const fireKey = Phaser.Math.RND.pick(['fire_01', 'fire_02', 'fire_03']);
            const s = this.scene.add.sprite(this.x, this.y, fireKey, 0);
            s.setScale(0.7);
            s.setAlpha(0.7);
            s.setDepth(45);
            s.play(fireKey);
            this.fireAuraSprites.push(s);
        }

        while (this.fireAuraSprites.length > count) {
            const removed = this.fireAuraSprites.pop();
            if (removed && removed.active) removed.destroy();
        }

        this.fireAuraAngle += delta * 0.002;
        const step = (Math.PI * 2) / this.fireAuraSprites.length;
        for (let i = 0; i < this.fireAuraSprites.length; i++) {
            const s = this.fireAuraSprites[i];
            if (!s || !s.active) continue;
            const a = this.fireAuraAngle + step * i;
            s.setPosition(
                this.x + Math.cos(a) * radius,
                this.y + Math.sin(a) * radius
            );
        }

        this.fireAuraDamageTimer += delta;
        const auraDamageInterval = 500;
        if (this.fireAuraDamageTimer >= auraDamageInterval) {
            this.fireAuraDamageTimer -= auraDamageInterval;
            const auraRange = radius + 30;
            const auraDamage = 3 + this.powerUps.fireAura * 2;
            const enemies = this.scene.enemyGroup.getChildren().slice();
            for (const enemy of enemies) {
                if (!enemy.active || !enemy.scene) continue;
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= auraRange) {
                    enemy.hit(auraDamage, this);
                }
            }
        }
    }

    addXp(amount) {
        this.xp += amount;

        while (this.xp >= this.getXpForNextLevel()) {
            this.xp -= this.getXpForNextLevel();
            this.level++;
            this.scene.showLevelUpScreen();
        }
    }

    getXpForNextLevel() {
        return 20 + (this.level - 1) * 15;
    }

    getXpProgress() {
        return this.xp / this.getXpForNextLevel();
    }

    takeDamage(amount) {
        if (this.invincible) return;

        this.hp -= amount;
        this.invincible = true;

        this.setTint(0xff0000);
        this.scene.time.delayedCall(this.invincibilityTime, () => {
            this.invincible = false;
            this.clearTint();
        });

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        const dust = this.scene.add.sprite(this.x, this.y, 'dust_01', 0).setDepth(60);
        dust.play('dust_01');
        dust.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => dust.destroy());

        this.scene.gameOver();
    }

    applyPowerUp(type) {
        this.powerUps[type]++;

        switch (type) {
            case 'attackSpeed':
                this.attackSpeed = Math.max(200, this.attackSpeed - 100);
                break;
            case 'attackDamage':
                this.attackDamage += 5;
                break;
            case 'moveSpeed':
                this.speed += 30;
                break;
            case 'maxHp':
                this.maxHp += 20;
                this.hp = Math.min(this.hp + 20, this.maxHp);
                break;
            case 'hpRegen':
                this.hpRegen += 2;
                break;
            case 'fireAura':
                break;
            case 'explosionOnKill':
                break;
            case 'attackRange':
                this.attackRange += 25;
                break;
            case 'magnet':
                break;
        }
    }

    destroy(fromScene) {
        for (const s of this.fireAuraSprites) {
            if (s && s.active) s.destroy();
        }
        this.fireAuraSprites = [];
        super.destroy(fromScene);
    }
}