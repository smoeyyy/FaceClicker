class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('purple_body', 'assets/purple_body_circle.png');
        this.load.image('smile_face', 'assets/face_smile_open_eye.png');
        this.load.image('frown_face', 'assets/face_frown_open_eye.png');
    }

    create() {
        this.score = 0;
        this.currentRound = 0;
        this.totalRounds = 5;
        this.roundDuration = 20000;
        this.facesPerRound = 10;
        this.spawnInterval = this.roundDuration / this.facesPerRound;
        this.baseTravelDuration = 4000;
        this.activeFaces = [];
        this.hudScore = null;
        this.hudRound = null;
        this.hudTimer = null;
        this.roundStartTime = null;

        this.showInstructions();
    }

    showInstructions() {
        const bg = this.add.rectangle(400, 300, 560, 380, 0xffffff, 0.95).setStrokeStyle(2, 0x333333);
        const title = this.add.text(400, 150, 'FaceClicker', { fontSize: '48px', color: '#000' }).setOrigin(0.5);
        const line1 = this.add.text(400, 265, 'Click smiley faces', { fontSize: '22px', color: '#000' }).setOrigin(0.5);
        const line2 = this.add.text(400, 310, 'Avoid frowning faces', { fontSize: '22px', color: '#000' }).setOrigin(0.5);
        const clickText = this.add.text(400, 400, 'Click to Start', { fontSize: '24px', color: '#666666' }).setOrigin(0.5);

        const elements = [bg, title, line1, line2, clickText];
        this.input.once('pointerdown', () => {
            elements.forEach(e => e.destroy());
            this.showPauseScreen();
        });
    }

    showPauseScreen() {
        this.currentRound++;

        if (this.currentRound > this.totalRounds) {
            this.showGameOver();
            return;
        }

        const bg = this.add.rectangle(400, 300, 500, 300, 0xffffff, 0.95).setStrokeStyle(2, 0x333333);
        const title = this.add.text(400, 210, `Round ${this.currentRound}`, { fontSize: '48px', color: '#000' }).setOrigin(0.5);
        const scoreText = this.add.text(400, 290, `Score: ${this.score}`, { fontSize: '32px', color: '#000' }).setOrigin(0.5);
        const clickText = this.add.text(400, 370, 'Click to Start', { fontSize: '24px', color: '#666666' }).setOrigin(0.5);

        this.pauseElements = [bg, title, scoreText, clickText];
        this.input.once('pointerdown', this.startRound, this);
    }

    startRound() {
        this.pauseElements.forEach(e => e.destroy());
        this.pauseElements = [];
        this.activeFaces = [];

        this.travelDuration = this.baseTravelDuration - (this.currentRound - 1) * 500;

        this.hudScore = this.add.text(16, 16, `Score: ${this.score}`, { fontSize: '24px', color: '#000' });
        this.hudRound = this.add.text(784, 16, `Round: ${this.currentRound}/${this.totalRounds}`, { fontSize: '24px', color: '#000' }).setOrigin(1, 0);
        this.hudTimer = this.add.text(400, 16, '20', { fontSize: '24px', color: '#000' }).setOrigin(0.5, 0);

        this.roundStartTime = this.time.now;

        this.facesSpawned = 0;
        this.spawnFace();

        this.spawnEvent = this.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnFace,
            callbackScope: this,
            loop: true
        });

        this.roundTimer = this.time.addEvent({
            delay: this.roundDuration,
            callback: this.endRound,
            callbackScope: this
        });
    }

    spawnFace() {
        const isSmile = Math.random() < 0.5;
        const y = Phaser.Math.Between(80, 520);

        const container = this.add.container(-80, y);
        const body = this.add.image(0, 0, 'purple_body');
        const face = this.add.image(0, 0, isSmile ? 'smile_face' : 'frown_face');
        container.add([body, face]);
        container.setSize(body.width, body.height);
        container.setInteractive();

        const faceData = { container, isSmile, resolved: false };
        this.activeFaces.push(faceData);

        container.on('pointerdown', () => {
            if (faceData.resolved) return;
            faceData.resolved = true;

            this.score += isSmile ? 1 : -1;
            this.updateHUD();

            this.tweens.killTweensOf(container);
            container.destroy();
        });

        this.tweens.add({
            targets: container,
            x: 880,
            duration: this.travelDuration,
            onComplete: () => {
                if (faceData.resolved) return;
                faceData.resolved = true;

                if (!faceData.isSmile) {
                    this.score++;
                    this.updateHUD();
                }
                container.destroy();
            }
        });

        this.facesSpawned++;
        if (this.facesSpawned >= this.facesPerRound) {
            this.spawnEvent.remove();
        }
    }

    update() {
        if (this.roundStartTime) {
            const elapsed = this.time.now - this.roundStartTime;
            const remaining = Math.max(0, Math.ceil((this.roundDuration - elapsed) / 1000));
            this.hudTimer.setText(String(remaining));
        }
    }

    updateHUD() {
        if (this.hudScore) {
            this.hudScore.setText(`Score: ${this.score}`);
        }
    }

    endRound() {
        if (this.spawnEvent) this.spawnEvent.remove();
        if (this.roundTimer) this.roundTimer.remove();

        this.activeFaces.forEach(faceData => {
            if (!faceData.resolved) {
                faceData.resolved = true;
                if (!faceData.isSmile) {
                    this.score++;
                }
                this.tweens.killTweensOf(faceData.container);
                faceData.container.destroy();
            }
        });
        this.activeFaces = [];

        if (this.hudScore) this.hudScore.destroy();
        if (this.hudRound) this.hudRound.destroy();
        if (this.hudTimer) this.hudTimer.destroy();
        this.hudScore = null;
        this.hudRound = null;
        this.hudTimer = null;
        this.roundStartTime = null;

        this.showPauseScreen();
    }

    showGameOver() {
        const bg = this.add.rectangle(400, 300, 500, 280, 0xffffff, 0.95).setStrokeStyle(2, 0x333333);
        const title = this.add.text(400, 230, 'Game Over!', { fontSize: '56px', color: '#000' }).setOrigin(0.5);
        const scoreText = this.add.text(400, 310, `Final Score: ${this.score}`, { fontSize: '36px', color: '#000' }).setOrigin(0.5);
        const restartText = this.add.text(400, 390, 'Click to Play Again', { fontSize: '24px', color: '#666666' }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            bg.destroy();
            title.destroy();
            scoreText.destroy();
            restartText.destroy();
            this.score = 0;
            this.currentRound = 0;
            this.showInstructions();
        });
    }
}
