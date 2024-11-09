// script.js

// Импортируем функцию из handEvaluator.js
import { evaluateHand } from './handEvaluator.js';

// Класс карты
class Card {
    constructor(suit, rank) {
        this.suit = suit; // масть
        this.rank = rank; // достоинство
    }

    // Получение URL изображения карты
    getImageUrl() {
        return `images/cards/${this.rank}_of_${this.suit}.png`;
    }
}

// Класс игрока
class Player {
    constructor(name, isAI = false, difficulty = 'medium') {
        this.name = name;
        this.isAI = isAI;
        this.hand = [];
        this.chips = 1000; // Количество фишек
        this.currentBet = 0;
        this.isFolded = false;
        this.difficulty = difficulty; // Сложность ИИ
    }

    // Сброс состояния игрока для нового раунда
    resetForNewRound() {
        this.hand = [];
        this.currentBet = 0;
        this.isFolded = false;
    }
}

// Класс игры
class Game {
    constructor(playerName, aiDifficulty) {
        this.players = [];
        this.deck = [];
        this.pot = 0;
        this.currentPlayerIndex = 0;
        this.communityCards = [];
        this.gamePhase = 'pre-flop'; // Возможные фазы: pre-flop, flop, turn, river, showdown
        this.smallBlind = 50;
        this.bigBlind = 100;
        this.dealerIndex = 0;
        this.playerName = playerName;
        this.aiDifficulty = aiDifficulty;
    }

    // Инициализация игры
    initializeGame() {
        // Создаем колоду карт
        this.createDeck();

        // Создаем игроков (человек и 4 ИИ)
        this.players.push(new Player(this.playerName));
        for (let i = 1; i <= 4; i++) {
            this.players.push(new Player(`ИИ ${i}`, true, this.aiDifficulty));
        }

        // Начинаем первый раунд
        this.startNewRound();
    }

    // Создание и перемешивание колоды карт
    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = [
            '2', '3', '4', '5', '6', '7', '8', '9', '10',
            'jack', 'queen', 'king', 'ace'
        ];

        this.deck = [];

        for (let suit of suits) {
            for (let rank of ranks) {
                this.deck.push(new Card(suit, rank));
            }
        }

