/**
 * UI — TABELA "BASE DE DADOS"
 * Monta o cabeçalho com filtros estilo Excel e desenha as linhas paginadas.
 */
Object.assign(SIOPEApp.ui, {

    /** Largura de cada coluna conforme o tipo de base. */
    larguraColuna(tipo, c) {
        if (tipo === 'receitas') return c === 'Descrição' ? 'width: 60%;' : 'width: 20%;';
        if (c === 'Vínculo') return 'width: 25%;';
        if (c === 'Fonte') return 'width: 20%;';
        if (c === 'Função/SubFunção') return 'width: 15%;';
        return 'width: 13.3%;';
    },

    /** Monta a <table> com um dropdown de filtro por coluna. */
    montarTabela(dados, id, tipo) {
        const cont = document.getElementById(id);
        if (!cont) return;
        if (!dados.length) { cont.innerHTML = `<p class="col-empty">Sem dados.</p>`; return; }

        const mapa = SIOPEApp.config.mapaColunas;
        const cabs = Object.keys(dados[0]);
        let h = `<div class="responsive-table"><table class="tabela-moderna"><thead><tr>`;

        cabs.forEach((c, idx) => {
            const cid = Object.keys(mapa).find(k => mapa[k] === c);
            const vals = [...new Set(dados.map(i => String(i[c]).trim()))].sort();
            const isV = c.includes('Valor');
            const wid = SIOPEApp.ui.larguraColuna(tipo, c);
            const dropC = idx === cabs.length - 1 ? 'excel-dropdown dropdown-last-child hidden' : 'excel-dropdown hidden';
            h += `
                <th data-col="${c}" style="${wid}">
                    <div class="th-container ${isV ? 'th-right' : 'th-left'}">
                        <span class="th-title-text">${c}</span>
                        <button id="btn_drop_${cid}" class="btn-filtro-excel" data-action="toggle-drop">
                            <span id="txt_${cid}">Todos</span> 🔻
                        </button>
                    </div>
                    <div id="drop_${cid}" class="${dropC}">
                        <input type="text" class="excel-search-input" data-action="search" data-target="${cid}" placeholder="Pesquisar...">
                        <label class="select-all-label"><input type="checkbox" class="ms-select-all" data-target="${cid}"> Selecionar Tudo</label>
                        <div class="excel-options-list">
                            ${vals.map(v => `<label class="ms-item-label"><input type="checkbox" class="chk-item ms-item-${cid}" value="${v.replace(/"/g, '&quot;')}"> <span>${v || '(Vazio)'}</span></label>`).join('')}
                        </div>
                        <div class="excel-dropdown-actions">
                            <button class="btn-excel-ok" data-action="apply" data-target="${cid}">OK</button>
                            <button class="btn-excel-limpar" data-action="cancel" data-target="${cid}">Cancelar</button>
                        </div>
                    </div>
                </th>`;
        });
        h += `</tr></thead><tbody id="tbody_rows_${tipo}"></tbody></table></div>`;
        cont.innerHTML = h;
    },

    /** Desenha as linhas visíveis da Base de Dados de Receitas. */
    renderizarLinhasReceitas(rFilt) {
        const u = SIOPEApp.utils;
        const tb = document.getElementById('tbody_rows_receitas');
        if (!tb) return;
        const limite = SIOPEApp.state.limiteRec;
        tb.innerHTML = rFilt.slice(0, limite).map(i =>
            `<tr><td class="col-monospaced">${i['Nat.Despesa']}</td><td class="col-desc">${i['Descrição']}</td><td class="col-right">${u.fmtMoeda(u.limparNum(i['Valor Receita']))}</td></tr>`
        ).join('');
        document.getElementById('container_btn_mais_receitas').style.display = rFilt.length > limite ? 'block' : 'none';
    },

    /** Desenha as linhas visíveis da Base de Dados de Despesas. */
    renderizarLinhasDespesas(dFilt) {
        const u = SIOPEApp.utils;
        const tb = document.getElementById('tbody_rows_despesas');
        if (!tb) return;
        const limite = SIOPEApp.state.limiteDesp;
        tb.innerHTML = dFilt.slice(0, limite).map(i =>
            `<tr><td class="col-monospaced">${i['Função/SubFunção']}</td><td class="col-desc">${i['Vínculo']}</td><td class="col-center">${i['Fonte']}</td><td class="col-right">${u.fmtMoeda(u.limparNum(i['Valor Empenhado']))}</td><td class="col-right">${u.fmtMoeda(u.limparNum(i['Valor Liquidado']))}</td><td class="col-right col-destaque">${u.fmtMoeda(u.limparNum(i['Valor Pago']))}</td></tr>`
        ).join('');
        document.getElementById('container_btn_mais_despesas').style.display = dFilt.length > limite ? 'block' : 'none';
    }
});
