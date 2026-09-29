/**
 * CORE — MÓDULO SAÚDE (LC 141/2012)
 * ----------------------------------------------------------------------------
 * Recebe SEMPRE a base COMPLETA (state.receitas/despesas): a Saúde não usa
 * os filtros de coluna da "Base de Dados" de Educação, pois seu recorte já é
 * definido pelas regras fixas de config/saude.js. Usar aqueles filtros aqui
 * geraria números incoerentes com o Demonstrativo oficial.
 */
Object.assign(SIOPEApp.core, {

    procReceitasSaude(dados) {
        const u = SIOPEApp.utils;
        const cfg = SIOPEApp.config.modulos.saude;
        const r = { mun: { i: [], t: 0 }, uniao: { i: [], t: 0 }, est: { i: [], t: 0 }, rendApFin: { i: [], t: 0 } };

        dados.forEach(item => {
            const nat = String(item['Nat.Despesa'] || '').trim();
            const nC = u.normalizarCod(nat);
            const val = u.limparNum(item['Valor Receita']);
            const vinc = String(item['Vínculo (Receita)'] || '').trim();

            if (nC.startsWith('1112') || nC.startsWith('1113') || nC.startsWith('1114')) { r.mun.i.push(item); r.mun.t += val; }
            else if (nC === cfg.codigoFpmPrincipal) { r.uniao.i.push(item); r.uniao.t += val; }
            else if (nat.startsWith('1721.50') || nat.startsWith('1721.51') || nat.startsWith('1721.52') || nC.startsWith('172150') || nC.startsWith('172151') || nC.startsWith('172152')) { r.est.i.push(item); r.est.t += val; }

            // Rendimento de Aplicação Financeira (B): receita com o mesmo
            // vínculo "310" usado na despesa. Normalmente 0,00.
            if (vinc.startsWith(cfg.vinculoRendimentoAplicacao)) { r.rendApFin.i.push(item); r.rendApFin.t += val; }
        });

        r.totImp = r.mun.t + r.uniao.t + r.est.t;
        r.aplicObrigA = r.totImp * cfg.percentualMinimo;
        r.aplicMinima = r.aplicObrigA + r.rendApFin.t;
        return r;
    },

    procDespesasSaude(dados) {
        const u = SIOPEApp.utils;
        const cfg = SIOPEApp.config.modulos.saude.despesa;
        const d = { saudeGeral: { e: 0, l: 0, p: 0 } };

        dados.forEach(item => {
            const funcao = String(item['Função'] || '').trim();
            const subf = String(item['Subfunção'] || '').trim();
            const orgao = String(item['Órgão'] || '').trim();
            const vinc = String(item['Vínculo'] || '').trim();
            const fonte = String(item['Fonte'] || '').trim().replace(/^0+/, '');

            const bate = funcao === cfg.funcao &&
                         subf.startsWith(cfg.prefixoSubfuncao) &&
                         orgao === cfg.orgao &&
                         fonte === cfg.fonte &&
                         vinc.startsWith(cfg.prefixoVinculo);

            if (bate) {
                d.saudeGeral.e += u.limparNum(item['Valor Empenhado']);
                d.saudeGeral.l += u.limparNum(item['Valor Liquidado']);
                d.saudeGeral.p += u.limparNum(item['Valor Pago']);
            }
        });
        return d;
    },

    /**
     * Percentual de Aplicação = despesa ÷ TOTAL DE IMPOSTOS E TRANSFERÊNCIAS
     * (não é ÷ pela aplicação mínima) — validado contra o Demonstrativo
     * oficial (35,96% / 32,21% / 30,92%).
     */
    pctAplicacaoSaude(valor, totImp) {
        return totImp > 0 ? (valor / totImp) * 100 : 0;
    }
});
