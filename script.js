class OmokGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.currentPlayerElement = document.getElementById('current-player');
        this.winnerMessageElement = document.getElementById('winner-message');
        this.resetBtn = document.getElementById('reset-btn');
        
        this.boardSize = 15;
        this.cellSize = 40;
        this.currentPlayer = 1; // 1: 흑돌(플레이어), 2: 백돌(AI)
        this.board = [];
        this.gameOver = false;
        this.isAITurn = false;
        
        // 게임 통계
        this.moveCount = 0;
        this.playerMoves = 0;
        this.aiMoves = 0;
        this.gameStartTime = null;
        
        // 오디오 컨텍스트 초기화
        this.initAudio();
        
        this.initBoard();
        this.drawBoard();
        this.bindEvents();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.audioContext = null;
        }
    }
    
    playStoneSound() {
        if (!this.audioContext) return;
        
        // 실제 바둑돌 소리 - 여러 주파수를 조합해서 "딱" 소리 생성
        const now = this.audioContext.currentTime;
        
        // 1. 초기 충격음 (높은 주파수)
        const impact = this.audioContext.createOscillator();
        const impactGain = this.audioContext.createGain();
        
        impact.frequency.setValueAtTime(2000, now);
        impact.frequency.exponentialRampToValueAtTime(800, now + 0.01);
        impact.type = 'square';
        
        impactGain.gain.setValueAtTime(0.4, now);
        impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
        
        impact.connect(impactGain);
        impactGain.connect(this.audioContext.destination);
        
        impact.start(now);
        impact.stop(now + 0.02);
        
        // 2. 바둑돌의 공명음 (중간 주파수)
        const resonance = this.audioContext.createOscillator();
        const resonanceGain = this.audioContext.createGain();
        
        resonance.frequency.setValueAtTime(400, now + 0.005);
        resonance.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        resonance.type = 'sine';
        
        resonanceGain.gain.setValueAtTime(0, now + 0.005);
        resonanceGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        resonanceGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        resonance.connect(resonanceGain);
        resonanceGain.connect(this.audioContext.destination);
        
        resonance.start(now + 0.005);
        resonance.stop(now + 0.08);
        
        // 3. 바둑판의 나무 진동음 (낮은 주파수)
        const wood = this.audioContext.createOscillator();
        const woodGain = this.audioContext.createGain();
        
        wood.frequency.setValueAtTime(120, now + 0.01);
        wood.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        wood.type = 'triangle';
        
        woodGain.gain.setValueAtTime(0, now + 0.01);
        woodGain.gain.linearRampToValueAtTime(0.15, now + 0.02);
        woodGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        wood.connect(woodGain);
        woodGain.connect(this.audioContext.destination);
        
        wood.start(now + 0.01);
        wood.stop(now + 0.15);
        
        // 4. 고주파 노이즈 (바둑돌 표면 마찰음)
        const noiseBuffer = this.createClickNoiseBuffer();
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        
        noiseSource.buffer = noiseBuffer;
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, now);
        
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        noiseSource.start(now);
        noiseSource.stop(now + 0.03);
    }
    
    createClickNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 0.03; // 30ms
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // 감쇠하는 노이즈
            const decay = Math.exp(-i / (bufferSize * 0.1));
            output[i] = (Math.random() * 2 - 1) * decay;
        }
        
        return buffer;
    }
    
    initBoard() {
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = 0;
            }
        }
        this.currentPlayer = 1;
        this.gameOver = false;
        this.isAITurn = false;
        
        // 게임 통계 초기화
        this.moveCount = 0;
        this.playerMoves = 0;
        this.aiMoves = 0;
        this.gameStartTime = Date.now();
        
        this.updateCurrentPlayer();
        this.winnerMessageElement.textContent = '';
    }
    
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 바둑판 배경
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 격자 그리기
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.boardSize; i++) {
            // 세로선
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize + i * this.cellSize, this.cellSize);
            this.ctx.lineTo(this.cellSize + i * this.cellSize, this.canvas.height - this.cellSize);
            this.ctx.stroke();
            
            // 가로선
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize, this.cellSize + i * this.cellSize);
            this.ctx.lineTo(this.canvas.width - this.cellSize, this.cellSize + i * this.cellSize);
            this.ctx.stroke();
        }
        
        // 화점 그리기
        const points = [3, 7, 11];
        this.ctx.fillStyle = '#000';
        points.forEach(x => {
            points.forEach(y => {
                this.ctx.beginPath();
                this.ctx.arc(
                    this.cellSize + x * this.cellSize,
                    this.cellSize + y * this.cellSize,
                    3, 0, 2 * Math.PI
                );
                this.ctx.fill();
            });
        });
        
        // 돌 그리기
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] !== 0) {
                    this.drawStone(j, i, this.board[i][j]);
                }
            }
        }
    }
    
    drawStone(x, y, player) {
        const centerX = this.cellSize + x * this.cellSize;
        const centerY = this.cellSize + y * this.cellSize;
        const radius = this.cellSize * 0.4;
        
        // 그림자 효과
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        if (player === 1) {
            // 흑돌 - 입체적 그라데이션
            const gradient = this.ctx.createRadialGradient(
                centerX - radius * 0.3, centerY - radius * 0.3, 0,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(0.3, '#333');
            gradient.addColorStop(0.7, '#111');
            gradient.addColorStop(1, '#000');
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // 하이라이트 효과
            this.ctx.restore();
            this.ctx.save();
            const highlight = this.ctx.createRadialGradient(
                centerX - radius * 0.4, centerY - radius * 0.4, 0,
                centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.3
            );
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = highlight;
            this.ctx.fill();
            
        } else {
            // 백돌 - 입체적 그라데이션
            const gradient = this.ctx.createRadialGradient(
                centerX - radius * 0.3, centerY - radius * 0.3, 0,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.3, '#f5f5f5');
            gradient.addColorStop(0.7, '#e0e0e0');
            gradient.addColorStop(1, '#ccc');
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // 테두리
            this.ctx.restore();
            this.ctx.save();
            this.ctx.strokeStyle = '#999';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            // 하이라이트 효과
            const highlight = this.ctx.createRadialGradient(
                centerX - radius * 0.4, centerY - radius * 0.4, 0,
                centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.4
            );
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = highlight;
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    getBoardPosition(mouseX, mouseY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = mouseX - rect.left;
        const y = mouseY - rect.top;
        
        const boardX = Math.round((x - this.cellSize) / this.cellSize);
        const boardY = Math.round((y - this.cellSize) / this.cellSize);
        
        return { x: boardX, y: boardY };
    }
    
    isValidMove(x, y) {
        return x >= 0 && x < this.boardSize && 
               y >= 0 && y < this.boardSize && 
               this.board[y][x] === 0;
    }
    
    makeMove(x, y) {
        if (!this.isValidMove(x, y) || this.gameOver) {
            return false;
        }
        
        this.board[y][x] = this.currentPlayer;
        this.drawBoard();
        
        // 수 카운트 증가
        this.moveCount++;
        if (this.currentPlayer === 1) {
            this.playerMoves++;
        } else {
            this.aiMoves++;
        }
        
        // 바둑돌 놓는 소리 재생
        this.playStoneSound();
        
        if (this.checkWin(x, y)) {
            this.gameOver = true;
            const winner = this.currentPlayer === 1 ? '플레이어' : 'AI';
            const gameResult = this.calculateGameResult();
            this.winnerMessageElement.innerHTML = `
                <div class="winner-title">${winner} 승리!</div>
                <div class="game-stats">
                    <div>총 ${this.moveCount}수만에 승부 결정</div>
                    <div>플레이어: ${this.playerMoves}수 | AI: ${this.aiMoves}수</div>
                    <div>게임 시간: ${gameResult.gameTime}</div>
                    <div class="score">점수: ${gameResult.score}점 (${gameResult.grade})</div>
                </div>
            `;
            // 승리 소리 재생
            setTimeout(() => this.playWinSound(), 200);
            return true;
        }
        
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateCurrentPlayer();
        
        // AI 차례가 되면 AI가 수를 둠
        if (this.currentPlayer === 2 && !this.gameOver) {
            this.isAITurn = true;
            setTimeout(() => {
                this.makeAIMove();
            }, 500); // 0.5초 후 AI가 수를 둠
        }
        
        return true;
    }
    
    calculateGameResult() {
        const gameEndTime = Date.now();
        const gameTimeMs = gameEndTime - this.gameStartTime;
        const gameTimeSeconds = Math.floor(gameTimeMs / 1000);
        const minutes = Math.floor(gameTimeSeconds / 60);
        const seconds = gameTimeSeconds % 60;
        const gameTime = `${minutes}분 ${seconds}초`;
        
        // 점수 계산 (적은 수로 이길수록 높은 점수)
        let score = 1000;
        
        // 수 수에 따른 점수 (적을수록 좋음)
        if (this.currentPlayer === 1) { // 플레이어 승리
            score -= (this.playerMoves - 5) * 20; // 5수 이후부터 감점
            score += 200; // 승리 보너스
        } else { // AI 승리
            score = Math.max(100, 500 - (this.aiMoves - 5) * 15); // AI 승리시 낮은 점수
        }
        
        // 게임 시간에 따른 보너스/감점
        if (gameTimeSeconds < 60) {
            score += 100; // 1분 이내 보너스
        } else if (gameTimeSeconds > 300) {
            score -= 50; // 5분 초과 감점
        }
        
        // 점수 범위 조정
        score = Math.max(0, Math.min(1000, score));
        
        // 등급 계산
        let grade;
        if (score >= 900) grade = 'S급 고수';
        else if (score >= 800) grade = 'A급 상급자';
        else if (score >= 700) grade = 'B급 중급자';
        else if (score >= 600) grade = 'C급 초급자';
        else if (score >= 400) grade = 'D급 입문자';
        else grade = '연습이 필요해요';
        
        return {
            gameTime,
            score: Math.round(score),
            grade
        };
    }
    
    playWinSound() {
        if (!this.audioContext) return;
        
        // 승리 멜로디 (간단한 상승 음계)
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((frequency, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime + index * 0.2);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.2);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + index * 0.2 + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.2 + 0.4);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime + index * 0.2);
            oscillator.stop(this.audioContext.currentTime + index * 0.2 + 0.4);
        });
    }
    
    checkWin(x, y) {
        const directions = [
            [1, 0],   // 가로
            [0, 1],   // 세로
            [1, 1],   // 대각선 \
            [1, -1]   // 대각선 /
        ];
        
        for (let [dx, dy] of directions) {
            let count = 1;
            
            // 한 방향으로 확인
            for (let i = 1; i < 5; i++) {
                const newX = x + dx * i;
                const newY = y + dy * i;
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize && 
                    this.board[newY][newX] === this.currentPlayer) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 반대 방향으로 확인
            for (let i = 1; i < 5; i++) {
                const newX = x - dx * i;
                const newY = y - dy * i;
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize && 
                    this.board[newY][newX] === this.currentPlayer) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    updateCurrentPlayer() {
        if (this.currentPlayer === 1) {
            this.currentPlayerElement.textContent = '플레이어 (흑돌)';
        } else {
            this.currentPlayerElement.textContent = 'AI (백돌)';
        }
        
        // 수 카운터 업데이트
        const moveCountElement = document.getElementById('move-count');
        if (moveCountElement) {
            moveCountElement.textContent = this.moveCount;
        }
    }
    
    makeAIMove() {
        if (this.gameOver) return;
        
        const move = this.getBestMove();
        if (move) {
            this.isAITurn = false;
            this.makeMove(move.x, move.y);
        }
    }
    
    getBestMove() {
        // 1. 승리할 수 있는 수 찾기
        let move = this.findWinningMove(2);
        if (move) return move;
        
        // 2. 상대방의 승리를 막는 수 찾기
        move = this.findWinningMove(1);
        if (move) return move;
        
        // 3. 공격적인 수 찾기 (4개 연속 만들기)
        move = this.findAttackMove(2);
        if (move) return move;
        
        // 4. 상대방의 공격을 막기 (4개 연속 막기)
        move = this.findAttackMove(1);
        if (move) return move;
        
        // 5. 3개 연속 만들기
        move = this.findConsecutiveMove(2, 3);
        if (move) return move;
        
        // 6. 상대방의 3개 연속 막기
        move = this.findConsecutiveMove(1, 3);
        if (move) return move;
        
        // 7. 중앙 근처의 좋은 위치 찾기
        return this.findStrategicMove();
    }
    
    findWinningMove(player) {
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === 0) {
                    this.board[y][x] = player;
                    if (this.checkWin(x, y)) {
                        this.board[y][x] = 0;
                        return { x, y };
                    }
                    this.board[y][x] = 0;
                }
            }
        }
        return null;
    }
    
    findAttackMove(player) {
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === 0) {
                    if (this.countConsecutive(x, y, player) >= 4) {
                        return { x, y };
                    }
                }
            }
        }
        return null;
    }
    
    findConsecutiveMove(player, targetCount) {
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === 0) {
                    if (this.countConsecutive(x, y, player) >= targetCount) {
                        return { x, y };
                    }
                }
            }
        }
        return null;
    }
    
    countConsecutive(x, y, player) {
        const directions = [
            [1, 0], [0, 1], [1, 1], [1, -1]
        ];
        
        let maxCount = 0;
        
        for (let [dx, dy] of directions) {
            let count = 1;
            
            // 한 방향으로 확인
            for (let i = 1; i < 5; i++) {
                const newX = x + dx * i;
                const newY = y + dy * i;
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize && 
                    this.board[newY][newX] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 반대 방향으로 확인
            for (let i = 1; i < 5; i++) {
                const newX = x - dx * i;
                const newY = y - dy * i;
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize && 
                    this.board[newY][newX] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            maxCount = Math.max(maxCount, count);
        }
        
        return maxCount;
    }
    
    findStrategicMove() {
        const center = Math.floor(this.boardSize / 2);
        const moves = [];
        
        // 중앙 근처의 빈 자리들을 찾아서 점수를 매김
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === 0) {
                    const distance = Math.abs(x - center) + Math.abs(y - center);
                    const score = 20 - distance + Math.random() * 5; // 약간의 랜덤성 추가
                    moves.push({ x, y, score });
                }
            }
        }
        
        // 점수가 높은 순으로 정렬
        moves.sort((a, b) => b.score - a.score);
        
        return moves.length > 0 ? moves[0] : null;
    }
    
    bindEvents() {
        this.canvas.addEventListener('click', (e) => {
            // 플레이어 차례일 때만 클릭 허용
            if (this.currentPlayer === 1 && !this.isAITurn && !this.gameOver) {
                // 오디오 컨텍스트 활성화 (사용자 상호작용 필요)
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                const pos = this.getBoardPosition(e.clientX, e.clientY);
                this.makeMove(pos.x, pos.y);
            }
        });
        
        this.resetBtn.addEventListener('click', () => {
            this.initBoard();
            this.drawBoard();
        });
    }
}

// 게임 시작
window.addEventListener('DOMContentLoaded', () => {
    new OmokGame();
});