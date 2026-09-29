/**
 * MÓDULO SAÚDE (LC 141/2012) — parâmetros e regras fixas do módulo.
 * ----------------------------------------------------------------------------
 * Usa os MESMOS CSVs de Receita/Despesa do módulo Educação; o que muda
 * é apenas o CRITÉRIO de seleção das linhas e o percentual mínimo.
 * Regras abaixo validadas linha a linha contra o Demonstrativo oficial
 * (REF Jan-Ago/2026): todos os totais batem exatamente.
 */
SIOPEApp.config.modulos = SIOPEApp.config.modulos || {};

SIOPEApp.config.modulos.saude = {
    percentualMinimo: 0.15, // Art. 198, §2º, III da CF / LC 141/2012 (Educação usa 0.25)

    // Receita "União": diferente da Educação (que soma todo código
    // 1711.*), a Saúde considera apenas a parcela PRINCIPAL do FPM.
    codigoFpmPrincipal: '171151110000', // 1711.51.1.1.00.00 (sem pontuação)

    // Despesa "Saúde Geral": uma linha só é considerada na aplicação
    // obrigatória quando TODAS as condições abaixo são verdadeiras.
    despesa: {
        funcao: '10',            // Função de governo "Saúde"
        prefixoSubfuncao: '30',  // Subfunções 10.301 a 10.305 (ações e serviços de saúde)
        orgao: '0206',           // Secretaria Municipal de Saúde — AJUSTAR se houver reorganização administrativa
        fonte: '1',              // Fonte de recursos (coluna FONGRUPO, sem zero à esquerda)
        prefixoVinculo: '310'    // Vínculo/Aplicação "SAÚDE–GERAL" (recursos próprios, Art. 198 CF)
    },

    // Vínculo usado para localizar, na Receita, o "Rendimento de
    // Aplicação Financeira (B)" do Demonstrativo — mesmo prefixo
    // "310" usado na despesa. Soma sempre 0,00 se não houver
    // nenhum lançamento com esse vínculo no período (caso normal).
    vinculoRendimentoAplicacao: '310'
};

/**
 * Agrupamento por "nome do tributo", usado SOMENTE no Relatório Simples
 * (Diário Oficial) da Saúde, para reproduzir fielmente o layout do
 * Demonstrativo oficial (ex: "IPTU" soma principal + multas + dívida
 * ativa em uma única linha). Para adicionar/remover uma linha do
 * relatório, basta editar esta lista — nada mais precisa mudar.
 */
SIOPEApp.config.gruposReceitaSaude = [
    { rotulo: 'ITR MUNICIPALIZADO',           prefixo: '1112.01' },
    { rotulo: 'IPTU',                          prefixo: '1112.50' },
    { rotulo: 'ITBI',                          prefixo: '1112.53' },
    { rotulo: 'IRRF',                          prefixo: '1113' },
    { rotulo: 'ISS',                           prefixo: '1114' },
    { rotulo: 'COTA-PARTE ICMS',               prefixo: '1721.50' },
    { rotulo: 'COTA-PARTE IPVA',               prefixo: '1721.51' },
    { rotulo: 'COTA-PARTE IPI - EXPORTAÇÃO',   prefixo: '1721.52' }
];
