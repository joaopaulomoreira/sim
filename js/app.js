// js/app.js

// Variáveis globais para os gráficos
let visitorsChart;
let salesChart;
let mostSoldProductsChart;
let salesQuantityChart; // NOVO: Variável para o gráfico de quantidade de vendas por turno

// Funções para atualizar a UI (MANTENHA)
function updateGlobalDisplays() {
    document.getElementById('current-turn-display').textContent = gameState.currentTurn;
    document.getElementById('cash-display').textContent = `R$ ${gameState.cash.toFixed(2)}`;
    document.getElementById('products-cash-display').textContent = `R$ ${gameState.cash.toFixed(2)}`;
}

// Função para gerar dados de vendas simulados para o gráfico de produtos mais vendidos
function generateMostSoldProductsData() {
    const productsToProcess = gameState.products && Array.isArray(gameState.products) ? gameState.products : [];

    if (productsToProcess.length === 0) {
        return {
            categories: [],
            seriesData: []
        };
    }

    const productsWithSimulatedSales = productsToProcess.map(product => ({
        name: product.name,
        sales: Math.floor(Math.random() * 500) + 50
    }));

    productsWithSimulatedSales.sort((a, b) => b.sales - a.sales);
    const topProducts = productsWithSimulatedSales.slice(0, 5);

    return {
        categories: topProducts.map(p => p.name),
        seriesData: topProducts.map(p => p.sales)
    };
}

// NOVO: Função para obter dados de quantidade de vendas por turno
function getSalesQuantityPerTurnData() {
    const salesByTurn = {};
    const maxTurn = gameState.currentTurn;

    // Inicializa todos os turnos até o atual com 0 vendas para garantir que apareçam no gráfico
    for (let i = 1; i <= maxTurn; i++) {
        salesByTurn[i] = 0;
    }

    gameState.transactions.forEach(t => {
        // Verifica se é uma transação de receita (venda) e se tem a propriedade 'quantity'
        if (t.type === 'revenue' && t.description.startsWith('Venda de') && t.quantity != null) {
            salesByTurn[t.turn] = (salesByTurn[t.turn] || 0) + t.quantity;
        }
    });

    // Converte o objeto para arrays de categorias (turnos) e dados (quantidades)
    const categories = Object.keys(salesByTurn).map(Number).sort((a,b) => a-b).map(String); // Garante ordem numérica ascendente
    const seriesData = categories.map(turn => salesByTurn[turn]);

    return { categories, seriesData };
}


function updateDashboardPage() {
    document.getElementById('dashboard-cash').textContent = `R$ ${gameState.cash.toFixed(2)}`;
    document.getElementById('dashboard-profit').textContent = `R$ ${gameState.profit.toFixed(2)}`;
    document.getElementById('dashboard-day').textContent = `Dia ${gameState.currentTurn}`;
    document.getElementById('dashboard-total-stock').textContent = gameState.products.reduce((acc, p) => acc + p.stock, 0);

    const productStockTableBody = document.getElementById('dashboard-product-stock-table');
    productStockTableBody.innerHTML = '';
    gameState.products.forEach(product => {
        const row = `
            <tr>
                <td>
                    <img src="assets/img/default-150x150.png" alt="${product.name}" class="rounded-circle img-size-32 me-2" />
                    ${product.name}
                </td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td>${Math.floor(Math.random() * 1000) + 1} Vendidos</td>
                <td>${product.stock}</td>
            </tr>
        `;
        productStockTableBody.insertAdjacentHTML('beforeend', row);
    });

    if (visitorsChart) visitorsChart.updateSeries(visitorsChartOptions.series);
    if (salesChart) salesChart.updateSeries(salesChartOptions.series);

    if (mostSoldProductsChart) {
        const { categories, seriesData } = generateMostSoldProductsData();
        console.log('Atualizando gráfico de Produtos Mais Vendidos. Categorias:', categories, 'Dados:', seriesData);
        mostSoldProductsChart.updateOptions({
            xaxis: { categories: categories }
        });
        mostSoldProductsChart.updateSeries([{ data: seriesData }]);
    } else {
        console.warn('mostSoldProductsChart não inicializado ao tentar atualizar.');
    }

    // NOVO: Atualiza o gráfico de quantidade de vendas por turno
    if (salesQuantityChart) {
        const { categories, seriesData } = getSalesQuantityPerTurnData();
        console.log('Atualizando gráfico de Quantidade de Vendas por Turno. Categorias:', categories, 'Dados:', seriesData);
        salesQuantityChart.updateOptions({
            xaxis: { categories: categories }
        });
        salesQuantityChart.updateSeries([{ data: seriesData }]);
    } else {
        console.warn('salesQuantityChart não inicializado ao tentar atualizar.');
    }
}

