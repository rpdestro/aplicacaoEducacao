/**
 * MÓDULO EDUCAÇÃO (MDE - Art. 212 CF) — parâmetros e códigos fixos.
 * ----------------------------------------------------------------------------
 * Antes estes valores estavam "soltos" dentro das funções de cálculo.
 * Centralizados aqui, qualquer ajuste de regra fica em um só lugar.
 */
SIOPEApp.config.modulos = SIOPEApp.config.modulos || {};

SIOPEApp.config.modulos.educacao = {
    percentualMinimo: 0.25, // Art. 212 da CF

    receitas: {
        // Receita da Aplicação Financeira (receitas adicionais)
        codigosAplicacaoFinanceira: [
            '1321.01.1.1.02.01', '1321.01.1.1.02.02', '1321.01.1.1.02.04',
            '1321.01.1.1.02.05', '1321.01.1.1.02.08', '1321.01.1.1.02.11'
        ],
        // Transferências do Estado destinadas ao Ensino
        codigosTransferenciasEstado: ['1724.51.0.1.02.00', '1724.51.0.1.03.00']
    },

    despesas: {
        // Vínculos considerados na aplicação obrigatória de 25% (Fonte 1)
        vinculosPermitidos: ['200.012', '210.000', '220.000', '240.000']
    }
};
