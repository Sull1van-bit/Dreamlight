export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.finalKills = data.kills || 0;
        this.finalLevel = data.level || 1;
        this.finalTime = data.time || 0;
    }

    create() {
        const cx = this.scale.width * 0.5;
        const cy = this.scale.height * 0.5;

        this.cameras.main.setBackgroundColor('#1a0a0a');

        this.add.text(cx, 120, 'GAME OVER', {
            fontFamily: 'Arial Black', fontSize: 72, color: '#ff3333',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        const totalSeconds = Math.floor(this.finalTime / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');

        const stats = [
            `Time Survived: ${minutes}:${seconds}`,
            `Enemies Killed: ${this.finalKills}`,
            `Level Reached: ${this.finalLevel}`,
        ];

        stats.forEach((text, i) => {
            this.add.text(cx, 240 + i * 50, text, {
                fontFamily: 'Arial', fontSize: 28, color: '#ffffff',
                stroke: '#000000', strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
        });

        this.createCSSButton('RESTART', cx, cy + 180, '#cc3333', '#aa2222', () => {
            this.scene.start('Game');
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.removeDOMElements();
            this.scene.start('Game');
        });
    }

    createCSSButton(label, x, y, bgColor, hoverColor, onClick) {
        const gameCanvas = this.game.canvas;
        const parent = gameCanvas.parentElement;

        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            position: absolute;
            left: 50%;
            font-family: 'Arial Black', sans-serif;
            font-size: 24px;
            color: #fff;
            background: ${bgColor};
            border: 3px solid #ff8888;
            border-radius: 8px;
            padding: 12px 44px;
            cursor: pointer;
            z-index: 10;
            text-shadow: 2px 2px 4px #000;
            letter-spacing: 2px;
            transition: background 0.15s, border-color 0.15s;
            transform: translate(-50%, -50%);
        `;
        btn.onmouseenter = () => { btn.style.background = hoverColor; btn.style.borderColor = '#ffaaaa'; };
        btn.onmouseleave = () => { btn.style.background = bgColor; btn.style.borderColor = '#ff8888'; };
        btn.onclick = () => {
            btn.remove();
            onClick();
        };

        parent.style.position = 'relative';
        parent.appendChild(btn);

        this.positionDOMElement(btn, x, y);
        this.scale.on('resize', () => this.positionDOMElement(btn, x, y));

        if (!this._domElements) this._domElements = [];
        this._domElements.push(btn);
        this.events.on('shutdown', () => this.removeDOMElements());
    }

    removeDOMElements() {
        if (this._domElements) {
            this._domElements.forEach(el => { if (el.parentElement) el.remove(); });
            this._domElements = [];
        }
    }

    positionDOMElement(el, gameX, gameY) {
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleY = rect.height / this.scale.height;
        el.style.top = `${gameY * scaleY}px`;
    }
}