function updateProductsPage() {
    document.getElementById('products-cash-display').textContent = `R$ ${gameState.cash.toFixed(2)}`;
    const productsTableBody = document.getElementById('products-table-body');
    productsTableBody.innerHTML = '';

    gameState.products.forEach(product => {
        const row = `
            <tr>
                <td data-label="Produto">${product.name}</td>
                <td data-label="Estoque">${product.stock}</td>
                <td data-label="Custo Compra">R$ ${product.purchaseCost.toFixed(2)}</td>
                <td data-label="Preço Venda">R$ ${product.price.toFixed(2)}</td>
                <td data-label="Comprar">
                    <div class="d-flex flex-column flex-md-row align-items-md-center">
                        <input
                            type="number"
                            min="0"
                            value=""
                            placeholder="Qtd."
                            class="form-control form-control-sm mb-2 mb-md-0 me-md-2 product-buy-quantity"
                            data-product-id="${product.id}"
                            style="max-width: 100px;"
                        />
                        <button class="btn btn-success btn-sm buy-product-btn" data-product-id="${product.id}">
                            <i class="bi bi-cart-plus me-1"></i> Comprar
                        </button>
                    </div>
                </td>
                <td data-label="Ajustar Preço">
                    <div class="d-flex flex-column flex-md-row align-items-md-center">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value=""
                            placeholder="Preço"
                            class="form-control form-control-sm mb-2 mb-md-0 me-md-2 product-new-price"
                            data-product-id="${product.id}"
                            style="max-width: 100px;"
                        />
                        <button class="btn btn-info btn-sm update-price-btn" data-product-id="${product.id}">
                            <i class="bi bi-tag me-1"></i> Atualizar
                        </button>
                    </div>
                </td>
            </tr>
        `;
        productsTableBody.insertAdjacentHTML('beforeend', row);
    });

    productsTableBody.querySelectorAll('.buy-product-btn').forEach(button => {
        button.onclick = (e) => {
            const productId = e.target.dataset.productId;
            const quantityInput = productsTableBody.querySelector(`.product-buy-quantity[data-product-id="${productId}"]`);
            const quantity = parseInt(quantityInput.value);
            if (buyProduct(productId, quantity)) {
                updateAllPages();
            }
            quantityInput.value = '';
        };
    });

    productsTableBody.querySelectorAll('.update-price-btn').forEach(button => {
        button.onclick = (e) => {
            const productId = e.target.dataset.productId;
            const priceInput = productsTableBody.querySelector(`.product-new-price[data-product-id="${productId}"]`);
            const newPriceValue = parseFloat(priceInput.value);
            if (updateProductPrice(productId, newPriceValue)) {
                updateAllPages();
            }
            priceInput.value = '';
        };
    });
}

