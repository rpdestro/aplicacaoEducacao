/**
 * UI — RENDERIZAÇÃO DO MÓDULO EDUCAÇÃO
 * Chama o core, recebe os totais e escreve na tela. Nenhum cálculo de
 * regra de negócio fica aqui.
 */
Object.assign(SIOPEApp.ui, {

    /** Redesenha tudo do módulo Educação (Receitas + Despesas + gráficos). */
    renderizar() {
        const rp = SIOPEApp.ui.renderizarReceitas();
        const dp = SIOPEApp.ui.renderizarDespesas(rp);
        SIOPEApp.ui.graficos(rp, dp);
    },

    renderizarReceitas() {
        const ui = SIOPEApp.ui, fmt = SIOPEApp.utils.fmtMoeda;
        const rFilt = SIOPEApp.core.filtrar('receitas');
        ui.renderizarLinhasReceitas(rFilt);

        const rp = SIOPEApp.core.procReceitas(rFilt);
        ui.setGrupoReceita('rec-mun', rp.mun);
        ui.setGrupoReceita('rec-uni', rp.uniao);
        ui.setGrupoReceita('rec-est', rp.est);
        ui.setTxt('rec-tot-imp-val', fmt(rp.totImp));
        ui.setTxt('rec-apl-obr-val', fmt(rp.aplObr)); ui.setTbd('rec-apl-obr-tbd', []);
        ui.setGrupoReceita('rec-ded', rp.ded);
        ui.setTxt('rec-apl-min-val', fmt(rp.aplMin));
        ui.setGrupoReceita('rec-fun-pri', rp.fun);
        ui.setGrupoReceita('rec-fun-et', rp.funET);
        ui.setGrupoReceita('rec-apl-fin', rp.aplFin);
        ui.setGrupoReceita('rec-fnd', rp.fnde);
        ui.setGrupoReceita('rec-est-tra', rp.estTra);
        ui.setTxt('rec-tot-adi-val', fmt(rp.totAdi));
        return rp;
    },

    renderizarDespesas(rp) {
        const ui = SIOPEApp.ui, core = SIOPEApp.core;
        const fmt = SIOPEApp.utils.fmtMoeda, fmtP = SIOPEApp.utils.fmtPct;
        const dFilt = core.filtrar('despesas');
        ui.renderizarLinhasDespesas(dFilt);

        const dp = core.procDespesas(dFilt);
        const pctF = v => fmtP(core.pctFundeb(v));

        // Matriz FUNDEB (valores e percentuais)
        ui.setELP('f-261', dp.v261, fmt);
        ui.setELP('f-262', dp.v262, fmt);
        ui.setELP('f-tot', dp.totFundeb, fmt);
        ui.setELP('fp-261', dp.v261, pctF);
        ui.setELP('fp-262', dp.v262, pctF);
        ui.setELP('fp-tot', dp.totFundeb, pctF);

        // FUNDEB - ETI
        const eti = core.procETI(dFilt);
        ui.setELP('eti-261', eti.e261, fmt);
        ui.setELP('eti-262', eti.e262, fmt);
        ui.setELP('eti-tot', eti.tot, fmt);

        // Resumo da Aplicação Obrigatória (25%)
        const t = dp.totSubfuncoes;
        const pctA = v => fmtP(core.pctAplicacaoEducacao(v, rp.aplMin));
        ui.setTxt('res-emp-val', fmt(t.e)); ui.setTxt('res-emp-pct', pctA(t.e));
        ui.setTxt('res-liq-val', fmt(t.l)); ui.setTxt('res-liq-pct', pctA(t.l));
        ui.setTxt('res-pag-val', fmt(t.p)); ui.setTxt('res-pag-pct', pctA(t.p));

        // Detalhamento por Função/Subfunção
        ui.setELP('d-12122', dp.i122, fmt);
        ui.setELP('d-12361', dp.i361, fmt);
        ui.setELP('d-12365', dp.i365, fmt);
        ui.setELP('d-12367', dp.i367, fmt);
        return dp;
    }
});
