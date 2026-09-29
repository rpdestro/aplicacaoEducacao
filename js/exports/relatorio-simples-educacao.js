/**
 * EXPORTS — RELATÓRIO SIMPLES DA EDUCAÇÃO (padrão Diário Oficial)
 * ----------------------------------------------------------------------------
 * Ficha única (REF / EDUCAÇÃO 25% / IMPOSTOS E TRANSFERÊNCIAS / FUNDEB / ETI),
 * sem gráficos, pensada para caber em 1 (no máximo 2) folhas A4.
 * Respeita os filtros aplicados na Base de Dados.
 */
SIOPEApp.exports.gerarRelatorioSimples = function (btn) {
    const h = SIOPEApp.exports.helpers, core = SIOPEApp.core, u = SIOPEApp.utils;
    const restaurar = h.bloquearBotao(btn);
    const fmt = u.fmtMoeda;

    const rFilt = core.filtrar('receitas');
    const dFilt = core.filtrar('despesas');
    const rp = core.procReceitas(rFilt);
    const dp = core.procDespesas(dFilt);
    const eti = core.procETI(dFilt);

    const pct = v => u.fmtPct(core.pctAplicacaoEducacao(v, rp.aplMin));
    const cP = v => u.fmtPct(core.pctFundeb(v));
    const linhasItens = h.linhasItens;
    const linhaELP = h.linhaELP;

    const html = `
                <div class="rs-doc">
                    ${h.cabecalhoSimples(SIOPEApp.config.relatorios.secretaria.educacao)}

                    <div class="rs-bar">REF: ${h.obterPeriodo()}</div>
                    <div class="rs-bar rs-bar-grande">EDUCAÇÃO 25%</div>
                    <div class="rs-subtitulo">
                        MANUTENÇÃO E DESENVOLVIMENTO DO ENSINO<br>
                        ART. 212 - CONSTITUIÇÃO FEDERAL
                    </div>

                    <div class="rs-secao">IMPOSTOS E TRANSFERÊNCIAS</div>
                    <table class="rs-tabela">
                        <tr class="rs-grupo"><td colspan="3">MUNICIPAL</td></tr>
                        ${linhasItens(rp.mun.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL MUNICIPAL</td><td class="rs-val">${fmt(rp.mun.t)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DA UNIÃO</td></tr>
                        ${linhasItens(rp.uniao.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL UNIÃO</td><td class="rs-val">${fmt(rp.uniao.t)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DO ESTADO</td></tr>
                        ${linhasItens(rp.est.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL ESTADO</td><td class="rs-val">${fmt(rp.est.t)}</td></tr>

                        <tr class="rs-total rs-total-escuro"><td colspan="2">TOTAL IMPOSTOS E TRANSFERÊNCIAS</td><td class="rs-val">${fmt(rp.totImp)}</td></tr>
                        <tr class="rs-formula"><td colspan="2"><em>APLICAÇÃO OBRIGATÓRIA - 25%</em></td><td class="rs-val">${fmt(rp.aplObr)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">DEDUÇÕES PARA FORMAÇÃO FUNDEB</td></tr>
                        ${linhasItens(rp.ded.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL DEDUÇÕES</td><td class="rs-val">${fmt(rp.ded.t)}</td></tr>

                        <tr class="rs-total rs-total-escuro"><td colspan="2">APLICAÇÃO MÍNIMA OBRIGATÓRIA - RECURSOS PRÓPRIOS</td><td class="rs-val">${fmt(rp.aplMin)}</td></tr>
                    </table>

                    <div class="rs-secao">DESPESAS CONSIDERADAS NA APLICAÇÃO OBRIGATÓRIA (FONTE 1)</div>
                    <table class="rs-tabela rs-tabela-3col">
                        <tr class="rs-cabecalho-col"><td>FUNÇÃO / SUBFUNÇÃO</td><td>EMPENHADO</td><td>LIQUIDADO</td><td>PAGO</td></tr>
                        ${linhaELP('12.122 - Admin. Geral', dp.i122, fmt)}
                        ${linhaELP('12.361 - Ensino Fundamental', dp.i361, fmt)}
                        ${linhaELP('12.365 - Educação Infantil', dp.i365, fmt)}
                        ${linhaELP('12.367 - Educação Especial', dp.i367, fmt)}
                        ${linhaELP('TOTAL', dp.totSubfuncoes, fmt, 'rs-total')}
                        ${linhaELP('PERCENTUAL DE APLICAÇÃO', dp.totSubfuncoes, pct, 'rs-pct')}
                    </table>

                    <div class="rs-bar rs-bar-grande">FUNDEB</div>
                    <table class="rs-tabela">
                        ${linhasItens(rp.fun.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL</td><td class="rs-val">${fmt(rp.fun.t)}</td></tr>
                    </table>

                    <table class="rs-tabela rs-tabela-3col">
                        <tr class="rs-cabecalho-col"><td>VÍNCULO</td><td>EMPENHADO</td><td>LIQUIDADO</td><td>PAGO</td></tr>
                        ${linhaELP('261.0000', dp.v261, fmt)}
                        ${linhaELP('262.0000', dp.v262, fmt)}
                        ${linhaELP('TOTAL', dp.totFundeb, fmt, 'rs-total')}
                        ${linhaELP('261.00 (mín. 70%)', dp.v261, cP, 'rs-pct')}
                        ${linhaELP('262.00 (máx. 30%)', dp.v262, cP, 'rs-pct')}
                        ${linhaELP('TOTAL', dp.totFundeb, cP, 'rs-pct rs-pct-total')}
                    </table>

                    <div class="rs-secao">FUNDEB - FOMENTO A MATRÍCULAS ETI (VÍNCULOS 261.0004 / 262.0004)</div>
                    <!-- Receita ETI: apenas informativa (não soma em nenhum total do relatório) -->
                    <table class="rs-tabela">
                        <tr class="rs-grupo"><td colspan="3">RECEITA</td></tr>
                        ${linhasItens(rp.funET.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL RECEITA ETI</td><td class="rs-val">${fmt(rp.funET.t)}</td></tr>
                    </table>
                    <table class="rs-tabela rs-tabela-3col">
                        <tr class="rs-cabecalho-col"><td>VÍNCULO</td><td>EMPENHADO</td><td>LIQUIDADO</td><td>PAGO</td></tr>
                        ${linhaELP('05.261.0004', eti.e261, fmt)}
                        ${linhaELP('05.262.0004', eti.e262, fmt)}
                        ${linhaELP('TOTAL', eti.tot, fmt, 'rs-total')}
                    </table>

                    <div class="rs-secao">RECEITAS ADICIONAIS PARA O FINANCIAMENTO DO ENSINO</div>
                    <table class="rs-tabela">
                        <tr class="rs-grupo"><td colspan="3">RECEITA DA APLICAÇÃO FINANCEIRA</td></tr>
                        ${linhasItens(rp.aplFin.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL RECEITA DA APLICAÇÃO FINANCEIRA</td><td class="rs-val">${fmt(rp.aplFin.t)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DO FNDE</td></tr>
                        ${linhasItens(rp.fnde.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL TRANSFERÊNCIAS DO FNDE</td><td class="rs-val">${fmt(rp.fnde.t)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DO ESTADO (ENSINO)</td></tr>
                        ${linhasItens(rp.estTra.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL TRANSFERÊNCIAS DO ESTADO</td><td class="rs-val">${fmt(rp.estTra.t)}</td></tr>

                        <tr class="rs-total rs-total-escuro"><td colspan="2">TOTAL RECEITAS ADICIONAIS PARA O FINANCIAMENTO DO ENSINO</td><td class="rs-val">${fmt(rp.totAdi)}</td></tr>
                    </table>

                    <p class="rs-footer">Documento gerado eletronicamente em ${h.dataGeracao()} — Módulo EDUCAÇÃO (Art.212-CF/1988)</p>
                </div>
            `;

    h.imprimirRelatorioSimples(html, restaurar);
};
