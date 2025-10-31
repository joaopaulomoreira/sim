// js/gameLogic.js

let gameState;

// Estado inicial do jogo
const initialGameState = {
    currentTurn: 1,
    cash: 1000.00, // Capital inicial
    profit: 0.00,
    revenue: 0.00,
    expenses: 0.00,
    products: [
        { id: 'shampoo', name: 'Shampoo para Cães', stock: 0, purchaseCost: 10.00, price: 25.00 },
        { id: 'ração', name: 'Ração Premium (1kg)', stock: 0, purchaseCost: 20.00, price: 45.00 },
        { id: 'coleira', name: 'Coleira Ajustável', stock: 0, purchaseCost: 5.00, price: 15.00 },
        { id: 'brinquedo', name: 'Brinquedo Mordedor', stock: 0, purchaseCost: 7.00, price: 18.00 },
    ],
    transactions: [],
    // ... outros estados do jogo
};

// Carregar estado do jogo ou inicializar
function loadGameState() {
    const savedState = localStorage.getItem('petShopGameState');
    if (savedState) {
        gameState = JSON.parse(savedState);
        if (!gameState.products) {
            gameState.products = initialGameState.products;
        }
        if (!gameState.transactions) {
            gameState.transactions = [];
        }

        if (gameState.currentTurn === 1 && gameState.transactions.length === 0) {
            addTransaction(1, 'revenue', 'Capital Inicial', initialGameState.cash);
        }

    } else {
        resetGame();
    }
}

// Salvar estado do jogo
function saveGameState() {
    localStorage.setItem('petShopGameState', JSON.stringify(gameState));
}

// NOVO: Adicione 'quantity = null' como parâmetro opcional
function addTransaction(turn, type, description, amount, quantity = null) {
    // NOVO: Armazena a quantidade na transação
    gameState.transactions.push({ turn, type, description, amount, quantity });
    if (type === 'revenue') {
        gameState.revenue += amount;
        gameState.profit += amount;
    } else if (type === 'expense') {
        gameState.expenses += amount;
        gameState.profit -= amount;
    }
    saveGameState();
}

// Resetar o jogo para o estado inicial
function resetGame() {
    gameState = JSON.parse(JSON.stringify(initialGameState));
    addTransaction(1, 'revenue', 'Capital Inicial', initialGameState.cash);
    saveGameState();
}

// Avançar um turno
function advanceTurn() {
    gameState.currentTurn++;

    gameState.products.forEach(product => {
        if (product.stock > 0) {
            const salesChance = Math.random();
            if (salesChance > 0.3) {
                const maxSell = Math.min(product.stock, Math.floor(Math.random() * 5) + 1);
                if (maxSell > 0) {
                    const saleAmount = maxSell * product.price;
                    const costOfGoodsSold = maxSell * product.purchaseCost;

                    product.stock -= maxSell;
                    gameState.cash += saleAmount;
                    
                    // NOVO: Passando a quantidade vendida (maxSell) para a transação de receita
                    addTransaction(gameState.currentTurn, 'revenue', `Venda de ${maxSell}x ${product.name}`, saleAmount, maxSell);
                    addTransaction(gameState.currentTurn, 'expense', `Custo dos produtos vendidos (${product.name})`, costOfGoodsSold);
                }
            }
        }
    });

    const dailyOperatingExpense = 50.00;
    gameState.cash -= dailyOperatingExpense;
    addTransaction(gameState.currentTurn, 'expense', 'Despesas Operacionais Diárias', dailyOperatingExpense);

    saveGameState();
}

// Comprar um produto
function buyProduct(productId, quantity) {
    if (quantity <= 0) {
        alert('A quantidade deve ser maior que zero.');
        return false;
    }
    const product = gameState.products.find(p => p.id === productId);
    if (product) {
        const totalCost = quantity * product.purchaseCost;
        if (gameState.cash >= totalCost) {
            gameState.cash -= totalCost;
            product.stock += quantity;
            // A compra é uma despesa, não tem uma "quantidade vendida" associada neste contexto de gráfico de vendas.
            addTransaction(gameState.currentTurn, 'expense', `Compra de ${quantity}x ${product.name}`, totalCost);
            saveGameState();
            return true;
        } else {
            alert('Dinheiro insuficiente para comprar este produto.');
            return false;
        }
    }
    return false;
}

// Atualizar preço de venda de um produto
function updateProductPrice(productId, newPrice) {
    if (newPrice <= 0) {
        alert('O preço deve ser maior que zero.');
        return false;
    }
    const product = gameState.products.find(p => p.id === productId);
    if (product) {
        product.price = newPrice;
        saveGameState();
        return true;
    }
    return false;
}

// Exportar estado do jogo
function exportGame() {
    const dataStr = JSON.stringify(gameState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'petShopGameSave.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Importar estado do jogo
function importGame(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedState = JSON.parse(event.target.result);
                if (importedState && typeof importedState.currentTurn === 'number' && typeof importedState.cash === 'number' && Array.isArray(importedState.products)) {
                    gameState = importedState;
                    saveGameState();
                    resolve();
                } else {
                    throw new Error('Formato de arquivo de jogo inválido.');
                }
            } catch (e) {
                reject('Erro ao ler ou analisar o arquivo JSON: ' + e.message);
            }
        };
        reader.onerror = () => {
            reject('Erro ao ler o arquivo.');
        };
        reader.readAsText(file);
    });
}

// Inicializar o jogo ao carregar o script
loadGameState();