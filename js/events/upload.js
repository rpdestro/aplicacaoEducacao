/**
 * EVENTOS — UPLOAD UNIFICADO E PROCESSAMENTO DOS CSVs
 * Suporta dropzone única, seleção múltipla e detecção automática de Receitas/Despesas.
 */
SIOPEApp.events.registrarUpload = function () {
    const { ui, utils, config, state } = SIOPEApp;

    const dropZone = document.getElementById('drop-zone-unificada');
    const fileInput = document.getElementById('csv-unificado');
    const btnProcessar = document.getElementById('btn-processar');

    if (!dropZone || !fileInput) return;

    /** Processa uma lista de arquivos File (seja de input ou drag and drop). */
    async function processarArquivosEntrada(arquivos) {
        if (!arquivos || !arquivos.length) return;

        const lista = Array.from(arquivos).filter(f => f.name.toLowerCase().endsWith('.csv'));
        if (!lista.length) {
            alert('Por favor, selecione arquivos com extensão .csv');
            return;
        }

        for (const arq of lista) {
            try {
                const txt = await utils.lerArquivo(arq);
                const info = utils.detectarTipoCsv(arq, txt);

                if (info.tipo === 'receitas' || info.tipo === 'despesas') {
                    state.arquivosPendentes[info.tipo] = {
                        file: arq,
                        text: txt,
                        linhas: info.totalLinhas
                    };
                    ui.atualizarStatusUpload(info.tipo, state.arquivosPendentes[info.tipo]);
                } else {
                    // Se não tiver certeza absoluta, tenta deduzir qual vaga está vazia
                    if (!state.arquivosPendentes.receitas && state.arquivosPendentes.despesas) {
                        state.arquivosPendentes.receitas = { file: arq, text: txt, linhas: info.totalLinhas };
                        ui.atualizarStatusUpload('receitas', state.arquivosPendentes.receitas);
                    } else if (!state.arquivosPendentes.despesas && state.arquivosPendentes.receitas) {
                        state.arquivosPendentes.despesas = { file: arq, text: txt, linhas: info.totalLinhas };
                        ui.atualizarStatusUpload('despesas', state.arquivosPendentes.despesas);
                    } else {
                        alert(`Não foi possível classificar automaticamente o arquivo: "${arq.name}". Certifique-se de que é um CSV válido de Receitas ou Despesas.`);
                    }
                }
            } catch (err) {
                alert(`Erro ao ler o arquivo ${arq.name}: ${err.message}`);
            }
        }
        // Limpa o input para permitir selecionar o mesmo arquivo novamente se quiser
        fileInput.value = '';
    }

    // Eventos de Drag & Drop na Dropzone Unificada
    ['dragenter', 'dragover'].forEach(evName => {
        dropZone.addEventListener(evName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dropzone-dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evName => {
        dropZone.addEventListener(evName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dropzone-dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files) {
            processarArquivosEntrada(dt.files);
        }
    });

    // Evento de seleção clássica pelo file input (clique na dropzone)
    fileInput.addEventListener('change', (e) => {
        processarArquivosEntrada(e.target.files);
    });

    // Clique no botão Processar e Carregar Dados
    btnProcessar.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        const pR = state.arquivosPendentes.receitas;
        const pD = state.arquivosPendentes.despesas;

        if (!pR || !pD) {
            return alert('Por favor, carregue os dois arquivos (Receitas e Despesas) antes de processar.');
        }

        const restaurar = SIOPEApp.exports.helpers.bloquearBotao(btn, '⏳ Processando...');
        try {
            state.receitas = utils.csvParaObj(pR.text, config.colunasCsv.receitas);
            state.despesas = utils.csvParaObj(pD.text, config.colunasCsv.despesas);

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
            alert("Erro durante o processamento: " + err.message);
        } finally {
            restaurar();
        }
    });

    // Inicializa os cards de status como vazios
    ui.atualizarStatusUpload('receitas', null);
    ui.atualizarStatusUpload('despesas', null);
};

/** Permite ao usuário remover um arquivo individualmente pelo [✕] */
SIOPEApp.events.removerArquivo = function (tipo) {
    if (SIOPEApp.state.arquivosPendentes) {
        SIOPEApp.state.arquivosPendentes[tipo] = null;
        SIOPEApp.ui.atualizarStatusUpload(tipo, null);
    }
};
