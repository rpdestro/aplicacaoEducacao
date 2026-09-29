/**
 * UI — GRÁFICOS (Chart.js)
 * ----------------------------------------------------------------------------
 * Um gráfico só é criado se o canvas estiver VISÍVEL (offsetParent !== null);
 * a instância anterior é sempre destruída antes de redesenhar.
 */
Object.assign(SIOPEApp.ui, {

    /** Opções comuns a todos os gráficos (sem animação, alta resolução p/ PDF). */
    opcoesBaseGrafico() {
        return {
            maintainAspectRatio: false,
            animation: false,
            devicePixelRatio: Math.max(window.devicePixelRatio || 1, 3)
        };
    },

    /**
     * Cria (ou recria) um gráfico no canvas indicado e guarda a instância em
     * state[chaveInstancia]. Retorna null se o canvas não estiver visível.
     */
    desenharGrafico(canvasId, chaveInstancia, configuracao) {
        if (typeof Chart === 'undefined') return null;
        const cx = document.getElementById(canvasId);
        if (!cx || cx.offsetParent === null) return null;
        const state = SIOPEApp.state;
        if (state[chaveInstancia]) state[chaveInstancia].destroy();
        state[chaveInstancia] = new Chart(cx, configuracao);
        return state[chaveInstancia];
    },

    /** Gráficos do módulo Educação: rosca (Receitas) e barras (Despesas). */
    graficos(rp, dp) {
        const ui = SIOPEApp.ui;

        ui.desenharGrafico('chartReceitas', 'chartRecInst', {
            type: 'doughnut',
            data: {
                labels: ['Municipal', 'União', 'Estado', 'Fundeb', 'Adicionais'],
                datasets: [{
                    data: [rp.mun.t, rp.uniao.t, rp.est.t, rp.fun.t, (rp.aplFin.t + rp.fnde.t + rp.estTra.t)],
                    backgroundColor: ['#10b981', '#059669', '#34d399', '#0ea5e9', '#6366f1'],
                    borderWidth: 0
                }]
            },
            options: { ...ui.opcoesBaseGrafico(), plugins: { legend: { position: 'right' } }, cutout: '65%' }
        });

        const rotulosDespesa = ['12.122 - Admin. Geral', '12.361 - Ensino Fund.', '12.365 - Educ. Infantil', '12.367 - Educ. Especial'];
        ui.desenharGrafico('chartDespesas', 'chartDespInst', {
            type: 'bar',
            data: {
                labels: ['12.122', '12.361', '12.365', '12.367'],
                datasets: [{
                    label: 'Liquidado',
                    data: [dp.i122.l, dp.i361.l, dp.i365.l, dp.i367.l],
                    backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(99,102,241,0.7)', 'rgba(139,92,246,0.7)', 'rgba(20,184,166,0.7)']
                }]
            },
            options: {
                ...ui.opcoesBaseGrafico(),
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 },
                            generateLabels: (chart) => {
                                const bg = chart.data.datasets[0].backgroundColor;
                                return rotulosDespesa.map((r, i) => ({
                                    text: r, fillStyle: bg[i], strokeStyle: bg[i], lineWidth: 0, hidden: false, index: i
                                }));
                            }
                        }
                    }
                }
            }
        });
    },

    /** Gráfico do módulo Saúde: rosca Municipal / União / Estado. */
    graficosSaude(rp) {
        const ui = SIOPEApp.ui;
        ui.desenharGrafico('chartSaude', 'chartSaudeInst', {
            type: 'doughnut',
            data: {
                labels: ['Municipal', 'União (FPM)', 'Estado'],
                datasets: [{ data: [rp.mun.t, rp.uniao.t, rp.est.t], backgroundColor: ['#e11d48', '#fb7185', '#fda4af'], borderWidth: 0 }]
            },
            options: { ...ui.opcoesBaseGrafico(), plugins: { legend: { position: 'right' } }, cutout: '65%' }
        });
    }
});
