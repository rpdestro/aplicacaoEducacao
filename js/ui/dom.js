/**
 * UI — AJUDANTES BÁSICOS DE DOM
 * Pequenas funções reutilizadas por todos os renderizadores.
 */
Object.assign(SIOPEApp.ui, {
    /** Escreve texto em um elemento pelo id (ignora se não existir). */
    setTxt(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    },

    /** Preenche um <tbody> com linhas código | descrição | valor de receita. */
    setTbd(id, itens) {
        const u = SIOPEApp.utils;
        const el = document.getElementById(id); if (!el) return;
        if (!itens || !itens.length) { el.innerHTML = '<tr><td colspan="3" class="col-empty">Nenhum lançamento encontrado para esta regra.</td></tr>'; return; }
        el.innerHTML = itens.map(i => `<tr><td class="col-nat">${i['Nat.Despesa'] || ''}</td><td class="col-desc">${i['Descrição'] || ''}</td><td class="col-val">${u.fmtMoeda(u.limparNum(i['Valor Receita']))}</td></tr>`).join('');
    },

    /**
     * Preenche um trio Empenhado/Liquidado/Pago.
     * Ex.: setELP('d-12122', dados, fmtMoeda) → d-12122-emp / -liq / -pag
     */
    setELP(prefixoId, valores, formatador) {
        SIOPEApp.ui.setTxt(`${prefixoId}-emp`, formatador(valores.e));
        SIOPEApp.ui.setTxt(`${prefixoId}-liq`, formatador(valores.l));
        SIOPEApp.ui.setTxt(`${prefixoId}-pag`, formatador(valores.p));
    },

    /** Preenche o valor total (#id-val) e a tabela (#id-tbd) de um grupo de receita. */
    setGrupoReceita(prefixoId, grupo) {
        SIOPEApp.ui.setTxt(`${prefixoId}-val`, SIOPEApp.utils.fmtMoeda(grupo.t));
        SIOPEApp.ui.setTbd(`${prefixoId}-tbd`, grupo.i);
    }
});
