// handEvaluator.js

// Функция для оценки руки игрока
function evaluateHand(hand, communityCards) {
    const allCards = hand.concat(communityCards);
    // Преобразуем карты в удобный для анализа формат
    const cardValues = allCards.map(card => getCardValue(card.rank));
    const cardSuits = allCards.map(card => card.suit);

    // Сортируем карты по достоинству
    cardValues.sort((a, b) => b - a);

    // Логика для определения комбинаций
    const isFlush = checkFlush(cardSuits);
    const isStraight = checkStraight(cardValues);
    const counts = getCounts(cardValues);

    // Определяем комбинацию
    let handRank = 0; // Чем выше, тем лучше
    let combinationName = '';

    if (isFlush && isStraight && cardValues[0] === 14) {
        handRank = 10;
        combinationName = 'Роял Флеш';
    } else if (isFlush && isStraight) {
        handRank = 9;
        combinationName = 'Стрит Флеш';
    } else if (counts.fourOfKind) {
        handRank = 8;
        combinationName = 'Каре';
    } else if (counts.threeOfKind && counts.pairs === 1) {
        handRank = 7;
        combinationName = 'Фулл Хаус';
    } else if (isFlush) {
        handRank = 6;
        combinationName = 'Флеш';
    } else if (isStraight) {
        handRank = 5;
        combinationName = 'Стрит';
    } else if (counts.threeOfKind) {
        handRank = 4;
        combinationName = 'Сет';
    } else if (counts.pairs === 2) {
        handRank = 3;
        combinationName = 'Две пары';
    } else if (counts.pairs === 1) {
        handRank = 2;
        combinationName = 'Пара';
    } else {
        handRank = 1;
        combinationName = 'Старшая карта';
    }

    return { handRank, combinationName, highCard: cardValues[0] };
}

// Вспомогательные функции
function getCardValue(rank) {
    switch (rank) {
        case '2': return 2;
        case '3': return 3;
        case '4': return 4;
        case '5': return 5;
        case '6': return 6;
        case '7': return 7;
        case '8': return 8;
        case '9': return 9;
        case '10': return 10;
        case 'jack': return 11;
        case 'queen': return 12;
        case 'king': return 13;
        case 'ace': return 14;
        default: return 0;
    }
}

function checkFlush(suits) {
    const suitCounts = suits.reduce((acc, suit) => {
        acc[suit] = (acc[suit] || 0) + 1;
        return acc;
    }, {});

    return Object.values(suitCounts).some(count => count >= 5);
}

function checkStraight(values) {
    const uniqueValues = [...new Set(values)];
    uniqueValues.sort((a, b) => b - a);

    for (let i = 0; i <= uniqueValues.length - 5; i++) {
        let isSequence = true;
        for (let j = 0; j < 4; j++) {
            if (uniqueValues[i + j] - 1 !== uniqueValues[i + j + 1]) {
                isSequence = false;
                break;
            }
        }
        if (isSequence) return true;
    }
    // Проверка на особый случай A-2-3-4-5
    if (uniqueValues.includes(14) && uniqueValues.includes(5) && uniqueValues.includes(4) && uniqueValues.includes(3) && uniqueValues.includes(2)) {
        return true;
    }
    return false;
}

function getCounts(values) {
    const counts = values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    const countsValues = Object.values(counts);

    return {
        fourOfKind: countsValues.includes(4),
        threeOfKind: countsValues.includes(3),
        pairs: countsValues.filter(count => count === 2).length
    };
}

// Экспортируем функцию
export { evaluateHand };
