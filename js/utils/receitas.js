/**
 * AJUDANTES ESPECÍFICOS DE RECEITAS
 */
Object.assign(SIOPEApp.utils, {
    /**
     * Retorna o nome oficial (config.nomenclaturaReceitas) para o código
     * informado; se o código não estiver mapeado, devolve a descrição do CSV.
     */
    resolverDescricaoReceita(codigo, descricaoCsv) {
        const u = SIOPEApp.utils;
        const alvo = u.normalizarCod(codigo);
        const mapa = SIOPEApp.config.nomenclaturaReceitas;
        for (const cod in mapa) {
            if (u.normalizarCod(cod) === alvo) return mapa[cod];
        }
        return descricaoCsv;
    },

    /**
     * Soma o "Valor Receita" de todos os itens cujo Nat.Despesa comece pelo
     * prefixo informado (sem pontos). Usado pelo Relatório Simples da Saúde.
     */
    somarPorPrefixo(itens, prefixo) {
        const u = SIOPEApp.utils;
        const alvo = u.normalizarCod(prefixo);
        return itens
            .filter(i => u.normalizarCod(i['Nat.Despesa']).startsWith(alvo))
            .reduce((soma, i) => soma + u.limparNum(i['Valor Receita']), 0);
    }
});
