/**
 * FILTROS ESTILO EXCEL (Base de Dados)
 * ----------------------------------------------------------------------------
 * Cada coluna tem um dropdown com pesquisa, "Selecionar Tudo" e checkboxes.
 * O resultado fica em state.filtros[idColuna] = [valores marcados].
 * Ausência da chave = "Todos".
 */
Object.assign(SIOPEApp.filters, {

    /** Remove todos os filtros e redesenha. */
    limparTodos() {
        const f = SIOPEApp.filters;
        SIOPEApp.state.filtros = {};
        document.querySelectorAll('.btn-filtro-excel').forEach(b => {
            const id = b.id.replace('btn_drop_', '');
            b.classList.remove('active-filter');
            document.getElementById(`txt_${id}`).innerText = "Todos";
            f.sincronizar(id);
        });
        SIOPEApp.state.resetarPaginacao();
        SIOPEApp.ui.renderizar();
    },

    /** Esconde as opções que não contêm o texto digitado. */
    pesquisar(id, input) {
        const t = input.value.toLowerCase();
        document.querySelectorAll(`#drop_${id} .ms-item-label`).forEach(lbl => {
            lbl.style.display = lbl.textContent.toLowerCase().includes(t) ? '' : 'none';
        });
    },

    /** Marca/desmarca todas as opções visíveis. */
    toggleAll(id, isChecked) {
        document.querySelectorAll(`.ms-item-${id}`).forEach(c => {
            if (c.closest('label').style.display !== 'none') c.checked = isChecked;
        });
    },

    /** Atualiza o checkbox "Selecionar Tudo" conforme as opções. */
    verificarAll(id) {
        document.querySelector(`.ms-select-all[data-target="${id}"]`).checked =
            Array.from(document.querySelectorAll(`.ms-item-${id}`)).every(c => c.checked);
    },

    /** Reflete no dropdown o que está salvo em state.filtros. */
    sincronizar(id) {
        const vals = SIOPEApp.state.filtros[id];
        if (vals === undefined) {
            document.querySelectorAll(`.ms-item-${id}`).forEach(c => c.checked = false);
            document.querySelector(`.ms-select-all[data-target="${id}"]`).checked = false;
        } else {
            document.querySelectorAll(`.ms-item-${id}`).forEach(c => c.checked = vals.includes(c.value));
            SIOPEApp.filters.verificarAll(id);
        }
    },

    /** Fecha o dropdown descartando alterações não aplicadas. */
    fechar(id) {
        document.getElementById(`drop_${id}`).classList.add('hidden');
        document.querySelector(`#drop_${id} .excel-search-input`).value = "";
        document.querySelectorAll(`#drop_${id} .ms-item-label`).forEach(l => l.style.display = '');
        SIOPEApp.filters.sincronizar(id);
    },

    /** Salva as opções marcadas como filtro e redesenha. */
    aplicar(id) {
        const state = SIOPEApp.state;
        const cbs = document.querySelectorAll(`.ms-item-${id}`);
        const vals = [];
        cbs.forEach(c => { if (c.checked) vals.push(c.value); });

        if (vals.length === cbs.length || vals.length === 0) delete state.filtros[id];
        else state.filtros[id] = vals;
        state.resetarPaginacao();

        const t = document.getElementById(`txt_${id}`), b = document.getElementById(`btn_drop_${id}`);
        if (!state.filtros[id]) { t.innerText = "Todos"; b.classList.remove('active-filter'); }
        else if (vals.length === 1) { t.innerText = vals[0]; b.classList.add('active-filter'); }
        else { t.innerText = vals.length + " sel."; b.classList.add('active-filter'); }

        document.getElementById(`drop_${id}`).classList.add('hidden');
        SIOPEApp.ui.renderizar();
    }
});
