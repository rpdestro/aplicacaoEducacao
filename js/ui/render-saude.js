/**
 * UI — RENDERIZAÇÃO DO MÓDULO SAÚDE (LC 141/2012)
 * Isolado de propósito: nada aqui mexe no código de Educação, e vice-versa.
 * Sempre calcula sobre a base COMPLETA (state.receitas/despesas).
 */
SIOPEApp.ui.renderizarSaude = function () {
    const ui = SIOPEApp.ui, core = SIOPEApp.core, { state } = SIOPEApp;
    const fmt = SIOPEApp.utils.fmtMoeda, fmtP = SIOPEApp.utils.fmtPct;

    const rp = core.procReceitasSaude(state.receitas);
    const dp = core.procDespesasSaude(state.despesas);

    // Impostos e Transferências
    ui.setGrupoReceita('saude-mun', rp.mun);
    ui.setGrupoReceita('saude-uni', rp.uniao);
    ui.setGrupoReceita('saude-est', rp.est);
    ui.setTxt('saude-tot-imp-val', fmt(rp.totImp));

    // Aplicação Mínima Obrigatória
    ui.setTxt('saude-apl-obr-val', fmt(rp.aplicObrigA));
    ui.setTxt('saude-rend-val', fmt(rp.rendApFin.t));
    ui.setTxt('saude-apl-min-val', fmt(rp.aplicMinima));

    // Despesas (Saúde Geral) e percentuais de aplicação
    ui.setTxt('saude-desp-emp-val', fmt(dp.saudeGeral.e));
    ui.setTxt('saude-desp-liq-val', fmt(dp.saudeGeral.l));
    ui.setTxt('saude-desp-pag-val', fmt(dp.saudeGeral.p));
    ui.setELP('saude-pct', dp.saudeGeral, v => fmtP(core.pctAplicacaoSaude(v, rp.totImp)));

    ui.graficosSaude(rp);
};