function updateFinancePage() {
    document.getElementById('finance-cash').textContent = `R$ ${gameState.cash.toFixed(2)}`;
    const stockValue = gameState.products.reduce((acc, p) => acc + (p.stock * p.purchaseCost), 0).toFixed(2);
    document.getElementById('finance-stock-value').textContent = `R$ ${stockValue}`;
    document.getElementById('finance-total-assets').textContent = `R$ ${(gameState.cash + parseFloat(stockValue)).toFixed(2)}`;

    document.getElementById('finance-revenue').textContent = `R$ ${gameState.revenue.toFixed(2)}`;
    document.getElementById('finance-expenses').textContent = `R$ ${gameState.expenses.toFixed(2)}`;
    const profitElement = document.getElementById('finance-profit');
    profitElement.textContent = `R$ ${gameState.profit.toFixed(2)}`;
    profitElement.className = gameState.profit >= 0 ? 'text-success' : 'text-danger';

    const transactionsTableBody = document.getElementById('finance-transactions-table-body');
    const emptyMessage = document.getElementById('finance-transactions-empty');

    if (gameState.transactions.length === 0) {
        transactionsTableBody.innerHTML = '';
        emptyMessage.classList.remove('d-none');
        transactionsTableBody.closest('.table-responsive').classList.add('d-none');
    } else {
        emptyMessage.classList.add('d-none');
        transactionsTableBody.closest('.table-responsive').classList.remove('d-none');
        transactionsTableBody.innerHTML = '';
        gameState.transactions.slice().reverse().forEach(t => {
            const rowClass = t.type === 'revenue' ? 'text-success' : 'text-danger';
            const row = `
                <tr class="${rowClass}">
                    <td data-label="Turno">${t.turn}</td>
                    <td data-label="Tipo">${t.type === 'revenue' ? 'Receita' : 'Despesa'}</td>
                    <td data-label="Descrição">${t.description}</td>
                    <td data-label="Valor">R$ ${t.amount.toFixed(2)}</td>
                </tr>
            `;
            transactionsTableBody.insertAdjacentHTML('beforeend', row);
        });
    }
}

function updateSettingsPage() {
    // Nenhuma atualização dinâmica específica para esta página além dos eventos
}

