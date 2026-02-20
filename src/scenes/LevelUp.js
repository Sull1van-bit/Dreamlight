export class LevelUp extends Phaser.Scene {
    constructor() {
        super('LevelUp');
    }

    init(data) {
        this.gameScene = data.gameScene;
    }

    create() {
        this.allPowerUps = [
            { key: 'attackSpeed', name: 'Swift Strike' },
            { key: 'attackDamage', name: 'Sharp Blade' },
            { key: 'moveSpeed', name: 'Wind Walk' },
            { key: 'maxHp', name: 'Iron Body' },
            { key: 'hpRegen', name: 'Regeneration' },
            { key: 'fireAura', name: 'Fire Aura' },
            { key: 'explosionOnKill', name: 'Chain Blast' },
            { key: 'attackRange', name: 'Long Reach' },
            { key: 'magnet', name: 'XP Magnet' },
        ];

        const shuffled = Phaser.Utils.Array.Shuffle([...this.allPowerUps]);
        const choices = shuffled.slice(0, 3);

        this.createOverlay(choices);
    }

    createOverlay(choices) {
        const gameCanvas = this.game.canvas;
        const parent = gameCanvas.parentElement;
        parent.style.position = 'relative';

        const overlay = document.createElement('div');
        overlay.id = 'levelup-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 20;
            font-family: Arial, sans-serif;
        `;

        const title = document.createElement('div');
        title.textContent = 'LEVEL UP!';
        title.style.cssText = 'font-size: 36px; color: #ffd700; font-weight: bold; margin-bottom: 6px;';
        overlay.appendChild(title);

        const subtitle = document.createElement('div');
        subtitle.textContent = 'Choose a Power-Up';
        subtitle.style.cssText = 'font-size: 16px; color: #ccc; margin-bottom: 20px;';
        overlay.appendChild(subtitle);

        const player = this.gameScene.player;

        choices.forEach((powerUp, i) => {
            const currentLevel = player.powerUps[powerUp.key] || 0;
            const nextLevel = currentLevel + 1;
            const desc = this.getDescription(powerUp.key, currentLevel, nextLevel, player);

            const btn = document.createElement('div');
            btn.style.cssText = `
                width: 400px;
                padding: 12px 20px;
                margin-bottom: 8px;
                background: #222;
                border: 1px solid #555;
                color: #fff;
                font-size: 15px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            btn.innerHTML = `
                <span><b>[${i + 1}] ${powerUp.name}</b> - ${desc}</span>
                <span style="color:#aaa; font-size:13px;">Lv ${currentLevel} > ${nextLevel}</span>
            `;
            btn.onmouseenter = () => { btn.style.background = '#444'; btn.style.borderColor = '#fff'; };
            btn.onmouseleave = () => { btn.style.background = '#222'; btn.style.borderColor = '#555'; };
            btn.onclick = () => this.selectPowerUp(powerUp, overlay);

            overlay.appendChild(btn);
        });

        parent.appendChild(overlay);
        this._overlay = overlay;
        this.events.on('shutdown', () => this.removeDOMElements());
    }

    selectPowerUp(powerUp, overlay) {
        this.gameScene.player.applyPowerUp(powerUp.key);

        if (overlay && overlay.parentElement) overlay.remove();
        this._overlay = null;

        this.gameScene.scene.resume();
        this.gameScene.physics.resume();
        this.scene.stop();
    }

    removeDOMElements() {
        if (this._overlay && this._overlay.parentElement) {
            this._overlay.remove();
            this._overlay = null;
        }
    }

    getDescription(key, curLv, nextLv, player) {
        switch (key) {
            case 'attackSpeed': {
                const curSpd = Math.max(200, 1000 - curLv * 100);
                const nxtSpd = Math.max(200, 1000 - nextLv * 100);
                return `Attack interval ${curSpd}ms > ${nxtSpd}ms`;
            }
            case 'attackDamage': {
                const curDmg = 10 + curLv * 5;
                const nxtDmg = 10 + nextLv * 5;
                return `Damage ${curDmg} > ${nxtDmg}`;
            }
            case 'moveSpeed': {
                const curMs = 200 + curLv * 30;
                const nxtMs = 200 + nextLv * 30;
                return `Speed ${curMs} > ${nxtMs}`;
            }
            case 'maxHp': {
                const curHp = 100 + curLv * 20;
                const nxtHp = 100 + nextLv * 20;
                return `Max HP ${curHp} > ${nxtHp}`;
            }
            case 'hpRegen': {
                const curReg = curLv * 2;
                const nxtReg = nextLv * 2;
                return `Regen ${curReg} > ${nxtReg} HP/sec`;
            }
            case 'fireAura': {
                const curCount = 4 + curLv * 2;
                const nxtCount = 4 + nextLv * 2;
                const curRad = 50 + curLv * 15;
                const nxtRad = 50 + nextLv * 15;
                const curDmg = 3 + curLv * 2;
                const nxtDmg = 3 + nextLv * 2;
                if (curLv === 0) return `${nxtCount} flames, radius ${nxtRad}, ${nxtDmg} dmg/tick`;
                return `Flames ${curCount}>${nxtCount}, radius ${curRad}>${nxtRad}, dmg ${curDmg}>${nxtDmg}`;
            }
            case 'explosionOnKill': {
                const curRng = 80 + curLv * 20;
                const nxtRng = 80 + nextLv * 20;
                const curDmg = 5 + curLv * 3;
                const nxtDmg = 5 + nextLv * 3;
                if (curLv === 0) return `Explode on kill: range ${nxtRng}, ${nxtDmg} dmg`;
                return `Range ${curRng}>${nxtRng}, dmg ${curDmg}>${nxtDmg}`;
            }
            case 'attackRange': {
                const curR = 120 + curLv * 25;
                const nxtR = 120 + nextLv * 25;
                return `Attack range ${curR} > ${nxtR}`;
            }
            case 'magnet': {
                const curMag = 80 + curLv * 40;
                const nxtMag = 80 + nextLv * 40;
                return `XP pickup radius ${curMag} > ${nxtMag}`;
            }
            default:
                return '';
        }
    }
}
