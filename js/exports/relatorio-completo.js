/**
 * EXPORTS — RELATÓRIO COMPLETO (com gráficos) — Educação e Saúde
 * ----------------------------------------------------------------------------
 * A classe body.gerando-relatorio-completo (css/reports/relatorio-completo.css)
 * é aplicada ANTES do window.print(), e não só via @media print: os gráficos
 * (Chart.js) precisam medir e desenhar no tamanho FINAL enquanto a página
 * ainda está rodando normalmente. Se o tamanho só mudasse durante a
 * impressão (que trava a thread principal), o gráfico saía deformado.
 */
Object.assign(SIOPEApp.exports, {

    /** Educação: imprime Receitas + Despesas juntas. */
    printReport(btn) {
        const restaurar = SIOPEApp.exports.helpers.bloquearBotao(btn);
        const ui = SIOPEApp.ui;

        const modRec = document.getElementById('modulo-receitas');
        const modDesp = document.getElementById('modulo-despesas');
        const recHidden = modRec.classList.contains('hidden');
        const despHidden = modDesp.classList.contains('hidden');

        // 0. Modo compacto ANTES de mexer nos gráficos (ver comentário acima).
        document.body.classList.add('gerando-relatorio-completo');

        // 1. Mostra ambas as telas em modo Relatório.
        ui.visao('rec', 'relatorio');
        ui.visao('desp', 'relatorio');
        modRec.classList.remove('hidden');
        modDesp.classList.remove('hidden');

        // 2. Com os dois módulos visíveis e já no layout compacto, recria os
        //    gráficos: graficos() só desenha em canvas visível, então o gráfico
        //    da aba inativa poderia sair em branco no PDF sem este passo.
        ui.renderizar();

        // 3. Dá tempo do Chart.js terminar o redesenho antes de imprimir.
        setTimeout(() => {
            restaurar();
            window.print();

            // 4. Restaura o estado anterior.
            document.body.classList.remove('gerando-relatorio-completo');
            if (recHidden) modRec.classList.add('hidden');
            if (despHidden) modDesp.classList.add('hidden');
            ui.abas(recHidden ? 'despesas' : 'receitas');
        }, 500);
    },

    /**
     * Saúde: o painel é um bloco único. A classe "imprimindo-saude" tira o
     * container de Educação do fluxo de impressão (ver css/print.css).
     */
    printReportSaude(btn) {
        const restaurar = SIOPEApp.exports.helpers.bloquearBotao(btn);

        document.body.classList.add('gerando-relatorio-completo', 'imprimindo-saude');
        SIOPEApp.ui.renderizarSaude();

        setTimeout(() => {
            restaurar();
            window.print();
            document.body.classList.remove('gerando-relatorio-completo', 'imprimindo-saude');
        }, 400);
    }
});
