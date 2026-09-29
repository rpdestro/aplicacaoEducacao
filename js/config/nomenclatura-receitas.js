/**
 * NOMENCLATURA OFICIAL DAS RECEITAS (por código Nat.Despesa)
 * ----------------------------------------------------------------------------
 * Substitui a "Descrição" que vem do CSV quando o código bate com algum item
 * aqui. Códigos são comparados sem pontuação (utils.normalizarCod), então
 * "1112.50.0.1.00.00" = "1112500100000".
 * Para adicionar, corrigir ou remover nomenclaturas, edite apenas este arquivo.
 */
SIOPEApp.config.nomenclaturaReceitas = {
    // --- Impostos municipais ---
    '1112.01.1.1.00.00': 'ITR - MUNICÍPIOS CONVENIADOS - PRINCIPAL',
    '1112.50.0.1.00.00': 'IPTU - PRINCIPAL',
    '1112.50.0.2.00.00': 'IPTU - MULTAS E JUROS',
    '1112.50.0.3.00.00': 'IPTU - DÍVIDA ATIVA',
    '1112.50.0.4.00.00': 'IPTU - DÍVIDA ATIVA - MULTAS E JUROS',
    '1112.53.0.1.00.00': 'ITBI - PRINCIPAL',
    '1112.53.0.2.00.00': 'ITBI - MULTAS E JUROS',
    '1112.53.0.3.00.00': 'ITBI - DÍVIDA ATIVA',
    '1112.53.0.4.00.00': 'ITBI - DÍVIDA ATIVA - MULTAS E JUROS',
    '1113.03.1.1.00.00': 'IRRF - TRABALHO - PRINCIPAL',
    '1113.03.4.1.00.00': 'IRRF - OUTROS RENDIMENTOS - PRINCIPAL',
    '1114.51.1.1.01.00': 'ISSQN - NORMAL',
    '1114.51.1.1.02.00': 'ISSQN - SIMPLES NACIONAL',
    '1114.51.1.1.03.00': 'ISSQN - STN',
    '1114.51.1.2.00.00': 'ISSQN - MULTAS E JUROS',
    '1114.51.1.3.00.00': 'ISSQN - DÍVIDA ATIVA',
    '1114.51.1.4.00.00': 'ISSQN - DÍVIDA ATIVA - MULTAS E JUROS',

    // --- Transferências da União ---
    '1711.51.1.1.00.00': 'COTA-PARTE FPM MENSAL - PRINCIPAL',
    '1711.51.2.1.01.01': 'COTA-PARTE FPM MENSAL – 1% JULHO',
    '1711.51.2.1.01.02': 'COTA-PARTE FPM MENSAL – 1% SETEMBRO',
    '1711.51.2.1.01.03': 'COTA-PARTE FPM MENSAL – 1% DEZEMBRO',

    // --- Transferências do Estado ---
    '1721.50.0.1.00.00': 'COTA-PARTE ICMS - PRINCIPAL',
    '1721.51.0.1.00.00': 'COTA-PARTE IPVA - PRINCIPAL',
    '1721.52.0.1.00.00': 'COTA-PARTE IPI – PRINCIPAL',

    // --- Deduções para formação do FUNDEB ---
    '9510.00.0.0.00.01': 'ITR',
    '9510.00.0.0.00.02': 'FPM',
    '9510.00.0.0.00.03': 'COTA-PARTE - ICMS',
    '9510.00.0.0.00.04': 'COTA-PARTE - IPVA',
    '9510.00.0.0.00.05': 'COTA-PARTE - IPI',

    // --- FUNDEB, FNDE e receitas adicionais ---
    '1321.01.1.1.02.06': 'RENDIMENTO DE APLICAÇÃO FINANCEIRA - FUNDEB',
    '1751.50.0.1.00.00': 'TRANSFERÊNCIA DE RECURSOS FNDE FUNDEB - PRINCIPAL',
    '1715.53.0.1.01.00': 'TRANSFERÊNCIA DE RECURSOS FUNDEB DESTINADOS À CRIAÇÃO DE MATRÍCULAS - ETI',
    '1321.01.1.1.02.01': 'SALÁRIO EDUCAÇÃO',
    '1321.01.1.1.02.02': 'MERENDA ESCOLAR - ESTADO',
    '1321.01.1.1.02.04': 'PNAE - PROGRAMA NACIONAL DE ALIMENTAÇÃO ESCOLAR',
    '1321.01.1.1.02.05': 'PNATE - PROGRAMA NACIONAL DE TRANSPORTE ESCOLAR',
    '1321.01.1.1.02.08': 'APM - ERASMINA GOBETTE',
    '1321.01.1.1.02.11': 'CONVÊNIO TRANSPORTE ESCOLAR - SEDUC',
    '1714.50.0.1.00.00': 'SALÁRIO EDUCAÇÃO - PRINCIPAL',
    '1714.52.0.1.01.00': 'PNAEF',
    '1714.52.0.1.02.00': 'PNAEM',
    '1714.52.0.1.03.00': 'PNAE E.J.A',
    '1714.52.0.1.04.00': 'PNAEC',
    '1714.52.0.1.05.00': 'PNAEP',
    '1714.52.0.1.06.00': 'PNAE AEE',
    '1714.53.0.1.01.00': 'PNATE - ENSINO FUNDAMENTAL',
    '1714.53.0.1.02.00': 'PNATE - ENSINO MÉDIO',
    '1714.53.0.1.03.00': 'PNATE - ENSINO INFANTIL',
    '1714.99.0.1.02.00': 'OUTRAS TRANSFERÊNCIAS DIRETAS - FNDE',
    '1724.51.0.1.02.00': 'CONVÊNIO - ALIMENTAÇÃO ESCOLAR',
    '1724.51.0.1.03.00': 'CONVÊNIO - TRANSPORTE ESCOLAR - SEDUC'
};