let currentPage = 'dashboard';
function navigateTo(pageId) {
    const pages = document.querySelectorAll('.content-page');
    pages.forEach(page => page.classList.add('d-none'));

    document.getElementById(`${pageId}-page`).classList.remove('d-none');
    currentPage = pageId;

    document.querySelectorAll('.app-sidebar .nav-link').forEach(link => {
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    const pageTitle = pageId.charAt(0).toUpperCase() + pageId.slice(1);
    document.getElementById('current-page-title-nav').textContent = `Simulador Pet Shop - ${pageTitle}`;
    document.getElementById('page-content-title').textContent = pageTitle;
    document.getElementById('page-content-breadcrumb').textContent = pageTitle;

    updateAllPages();
}

function updateAllPages() {
    updateGlobalDisplays();
    switch (currentPage) {
        case 'dashboard':
            updateDashboardPage();
            break;
        case 'products':
            updateProductsPage();
            break;
        case 'finance':
            updateFinancePage();
            break;
        case 'settings':
            updateSettingsPage();
            break;
    }
}

// Inicialização dos Gráficos ApexCharts
const visitorsChartOptions = {
    series: [{ name: 'Este Mês', data: [100, 120, 170, 167, 180, 177, 160] }, { name: 'Mês Passado', data: [60, 80, 70, 67, 80, 77, 100] }],
    chart: { height: 200, type: 'line', toolbar: { show: false } },
    colors: ['#34699A', '#58A0C8'],
    stroke: { curve: 'smooth' },
    grid: { borderColor: '#e7e7e7', row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 } },
    legend: { show: false },
    markers: { size: 1 },
    xaxis: { categories: ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5', 'Dia 6', 'Dia 7'] },
};

const salesChartOptions = {
    series: [{ name: 'Lucro Líquido', data: [44, 55, 57, 56, 61, 58, 63, 60, 66] }, { name: 'Receita', data: [76, 85, 101, 98, 87, 105, 91, 114, 94] }, { name: 'Fluxo de Caixa Livre', data: [35, 41, 36, 26, 45, 48, 52, 53, 41] }],
    chart: { type: 'bar', height: 200 },
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' } },
    legend: { show: false },
    colors: ['#113F67', '#58A0C8', '#FDF5AA'],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: { categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'] },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: function (val) { return 'R$ ' + val.toFixed(2); } } },
};

const initialMostSoldData = generateMostSoldProductsData();
const mostSoldProductsChartOptions = {
    series: [{ data: initialMostSoldData.seriesData }],
    chart: { type: 'bar', height: 200, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: false },
    colors: ['#113F67'],
    xaxis: { categories: initialMostSoldData.categories },
    grid: { show: false },
    tooltip: { y: { formatter: function (val) { return val + ' unidades vendidas'; } } },
};

// NOVO: Opções para o gráfico de Quantidade de Vendas por Turno
const initialSalesQuantityData = getSalesQuantityPerTurnData();
const salesQuantityChartOptions = {
    series: [{ name: 'Unidades Vendidas', data: initialSalesQuantityData.seriesData }],
    chart: { height: 200, type: 'line', toolbar: { show: false } }, // Usando gráfico de linha para mostrar evolução no tempo
    stroke: { curve: 'smooth' },
    colors: ['#800080'], // Nova cor (roxo) para este gráfico
    dataLabels: { enabled: false },
    xaxis: {
        categories: initialSalesQuantityData.categories,
        title: { text: 'Turno' }
    },
    yaxis: {
        title: { text: 'Unidades Vendidas' },
        min: 0
    },
    grid: { borderColor: '#e7e7e7', row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 } },
    tooltip: { y: { formatter: function (val) { return val + ' unidades'; } } },
};


function initializeCharts() {
    console.log('Iniciando inicialização dos gráficos...');
    if (typeof ApexCharts !== 'undefined') {
        if (!visitorsChart) {
            visitorsChart = new ApexCharts(document.querySelector("#visitors-chart-container"), visitorsChartOptions);
            visitorsChart.render();
            console.log('Gráfico de Visitantes inicializado.');
        }
        if (!salesChart) {
            salesChart = new ApexCharts(document.querySelector("#sales-chart-container"), salesChartOptions);
            salesChart.render();
            console.log('Gráfico de Vendas inicializado.');
        }
        if (!mostSoldProductsChart) {
            const mostSoldContainer = document.querySelector("#most-sold-products-chart-container");
            if (mostSoldContainer) {
                mostSoldProductsChart = new ApexCharts(mostSoldContainer, mostSoldProductsChartOptions);
                mostSoldProductsChart.render();
                console.log('Gráfico de Produtos Mais Vendidos inicializado.');
            } else {
                console.error('Contêiner para o gráfico de Produtos Mais Vendidos não encontrado!');
            }
        }
        // NOVO: Inicializa o gráfico de Quantidade de Vendas por Turno
        if (!salesQuantityChart) {
            const salesQuantityContainer = document.querySelector("#sales-quantity-chart-container");
            if (salesQuantityContainer) {
                salesQuantityChart = new ApexCharts(salesQuantityContainer, salesQuantityChartOptions);
                salesQuantityChart.render();
                console.log('Gráfico de Quantidade de Vendas por Turno inicializado.');
            } else {
                console.error('Contêiner para o gráfico de Quantidade de Vendas por Turno não encontrado!');
            }
        }
    } else {
        console.warn('ApexCharts não está disponível. Gráficos não serão renderizados.');
    }
}

// Event Listeners Globais (MANTENHA)
document.addEventListener('DOMContentLoaded', () => {
    updateAllPages();
    initializeCharts();

    document.getElementById('advance-turn-btn').addEventListener('click', () => {
        advanceTurn();
        updateAllPages();
    });

    document.querySelectorAll('.app-sidebar .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.currentTarget.dataset.page;
            if (pageId) {
                navigateTo(pageId);
            }
        });
    });

    document.getElementById('reset-game-btn').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja reiniciar o jogo? Todo o progresso será perdido.')) {
            resetGame();
            updateAllPages();
            navigateTo('dashboard');
        }
    });

    document.getElementById('export-game-btn').addEventListener('click', exportGame);

    document.getElementById('import-game-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importGame(file)
                .then(() => {
                    alert('Jogo importado com sucesso!');
                    updateAllPages();
                    navigateTo('dashboard');
                })
                .catch(error => {
                    alert('Erro ao importar o jogo: ' + error);
                    console.error('Erro de importação:', error);
                });
        }
        e.target.value = null;
    });
});