/**
 * EXPORTS — AJUDANTES COMPARTILHADOS
 * ----------------------------------------------------------------------------
 * Trechos que antes se repetiam em todas as funções de relatório:
 * travar o botão durante o preparo, ler o período selecionado, montar o
 * cabeçalho do Relatório Simples e disparar a impressão dele.
 */
SIOPEApp.exports.helpers = {

    /**
     * Mostra "⏳ ..." e desabilita o botão. Retorna uma função que devolve o
     * texto original e reabilita. Funciona mesmo sem botão (btn = null).
     */
    bloquearBotao(btn, texto = '⏳ Preparando...') {
        if (!btn) return () => {};
        const orig = btn.innerHTML;
        btn.innerHTML = texto;
        btn.disabled = true;
        return () => { btn.innerHTML = orig; btn.disabled = false; };
    },

    /** Texto do período escolhido no seletor "Referência" (ex.: "3º BIMESTRE / 2026"). */
    obterPeriodo() {
        const sel = document.querySelector('.select-referencia');
        return sel ? sel.options[sel.selectedIndex].textContent.trim() : '';
    },

    /** Data/hora atual formatada para o rodapé. */
    dataGeracao() {
        return new Date().toLocaleString('pt-BR');
    },

    /** Cabeçalho institucional (brasão + textos) do Relatório Simples. */
    cabecalhoSimples(secretaria) {
        const cfg = SIOPEApp.config.relatorios;
        return `
                    <div class="rs-header">
                        <img src="${cfg.brasao}" alt="Brasão" class="rs-logo">
                        <div class="rs-header-text">
                            <h2>${cfg.prefeitura}</h2>
                            <h3>${secretaria}</h3>
                            <p>${cfg.departamento}</p>
                        </div>
                    </div>`;
    },

    /** Linhas código | descrição | valor de um grupo de receita. */
    linhasItens(itens) {
        const u = SIOPEApp.utils;
        if (!itens || !itens.length) {
            return `<tr><td class="rs-cod">—</td><td>Nenhum lançamento encontrado.</td><td class="rs-val"></td></tr>`;
        }
        return itens.map(i => `<tr><td class="rs-cod">${i['Nat.Despesa'] || ''}</td><td>${i['Descrição'] || ''}</td><td class="rs-val">${u.fmtMoeda(u.limparNum(i['Valor Receita']))}</td></tr>`).join('');
    },

    /** Linha de 4 colunas: rótulo | Empenhado | Liquidado | Pago. */
    linhaELP(rotulo, valores, formatador, classe = '') {
        const cls = classe ? ` class="${classe}"` : '';
        return `<tr${cls}><td>${rotulo}</td><td class="rs-val">${formatador(valores.e)}</td><td class="rs-val">${formatador(valores.l)}</td><td class="rs-val">${formatador(valores.p)}</td></tr>`;
    },

    /**
     * Coloca o HTML no container #relatorio-simples, ativa o modo de
     * impressão de 1 página, imprime e limpa tudo em seguida.
     */
    imprimirRelatorioSimples(html, restaurarBotao) {
        const container = document.getElementById('relatorio-simples');
        container.innerHTML = html;
        document.body.classList.add('modo-relatorio-simples');

        setTimeout(() => {
            restaurarBotao();
            window.print();
            document.body.classList.remove('modo-relatorio-simples');
            container.innerHTML = '';
        }, 300);
    }
};
