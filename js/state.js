/**
 * ESTADO GLOBAL DA APLICAÇÃO (STATE)
 * Única fonte de verdade dos dados carregados e das preferências de tela.
 */
SIOPEApp.state = {
    receitas: [],          // linhas do CSV de Receitas (já com nomenclatura oficial)
    despesas: [],          // linhas do CSV de Despesas
    filtros: {},           // { 'rec_Descricao': ['valor1', ...], ... }
    limiteRec: 50,         // paginação da Base de Dados (Receitas)
    limiteDesp: 50,        // paginação da Base de Dados (Despesas)
    chartRecInst: null,    // instâncias Chart.js (destruídas antes de redesenhar)
    chartDespInst: null,
    chartSaudeInst: null,
    fundebTotal: 1         // base de cálculo dos percentuais 261/262
};

/** Volta a paginação ao valor inicial (usado após filtrar/limpar/carregar). */
SIOPEApp.state.resetarPaginacao = function () {
    SIOPEApp.state.limiteRec = 50;
    SIOPEApp.state.limiteDesp = 50;
};
