/**
 * EXPORTS — RELATÓRIO SIMPLES DA SAÚDE (padrão Diário Oficial / LC 141/2012)
 * ----------------------------------------------------------------------------
 * Reaproveita o MESMO container #relatorio-simples e o mesmo CSS da Educação.
 * Os agrupamentos por tributo vêm de config.gruposReceitaSaude.
 */
SIOPEApp.exports.gerarRelatorioSimplesSaude = function (btn) {
    const h = SIOPEApp.exports.helpers, core = SIOPEApp.core, u = SIOPEApp.utils, { state } = SIOPEApp;
    const restaurar = h.bloquearBotao(btn);
    const fmt = u.fmtMoeda;

    const rp = core.procReceitasSaude(state.receitas);
    const dp = core.procDespesasSaude(state.despesas);
    const pct = v => u.fmtPct(core.pctAplicacaoSaude(v, rp.totImp));

    // Uma linha por tributo do bloco (Municipal = 1112/1113/1114; Estado = 1721).
    const linhaGrupo = (rotulo, valor) => `<tr><td colspan="2">${rotulo}</td><td class="rs-val">${fmt(valor)}</td></tr>`;
    const linhasDoBloco = (itens, prefixosBloco) => SIOPEApp.config.gruposReceitaSaude
        .filter(g => prefixosBloco.some(p => g.prefixo.startsWith(p)))
        .map(g => linhaGrupo(g.rotulo, u.somarPorPrefixo(itens, g.prefixo)))
        .join('');

    const html = `
                <div class="rs-doc">
                    ${h.cabecalhoSimples(SIOPEApp.config.relatorios.secretaria.saude)}

                    <div class="rs-bar">REF: ${h.obterPeriodo()}</div>
                    <div class="rs-bar rs-bar-grande">SAÚDE</div>
                    <div class="rs-subtitulo">
                        AÇÕES E SERVIÇOS PÚBLICOS EM SAÚDE<br>
                        LEI COMPLEMENTAR FEDERAL N.º 141/2012
                    </div>

                    <div class="rs-secao">IMPOSTOS E TRANSFERÊNCIAS</div>
                    <table class="rs-tabela">
                        <tr class="rs-grupo"><td colspan="3">MUNICIPAL</td></tr>
                        ${linhasDoBloco(rp.mun.i, ['1112', '1113', '1114'])}
                        <tr class="rs-total"><td colspan="2">TOTAL MUNICIPAL</td><td class="rs-val">${fmt(rp.mun.t)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DA UNIÃO</td></tr>
                        ${linhaGrupo('FPM', rp.uniao.t)}

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DO ESTADO</td></tr>
                        ${linhasDoBloco(rp.est.i, ['1721'])}
                        <tr class="rs-total"><td colspan="2">TOTAL ESTADO</td><td class="rs-val">${fmt(rp.est.t)}</td></tr>

                        <tr class="rs-total rs-total-escuro"><td colspan="2">TOTAL IMPOSTOS E TRANSFERÊNCIAS</td><td class="rs-val">${fmt(rp.totImp)}</td></tr>
                        <tr class="rs-formula"><td colspan="2"><em>APLICAÇÃO OBRIGATÓRIA - 15% (A)</em></td><td class="rs-val">${fmt(rp.aplicObrigA)}</td></tr>
                        <tr class="rs-formula"><td colspan="2"><em>RENDIMENTO DE APLICAÇÃO FINANCEIRA - 15% (B)</em></td><td class="rs-val">${fmt(rp.rendApFin.t)}</td></tr>
                        <tr class="rs-total rs-total-escuro"><td colspan="2">APLICAÇÃO MÍNIMA OBRIGATÓRIA - RECURSOS PRÓPRIOS (A) + (B)</td><td class="rs-val">${fmt(rp.aplicMinima)}</td></tr>
                    </table>

                    <div class="rs-secao">DESPESAS CONSIDERADAS NA APLICAÇÃO OBRIGATÓRIA</div>
                    <table class="rs-tabela rs-tabela-3col">
                        <tr class="rs-cabecalho-col"><td>VÍNCULO</td><td>EMPENHADO</td><td>LIQUIDADO</td><td>PAGO</td></tr>
                        ${h.linhaELP('Saúde Geral', dp.saudeGeral, fmt)}
                        ${h.linhaELP('PERCENTUAL DE APLICAÇÃO', dp.saudeGeral, pct, 'rs-pct rs-pct-total')}
                    </table>

                    <p class="rs-footer">Documento gerado eletronicamente em ${h.dataGeracao()} — Módulo SAÚDE (LC-141/2012)</p>
                </div>
            `;

    h.imprimirRelatorioSimples(html, restaurar);
};
