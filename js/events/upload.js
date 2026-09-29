/**
 * EVENTOS — UPLOAD E PROCESSAMENTO DOS CSVs
 */
SIOPEApp.events.registrarUpload = function () {
    const { ui, utils, config, state } = SIOPEApp;

    document.getElementById('csv-receitas').addEventListener('change', e => ui.nomeArquivo('receitas', e.target));
    document.getElementById('csv-despesas').addEventListener('change', e => ui.nomeArquivo('despesas', e.target));

    document.getElementById('btn-processar').addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        const fR = document.getElementById('csv-receitas').files[0];
        const fD = document.getElementById('csv-despesas').files[0];
        if (!fR || !fD) return alert('Selecione os dois arquivos CSV.');

        const restaurar = SIOPEApp.exports.helpers.bloquearBotao(btn, '⏳ Processando...');
        try {
            const [txtR, txtD] = await Promise.all([utils.lerArquivo(fR), utils.lerArquivo(fD)]);
            state.receitas = utils.csvParaObj(txtR, config.colunasCsv.receitas);
            state.despesas = utils.csvParaObj(txtD, config.colunasCsv.despesas);

            // Substitui a "Descrição" do CSV pela nomenclatura oficial
            // (config/nomenclatura-receitas.js); o texto do CSV é o fallback.
            state.receitas.forEach(item => {
                item['Descrição'] = utils.resolverDescricaoReceita(item['Nat.Despesa'], item['Descrição']);
            });
            state.filtros = {};
            state.resetarPaginacao();

            ui.montarTabela(state.receitas, 'nova-tabela-receitas', 'receitas');
            ui.montarTabela(state.despesas, 'nova-tabela-despesas', 'despesas');

            ui.mostrarDashboard();
            ui.abas('receitas');
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            restaurar();
        }
    });
};
