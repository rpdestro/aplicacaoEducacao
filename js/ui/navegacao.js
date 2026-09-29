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

    /** Mostra o nome do CSV anexado dentro da dropzone. */
    nomeArquivo(tipo, input) {
        const lbl = document.getElementById(`label-${tipo}`);
        if (input.files && input.files[0]) {
            const n = SIOPEApp.utils.sanitizar(input.files[0].name);
            lbl.textContent = n;
            document.querySelector(`#drop-zone-${tipo} .dropzone-subtitle`).innerHTML =
                `<span class="upload-ok upload-ok--${tipo}">✓</span> <span class="upload-ok-texto upload-ok--${tipo}">${n} anexado</span>`;
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
