export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config) {
        const idleTexture = config.idleTexture || 'pawn_idle';
        super(scene, x, y, idleTexture, 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.setDepth(20);

        this.enemyType = config.enemyType || 'pawn';
        this.behaviorType = config.behaviorType || 'melee';
        this.idleAnim = config.idleAnim || 'pawn_idle';
        this.runAnim = config.runAnim || 'pawn_run';
        this.attackAnim = config.attackAnim || null;

        this.hp = config.hp || 20;
        this.maxHp = this.hp;
        this.damage = config.damage || 10;
        this.moveSpeed = config.speed || 80;
        this.xpValue = config.xpValue || 5;

        const scale = config.scale || 1;
        this.setScale(scale);

        const hitboxW = config.hitboxW || 40;
        const hitboxH = config.hitboxH || 50;
        const hitboxOX = config.hitboxOX || 76;
        const hitboxOY = config.hitboxOY || 110;
        this.body.setSize(hitboxW, hitboxH);
        this.body.setOffset(hitboxOX, hitboxOY);

        this.damageFlashTimer = 0;
        this.isMoving = false;

        this.shootRange = config.shootRange || 250;
        this.shootCooldown = config.shootCooldown || 2000;
        this.shootTimer = 0;
        this.isShooting = false;
        this.projectileDamage = config.projectileDamage || 8;
        this.projectileSpeed = config.projectileSpeed || 300;

        this.healRange = config.healRange || 150;
        this.healAmount = config.healAmount || 5;
        this.healCooldown = config.healCooldown || 3000;
        this.healTimer = 0;

        this.attackCooldownTime = config.attackCooldownTime || 1500;
        this.attackTimer = 0;
        this.isAttacking = false;
        this.meleeAttackRange = config.meleeAttackRange || 60;

        if (this.scene.anims.exists(this.idleAnim)) {
            this.play(this.idleAnim);
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.scene || !this.scene.player || !this.scene.player.active) return;

        const player = this.scene.player;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= delta;
            if (this.damageFlashTimer <= 0) {
                this.clearTint();
            }
        }

        if (this.isShooting || this.isAttacking) return;

        switch (this.behaviorType) {
            case 'ranged':
                this.handleRangedBehavior(delta, dist, angle, player);
                break;
            case 'healer':
                this.handleHealerBehavior(delta, dist, angle, player);
                break;
            case 'charger':
                this.handleChargerBehavior(delta, dist, angle, player);
                break;
            default:
                this.handleMeleeBehavior(dist, angle);
                break;
        }

        this.setFlipX(this.body.velocity.x < 0);
    }

    handleMeleeBehavior(dist, angle) {
        this.setVelocity(
            Math.cos(angle) * this.moveSpeed,
            Math.sin(angle) * this.moveSpeed
        );
        this.playRunAnim();
    }


    handleRangedBehavior(delta, dist, angle, player) {
        this.shootTimer += delta;

        if (dist <= this.shootRange && this.shootTimer >= this.shootCooldown) {
            this.setVelocity(0, 0);
            this.shootTimer = 0;
            this.isShooting = true;

            if (this.scene.anims.exists('archer_shoot')) {
                this.play('archer_shoot', true);
                this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    this.spawnArrow(player);
                    this.isShooting = false;
                });
            } else {
                this.spawnArrow(player);
                this.isShooting = false;
            }
        } else if (dist > this.shootRange * 0.7) {
            this.setVelocity(
                Math.cos(angle) * this.moveSpeed,
                Math.sin(angle) * this.moveSpeed
            );
            this.playRunAnim();
        } else {
            this.setVelocity(0, 0);
            this.playIdleAnim();
        }
    }

    spawnArrow(player) {
        if (!this.scene || !player || !player.active) return;

        const arrow = this.scene.physics.add.sprite(this.x, this.y, 'arrow', 0);
        arrow.setDepth(25);
        arrow.setScale(0.6);
        arrow.damage = this.projectileDamage;

        if (this.scene.arrowGroup) {
            this.scene.arrowGroup.add(arrow);
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        arrow.setRotation(angle);
        arrow.body.setVelocity(
            Math.cos(angle) * this.projectileSpeed,
            Math.sin(angle) * this.projectileSpeed
        );
        arrow.body.setAllowGravity(false);

        if (this.scene.anims.exists('arrow')) {
            arrow.play('arrow');
        }

        this.scene.time.delayedCall(3000, () => {
            if (arrow && arrow.active) arrow.destroy();
        });
    }


    handleHealerBehavior(delta, dist, angle, player) {
        this.healTimer += delta;

        this.setVelocity(
            Math.cos(angle) * this.moveSpeed,
            Math.sin(angle) * this.moveSpeed
        );
        this.playRunAnim();

        if (this.healTimer >= this.healCooldown) {
            this.healTimer = 0;
            this.healNearbyEnemies();
        }
    }

    healNearbyEnemies() {
        if (!this.scene) return;

        const enemies = this.scene.enemyGroup.getChildren();

        for (const enemy of enemies) {
            if (!enemy.active || enemy === this) continue;
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist <= this.healRange && enemy.hp < enemy.maxHp) {
                enemy.hp = Math.min(enemy.hp + this.healAmount, enemy.maxHp);

                enemy.setTint(0x00ff00);
                this.scene.time.delayedCall(200, () => {
                    if (enemy && enemy.active) enemy.clearTint();
                });

                if (this.scene.anims.exists('heal_effect')) {
                    const fx = this.scene.add.sprite(enemy.x, enemy.y, 'heal_effect', 0)
                        .setDepth(30).setScale(0.6).setAlpha(0.8);
                    fx.play('heal_effect');
                    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
                }
            }
        }

        if (this.hp < this.maxHp) {
            this.hp = Math.min(this.hp + this.healAmount, this.maxHp);
        }
    }


    handleChargerBehavior(delta, dist, angle, player) {
        this.attackTimer += delta;

        this.setVelocity(
            Math.cos(angle) * this.moveSpeed,
            Math.sin(angle) * this.moveSpeed
        );
        this.playRunAnim();

        if (dist <= this.meleeAttackRange && this.attackTimer >= this.attackCooldownTime && this.attackAnim) {
            this.attackTimer = 0;
            this.isAttacking = true;
            this.setVelocity(0, 0);

            if (this.scene.anims.exists(this.attackAnim)) {
                this.play(this.attackAnim, true);
                this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    this.isAttacking = false;
                });
            } else {
                this.isAttacking = false;
            }
        }
    }


    playRunAnim() {
        if (this.runAnim && this.scene.anims.exists(this.runAnim)) {
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== this.runAnim) {
                this.play(this.runAnim, true);
            }
        }
    }

    playIdleAnim() {
        if (this.idleAnim && this.scene.anims.exists(this.idleAnim)) {
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== this.idleAnim) {
                this.play(this.idleAnim, true);
            }
        }
    }


    hit(damage, source) {
        if (!this.active || !this.scene || this._isDead) return;
        this.hp -= damage;

        this.setTint(0xffffff);
        this.damageFlashTimer = 100;

        this.scene.showDamageText(this.x, this.y - 30, damage);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this._isDead) return;
        this._isDead = true;

        const scene = this.scene;
        if (!scene) return;

        scene.spawnXpGem(this.x, this.y, this.xpValue);

        if (scene.player && scene.player.active) {
            scene.player.killCount++;
        }

        if (scene.player && scene.player.powerUps.explosionOnKill > 0) {
            scene.triggerExplosionOnKill(this.x, this.y);
        }

        const dust = scene.add.sprite(this.x, this.y, 'dust_02', 0).setDepth(25);
        if (scene.anims.exists('dust_02')) {
            dust.play('dust_02');
            dust.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => dust.destroy());
        } else {
            dust.destroy();
        }

        scene.enemyGroup.remove(this, true, true);
    }

    getDamage() {
        return this.damage;
    }
}

