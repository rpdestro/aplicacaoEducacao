/**
 * CORE — MÓDULO EDUCAÇÃO (MDE - Art. 212 CF / FUNDEB)
 * ----------------------------------------------------------------------------
 * Funções PURAS de cálculo: recebem linhas e devolvem totais. Não tocam no
 * DOM — quem desenha é js/ui/render-educacao.js.
 */
Object.assign(SIOPEApp.core, {

    /** Classifica e soma as receitas nos grupos do demonstrativo. */
    procReceitas(dados) {
        const u = SIOPEApp.utils;
        const cfg = SIOPEApp.config.modulos.educacao;
        const r = { mun: { i: [], t: 0 }, uniao: { i: [], t: 0 }, est: { i: [], t: 0 }, ded: { i: [], t: 0 },
                    fun: { i: [], t: 0 }, funET: { i: [], t: 0 }, aplFin: { i: [], t: 0 }, fnde: { i: [], t: 0 }, estTra: { i: [], t: 0 } };

        const codA = cfg.receitas.codigosAplicacaoFinanceira;
        const codAC = codA.map(c => c.replace(/\./g, ''));
        const codE = cfg.receitas.codigosTransferenciasEstado;
        const codEC = codE.map(c => c.replace(/\./g, ''));

        dados.forEach(item => {
            const nat = String(item['Nat.Despesa'] || '').trim();
            const nC = nat.replace(/\./g, '');
            const val = u.limparNum(item['Valor Receita']);

            // Impostos e transferências (grupos exclusivos entre si)
            if (nC.startsWith('1112') || nC.startsWith('1113') || nC.startsWith('1114')) { r.mun.i.push(item); r.mun.t += val; }
            else if (nC.startsWith('1711')) { r.uniao.i.push(item); r.uniao.t += val; }
            else if (nat.startsWith('1721.50') || nat.startsWith('1721.51') || nat.startsWith('1721.52') || nC.startsWith('172150') || nC.startsWith('172151') || nC.startsWith('172152')) { r.est.i.push(item); r.est.t += val; }

            // Demais grupos (independentes)
            if (nC.startsWith('9510')) { r.ded.i.push(item); r.ded.t += val; }
            if (nat.startsWith('1751.50') || nC.startsWith('175150') || nat.includes('1321.01.1.1.02.06') || nC.includes('132101110206')) { r.fun.i.push(item); r.fun.t += val; }
            if (nat.includes('1715.53.0.1.01.00') || nC.includes('171553010100')) { r.funET.i.push(item); r.funET.t += val; }
            if (codA.includes(nat) || codAC.includes(nC)) { r.aplFin.i.push(item); r.aplFin.t += val; }
            if (nat.startsWith('1714') || nC.startsWith('1714')) { r.fnde.i.push(item); r.fnde.t += val; }
            if (codE.includes(nat) || codEC.includes(nC)) { r.estTra.i.push(item); r.estTra.t += val; }
        });

        // Efeito colateral mantido do original: base dos percentuais 261/262
        SIOPEApp.state.fundebTotal = r.fun.t > 0 ? r.fun.t : 1;

        r.totImp = r.mun.t + r.uniao.t + r.est.t;
        r.aplObr = r.totImp * cfg.percentualMinimo;
        r.aplMin = r.aplObr - Math.abs(r.ded.t);
        r.totAdi = r.aplFin.t + r.fnde.t + r.estTra.t;
        return r;
    },

    /** Soma despesas por subfunção (Fonte 1) e por vínculo FUNDEB 261/262. */
    procDespesas(dados) {
        const u = SIOPEApp.utils;
        const vPerm = SIOPEApp.config.modulos.educacao.despesas.vinculosPermitidos;
        const d = { i122: { e: 0, l: 0, p: 0 }, i361: { e: 0, l: 0, p: 0 }, i365: { e: 0, l: 0, p: 0 }, i367: { e: 0, l: 0, p: 0 },
                    v261: { e: 0, l: 0, p: 0 }, v262: { e: 0, l: 0, p: 0 } };
        const somar = (alvo, e, l, p) => { alvo.e += e; alvo.l += l; alvo.p += p; };

        dados.forEach(item => {
            const f = String(item['Função/SubFunção'] || '').trim();
            const fnt = String(item['Fonte'] || '').trim().replace(/^0+/, '');
            const v = String(item['Vínculo'] || '').trim();

            const isF1 = fnt === '1' || fnt.startsWith('1 ') || fnt.startsWith('1-');
            const isV = vPerm.some(vp => v.includes(vp));
            const e = u.limparNum(item['Valor Empenhado']);
            const l = u.limparNum(item['Valor Liquidado']);
            const p = u.limparNum(item['Valor Pago']);
            const fSemPonto = f.replace(/\./g, '');

            if (isF1 && isV) {
                if (f.includes('12.122') || fSemPonto.includes('12122')) somar(d.i122, e, l, p);
                else if (f.includes('12.361') || fSemPonto.includes('12361')) somar(d.i361, e, l, p);
                else if (f.includes('12.365') || fSemPonto.includes('12365')) somar(d.i365, e, l, p);
                else if (f.includes('12.367') || fSemPonto.includes('12367')) somar(d.i367, e, l, p);
            }
            if (v.includes('261.000')) somar(d.v261, e, l, p);
            else if (v.includes('262.000')) somar(d.v262, e, l, p);
        });

        // Totais derivados (antes recalculados em vários lugares da UI)
        d.totSubfuncoes = u.somarELP(d.i122, d.i361, d.i365, d.i367);
        d.totFundeb = u.somarELP(d.v261, d.v262);
        return d;
    },

    /** FUNDEB - ETI: despesas dos vínculos 261.0004 e 262.0004. */
    procETI(dados) {
        const u = SIOPEApp.utils;
        const e = { e261: { e: 0, l: 0, p: 0 }, e262: { e: 0, l: 0, p: 0 } };
        dados.forEach(item => {
            const v = String(item['BW'] || item['Vínculo'] || item['CA Codigo'] || '').trim();
            const emp = u.limparNum(item['Valor Empenhado']);
            const liq = u.limparNum(item['Valor Liquidado']);
            const pgo = u.limparNum(item['Valor Pago']);
            if (v.includes('261.004') || v.includes('261.0004')) { e.e261.e += emp; e.e261.l += liq; e.e261.p += pgo; }
            else if (v.includes('262.004') || v.includes('262.0004')) { e.e262.e += emp; e.e262.l += liq; e.e262.p += pgo; }
        });
        e.tot = u.somarELP(e.e261, e.e262);
        return e;
    },

    /** % de aplicação em MDE: (valor × 25) ÷ aplicação mínima. */
    pctAplicacaoEducacao(valor, aplMin) {
        return aplMin > 0 ? (valor * 25) / aplMin : 0;
    },

    /** % de um valor sobre o total FUNDEB recebido (state.fundebTotal). */
    pctFundeb(valor) {
        const total = SIOPEApp.state.fundebTotal;
        return total > 0 ? (valor / total) * 100 : 0;
    }
});
