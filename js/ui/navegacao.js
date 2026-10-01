/**
 * UI — NAVEGAÇÃO E ESTADO VISUAL
 * Datas do seletor de referência, nome do arquivo anexado, troca de abas,
 * troca de visão (Relatório / Base de Dados) e troca de módulo.
 */
Object.assign(SIOPEApp.ui, {

    /** Substitui "MES/ANO" e "{ano}" do seletor de referência pela data atual. */
    initDataAtual() {
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesAtual = dataAtual.getMonth();
        const nomesMeses = SIOPEApp.config.relatorios.nomesMeses;

        document.querySelectorAll('.opt-mensal').forEach(opt => {
            opt.textContent = `${nomesMeses[mesAtual]}/${anoAtual}`;
        });
        document.querySelectorAll('.opt-ano').forEach(opt => {
            opt.textContent = opt.textContent.replace(/{ano}/g, anoAtual);
        });
    },

    /** Atualiza o card de feedback visual de um arquivo ('receitas' ou 'despesas'). */
    atualizarStatusUpload(tipo, info) {
        const u = SIOPEApp.utils;
        const card = document.getElementById(`upload-status-${tipo}`);
        const btnProc = document.getElementById('btn-processar');
        if (!card) return;

        if (!info) {
            // Estado vazio / aguardando
            card.classList.remove('status-loaded');
            card.innerHTML = `
                <div class="status-card-inner status-empty">
                    <div class="status-icon ${tipo}">
                        ${tipo === 'receitas' ? '↗' : '↘'}
                    </div>
                    <div class="status-info">
                        <span class="status-title">${tipo === 'receitas' ? 'Receitas' : 'Despesas'}</span>
                        <span class="status-desc">Aguardando arquivo...</span>
                    </div>
                </div>
            `;
        } else {
            // Estado carregado com feedback detalhado
            card.classList.add('status-loaded');
            const tamFmt = u.formatarBytes(info.file.size);
            const linhasFmt = info.linhas ? info.linhas.toLocaleString('pt-BR') : '0';
            const mapeamento = tipo === 'receitas' 
                ? 'R=17 • K=10 • AB=27' 
                : 'BJ=61 • BW=74 • L=11 • N=13 • P=15';

            card.innerHTML = `
                <div class="status-card-inner status-active">
                    <div class="status-icon ${tipo}">
                        ${tipo === 'receitas' ? '✓' : '✓'}
                    </div>
                    <div class="status-info">
                        <div class="status-header-row">
                            <span class="status-title">${tipo === 'receitas' ? 'Receitas' : 'Despesas'} Detectadas</span>
                            <button type="button" class="btn-remove-file" title="Remover este arquivo" onclick="SIOPEApp.events.removerArquivo('${tipo}')">✕</button>
                        </div>
                        <span class="status-filename" title="${u.sanitizar(info.file.name)}">${u.sanitizar(info.file.name)}</span>
                        <div class="status-meta">
                            <span class="status-badge">${tamFmt}</span>
                            <span class="status-badge">${linhasFmt} linhas</span>
                            <span class="status-badge status-badge-map">${mapeamento}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Habilita ou desabilita o botão principal de processamento
        const pendentes = SIOPEApp.state.arquivosPendentes;
        const ambosProntos = pendentes.receitas && pendentes.despesas;
        if (btnProc) {
            btnProc.disabled = !ambosProntos;
            btnProc.classList.toggle('btn-ready', ambosProntos);
            const txt = ambosProntos 
                ? '✓ Processar e Carregar Dados' 
                : 'Aguardando 2 arquivos CSV...';
            const spanTxt = btnProc.querySelector('.btn-text');
            if (spanTxt) spanTxt.textContent = txt;
        }
    },


    /** Alterna as sub-abas Receitas / Despesas do módulo Educação. */
    abas(aba) {
        const r = document.getElementById('modulo-receitas'), d = document.getElementById('modulo-despesas');
        const br = document.getElementById('btn-tab-receitas'), bd = document.getElementById('btn-tab-despesas');
        const ehReceitas = aba === 'receitas';

        r.classList.toggle('hidden', !ehReceitas);
        d.classList.toggle('hidden', ehReceitas);
        br.classList.toggle('active', ehReceitas);
        bd.classList.toggle('active', !ehReceitas);

        const { receitas, despesas } = SIOPEApp.state;
        if (receitas.length > 0 || despesas.length > 0) {
            setTimeout(() => SIOPEApp.ui.renderizar(), 50);
        }
    },

    /** Alterna entre "Relatório Executivo" e "Base de Dados" (tipo: 'rec' | 'desp'). */
    visao(tipo, v) {
        const pre = tipo === 'rec' ? 'receitas' : 'despesas';
        const b = document.getElementById(`container-blocos-${pre}`);
        const t = document.getElementById(`container-tabela-${pre}-wrapper`);
        const br = document.getElementById(`btn-visao-relatorio-${tipo}`);
        const bt = document.getElementById(`btn-visao-tabela-${tipo}`);
        const ehRelatorio = v === 'relatorio';

        b.style.display = ehRelatorio ? 'block' : 'none';
        t.classList.toggle('active', !ehRelatorio);
        br.classList.toggle('active', ehRelatorio);
        bt.classList.toggle('active', !ehRelatorio);
    },

    /** Troca entre os módulos Educação e Saúde (mesmos CSVs, cálculos independentes). */
    moduloSwitch(modulo) {
        const btnEdu = document.getElementById('btn-modulo-educacao'), btnSau = document.getElementById('btn-modulo-saude');
        const contEdu = document.getElementById('conteudo-modulo-educacao'), contSau = document.getElementById('conteudo-modulo-saude');
        const paraSaude = modulo === 'saude';

        btnEdu.classList.toggle('active', !paraSaude);
        btnSau.classList.toggle('active', paraSaude);
        contEdu.classList.toggle('hidden', paraSaude);
        contSau.classList.toggle('hidden', !paraSaude);

        const { receitas, despesas } = SIOPEApp.state;
        if (paraSaude && (receitas.length || despesas.length)) {
            SIOPEApp.ui.renderizarSaude();
        }
    },

    /** Esconde a tela de upload e exibe o dashboard. */
    mostrarDashboard() {
        document.getElementById('upload-section').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
    }
});