        // Перемешиваем колоду
        this.deck = this.shuffleDeck(this.deck);
    }

    // Функция перемешивания колоды
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    // Начало нового раунда
    startNewRound() {
        this.pot = 0;
        this.communityCards = [];
        this.gamePhase = 'pre-flop';
        this.currentPlayerIndex = 0;

        // Сбрасываем состояние игроков
        for (let player of this.players) {
            player.resetForNewRound();
        }

        // Устанавливаем блайнды
        this.setBlinds();

        // Раздаем по две карты каждому игроку
        for (let player of this.players) {
            player.hand.push(this.deck.pop());
            player.hand.push(this.deck.pop());
            this.playSound('card-sound');
        }

        // Обновляем отображение
        this.renderGame();

        // Начинаем раунд ставок
        this.startBettingRound();

        // Сдвигаем дилера
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    }

    // Установка блайндов
    setBlinds() {
        const smallBlindPlayer = this.players[(this.dealerIndex + 1) % this.players.length];
        const bigBlindPlayer = this.players[(this.dealerIndex + 2) % this.players.length];

        smallBlindPlayer.chips -= this.smallBlind;
        smallBlindPlayer.currentBet = this.smallBlind;
        this.pot += this.smallBlind;

        bigBlindPlayer.chips -= this.bigBlind;
        bigBlindPlayer.currentBet = this.bigBlind;
        this.pot += this.bigBlind;

        console.log(`${smallBlindPlayer.name} ставит малый блайнд: ${this.smallBlind}`);
        console.log(`${bigBlindPlayer.name} ставит большой блайнд: ${this.bigBlind}`);

        // Устанавливаем текущего игрока после большого блайнда
        this.currentPlayerIndex = (this.dealerIndex + 3) % this.players.length;
    }

    // Отображение игры на экране
    renderGame() {
        const gameContainer = document.getElementById('game-container');
        gameContainer.innerHTML = ''; // Очищаем контейнер

        // Отображаем общие карты
        const communityCardsContainer = document.createElement('div');
        communityCardsContainer.id = 'community-cards';

        for (let card of this.communityCards) {
            const cardImg = document.createElement('img');
            cardImg.src = card.getImageUrl();
            cardImg.classList.add('card');
            communityCardsContainer.appendChild(cardImg);
        }

        gameContainer.appendChild(communityCardsContainer);

        // Отображаем карты игроков
        this.players.forEach((player, index) => {
            const playerContainer = document.createElement('div');
            playerContainer.classList.add('player');

            // Позиционирование игроков
            playerContainer.style = this.getPlayerPositionStyle(index);

            // Имя игрока
            const playerName = document.createElement('div');
            playerName.innerText = player.name;
            playerContainer.appendChild(playerName);

            // Карты игрока
            player.hand.forEach(card => {
                const cardImg = document.createElement('img');
                // Скрываем карты ИИ
                if (player.isAI && this.gamePhase !== 'showdown') {
                    cardImg.src = 'images/cards/back.png';
                } else {
                    cardImg.src = card.getImageUrl();
                }
                cardImg.classList.add('card');
                playerContainer.appendChild(cardImg);
            });

            // Информация о фишках и ставке
            const playerInfo = document.createElement('div');
            playerInfo.innerHTML = `
                Фишки: ${player.chips} <br>
                Ставка: ${player.currentBet}
            `;
            playerContainer.appendChild(playerInfo);

            gameContainer.appendChild(playerContainer);
        });

        // Отображаем текущий банк
        const potDisplay = document.createElement('div');
        potDisplay.id = 'pot-display';
        potDisplay.innerText = `Банк: ${this.pot}`;
        gameContainer.appendChild(potDisplay);
    }

    // Получение стилей для позиционирования игроков
    getPlayerPositionStyle(index) {
        const positions = [
            'bottom: 10%; left: 10%;',      // Игрок 1 (Вы)
            'top: 10%; left: 50%; transform: translateX(-50%);', // Игрок 2
            'top: 30%; right: 10%;',        // Игрок 3
            'bottom: 30%; right: 10%;',     // Игрок 4
            'bottom: 10%; left: 50%; transform: translateX(-50%);' // Игрок 5
        ];
        return positions[index];
    }

    // Начало раунда ставок
    startBettingRound() {
        // Определяем порядок ходов
        this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;
        this.promptPlayerAction();
    }

    // Запрос действия у текущего игрока
    promptPlayerAction() {
        const player = this.players[this.currentPlayerIndex];

        if (player.isFolded || player.chips <= 0) {
            this.nextPlayerTurn();
            return;
        }

        if (player.isAI) {
            // Действия ИИ
            this.aiAction(player);
        } else {
            // Действия человека
            this.playerAction(player);
        }
    }

    // Действия игрока (человека)
    playerAction(player) {
        console.log(`${player.name}, ваш ход.`);

        const checkButton = document.getElementById('check-button');
        const betButton = document.getElementById('bet-button');
        const foldButton = document.getElementById('fold-button');

        // Включаем кнопки действий
        checkButton.disabled = false;
        betButton.disabled = false;
        foldButton.disabled = false;

        // Обработчики событий для кнопок
        checkButton.onclick = () => {
            console.log(`${player.name} делает чек.`);
            this.disablePlayerActions();
            this.nextPlayerTurn();
        };

        betButton.onclick = () => {
            const betAmount = parseInt(prompt('Введите сумму ставки:', '100'));
            if (isNaN(betAmount) || betAmount <= 0 || betAmount > player.chips) {
                alert('Неверная сумма ставки.');
                return;
            }
            console.log(`${player.name} делает ставку ${betAmount}.`);
            this.pot += betAmount;
            player.chips -= betAmount;
            player.currentBet += betAmount;
            this.playSound('bet-sound');
            this.disablePlayerActions();
            this.nextPlayerTurn();
        };

        foldButton.onclick = () => {
            console.log(`${player.name} пасует.`);
            player.isFolded = true;
            this.disablePlayerActions();
            this.nextPlayerTurn();
        };
    }

    // Отключение кнопок действий игрока
    disablePlayerActions() {
        const checkButton = document.getElementById('check-button');
        const betButton = document.getElementById('bet-button');
        const foldButton = document.getElementById('fold-button');

        checkButton.disabled = true;
        betButton.disabled = true;
        foldButton.disabled = true;
    }

    // Действия ИИ
    aiAction(player) {
        console.log(`${player.name} думает...`);

        setTimeout(() => {
            const handStrength = this.evaluateHandStrength(player);
            const currentMaxBet = Math.max(...this.players.map(p => p.currentBet));

            let action;
            if (handStrength > 0.8) {
                const raiseAmount = currentMaxBet - player.currentBet + 100;
                action = `повышает ставку до ${currentMaxBet + raiseAmount}`;
                this.pot += raiseAmount;
                player.chips -= raiseAmount;
                player.currentBet += raiseAmount;
                this.playSound('bet-sound');
            } else if (handStrength > 0.5) {
                const callAmount = currentMaxBet - player.currentBet;
                if (callAmount > player.chips) {
                    action = 'коллит олл-ин';
                    this.pot += player.chips;
                    player.currentBet += player.chips;
                    player.chips = 0;
                    this.playSound('bet-sound');
                } else {
                    action = `коллит ${callAmount}`;
                    this.pot += callAmount;
                    player.chips -= callAmount;
                    player.currentBet += callAmount;
                    this.playSound('bet-sound');
                }
            } else {
                action = 'пасует';
                player.isFolded = true;
            }

            console.log(`${player.name} ${action}.`);
            this.nextPlayerTurn();
        }, 1000);
    }

    // Переход хода к следующему игроку
    nextPlayerTurn() {
        this.currentPlayerIndex++;

        if (this.currentPlayerIndex >= this.players.length) {
            // Раунд ставок завершен
            this.progressGamePhase();
        } else {
            this.promptPlayerAction();
        }
    }

    // Переход к следующей фазе игры
    progressGamePhase() {
        // Сброс текущих ставок игроков
        for (let player of this.players) {
            player.currentBet = 0;
        }

        // Переходим к следующей фазе игры
        switch (this.gamePhase) {
            case 'pre-flop':
                this.gamePhase = 'flop';
                // Добавляем три общие карты
                this.communityCards.push(this.deck.pop());
                this.communityCards.push(this.deck.pop());
                this.communityCards.push(this.deck.pop());
                break;
            case 'flop':
                this.gamePhase = 'turn';
                // Добавляем одну общую карту
                this.communityCards.push(this.deck.pop());
                break;
            case 'turn':
                this.gamePhase = 'river';
                // Добавляем последнюю общую карту
                this.communityCards.push(this.deck.pop());
                break;
            case 'river':
                this.gamePhase = 'showdown';
                this.showdown();
                return;
            default:
                break;
        }

        // Обновляем отображение
        this.renderGame();

        // Начинаем новый раунд ставок
        this.startBettingRound();
    }

    // Оценка силы руки игрока
    evaluateHandStrength(player) {
        const result = evaluateHand(player.hand, this.communityCards);
        // Нормализуем handRank для получения значения от 0 до 1
        const strength = result.handRank / 10;
        return strength;
    }

    // Открытие карт и определение победителя
    showdown() {
        console.log('Открытие карт и определение победителя.');

        const activePlayers = this.players.filter(player => !player.isFolded);

        let bestPlayer = null;
        let bestHand = null;

        for (let player of activePlayers) {
            const result = evaluateHand(player.hand, this.communityCards);
            console.log(`${player.name} имеет комбинацию: ${result.combinationName}`);

            if (!bestHand || result.handRank > bestHand.handRank ||
                (result.handRank === bestHand.handRank && result.highCard > bestHand.highCard)) {
                bestHand = result;
                bestPlayer = player;
            }
        }

        if (bestPlayer) {
            console.log(`Победитель: ${bestPlayer.name} с комбинацией ${bestHand.combinationName}`);
            bestPlayer.chips += this.pot;
            this.playSound('win-sound');
        } else {
            console.log('Ничья!');
        }

        // Обновляем отображение
        this.gamePhase = 'showdown';
        this.renderGame();

        // Начинаем новый раунд после паузы
        setTimeout(() => {
            this.startNewRound();
            this.renderGame();
        }, 5000);
    }

    // Функция для воспроизведения звука
    playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play();
        }
    }
}

// Обработчик кнопки "Начать игру"
document.getElementById('start-game-button').onclick = () => {
    const playerName = document.getElementById('player-name').value || 'Вы';
    const aiDifficulty = document.getElementById('ai-difficulty').value;

    // Создаем и запускаем игру
    const game = new Game(playerName, aiDifficulty);
    game.initializeGame();

    // Скрываем экран приветствия и показываем игру
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('player-actions').style.display = 'block';
};
