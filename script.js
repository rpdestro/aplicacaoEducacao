// VARIÁVEIS E ESTADOS GLOBAIS
let dadosGlobaisReceitas = [];
let dadosGlobaisDespesas = [];
let filtrosAplicados = {};

// Variáveis de paginação (Limites iniciais de linhas na tela)
let limiteReceitas = 50;
let limiteDespesas = 50;

// Dicionário para traduzir os IDs seguros do DOM de volta para as chaves reais das colunas
const mapaIdParaColuna = {
    'rec_NatDespesa': 'Nat.Despesa',
    'rec_Descricao': 'Descrição',
    'rec_ValorReceita': 'Valor Receita',
    'des_FuncaoSubFuncao': 'Função/SubFunção',
    'des_Vinculo': 'Vínculo',
    'des_ValorEmpenhado': 'Valor Empenhado',
    'des_ValorLiquidado': 'Valor Liquidado',
    'des_ValorPago': 'Valor Pago'
};

// 1. Função auxiliar para ler um arquivo
function lerArquivo(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = (evento) => resolve(evento.target.result);
        leitor.onerror = () => reject(new Error(`Falha ao ler o arquivo: ${arquivo.name}`));
        leitor.readAsText(arquivo, 'UTF-8');
    });
}

// Atualiza o visual do card quando o arquivo for selecionado na tela de upload (Padrão de Cores Image)
window.atualizarNomeArquivo = function(tipo) {
    const input = document.getElementById(`csv-${tipo}`);
    const label = document.getElementById(`label-${tipo}`);
    const sublabel = document.getElementById(`sublabel-${tipo}`);
    const icone = document.getElementById(`icone-upload-${tipo}`);
    const badge = document.getElementById(`badge-linhas-${tipo}`);

    if (input.files && input.files[0]) {
        const nomeArquivo = input.files[0].name;
        
        // Cores específicas para cada aba baseadas no modelo visual
        const corAtiva = tipo === 'receitas' ? '#16a34a' : '#dc2626'; // Verde ou Vermelho
        
        // Atualiza título principal
        label.textContent = nomeArquivo;
        label.style.color = '#374151'; // Mantém o nome do arquivo escuro como na imagem
        
        // Atualiza a linha de baixo colocando o ✓ com a cor respectiva
        sublabel.innerHTML = `<span style="color: ${corAtiva}; font-weight: bold;">✓</span> <span style="color: ${corAtiva}; font-weight: 500;">${nomeArquivo} anexado</span>`;
        
        // Exibe o badge superior dizendo que o arquivo foi recebido
        if(badge) {
            badge.classList.remove('hidden');
            badge.textContent = 'Arquivo Pronto';
        }
    }
};

// Converte letras de colunas do Excel em índices numéricos
function excelLetraParaIndice(letra) {
    let clean = letra.toUpperCase().trim();
    let indice = 0;
    for (let i = 0; i < clean.length; i++) {
        indice = indice * 26 + (clean.charCodeAt(i) - 64);
    }
    return indice - 1;
}

// 2. Transforma o texto bruto do CSV em Objetos
function converterCSVParaObjeto(textoBruto, dicionarioMapeamento) {
    const linhas = textoBruto.split('\n')
                             .map(linha => linha.trim())
                             .filter(linha => linha !== "");

    if (linhas.length === 0) return [];

    const primeiraLinha = linhas[0];
    const separador = primeiraLinha.includes(';') ? ';' : ',';
    const cabecalhosOriginais = primeiraLinha.split(separador).map(c => c.trim().replace(/^"|"$/g, ''));

    const colunasLetras = Object.keys(dicionarioMapeamento);
    const usaLetrasComoHeader = colunasLetras.every(letra => 
        cabecalhosOriginais.some(c => c.toUpperCase() === letra.toUpperCase())
    );

    return linhas.slice(1).map(linha => {
        const valores = valoresSplitComAspas(linha, separador);
        const objeto = {};

        colunasLetras.forEach(letra => {
            let idx = -1;
            if (usaLetrasComoHeader) {
                idx = cabecalhosOriginais.findIndex(c => c.toUpperCase() === letra.toUpperCase());
            } else {
                idx = excelLetraParaIndice(letra);
            }

            const valorCelula = valores[idx] || "";
            const novoNomeColuna = dicionarioMapeamento[letra];
            objeto[novoNomeColuna] = valorCelula;
        });

        return objeto;
    });
}

function valoresSplitComAspas(linha, separador) {
    const resultado = [];
    let dentroDeAspas = false;
    let valorAtual = "";
    
    for (let i = 0; i < linha.length; i++) {
        const char = linha[i];
        if (char === '"') {
            dentroDeAspas = !dentroDeAspas;
        } else if (char === separador && !dentroDeAspas) {
            resultado.push(valorAtual.trim().replace(/^"|"$/g, ''));
            valorAtual = "";
        } else {
            valorAtual += char;
        }
    }
    resultado.push(valorAtual.trim().replace(/^"|"$/g, ''));
    return resultado;
}

function limparEConverterNumero(valorString) {
    if (!valorString) return 0;
    let limpo = valorString.toString().trim().replace(/[R$\s]/g, '');
    if (limpo.includes(',') && limpo.includes('.')) {
        if (limpo.indexOf('.') < limpo.indexOf(',')) limpo = limpo.replace(/\./g, '');
    } else if (limpo.includes(',') && !limpo.includes('.')) {
        limpo = limpo.replace(',', '.');
    }
    limpo = limpo.replace(',', '.');
    const numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// ==========================================================================
/* CÁLCULOS E AGRUPAMENTOS CONTÁBEIS */
// ==========================================================================
function processarDadosReceitas(dados) {
    let municipalItens = [];
    let uniaoFPMItens = [];
    let estadoItens = [];
    let deducoesItens = [];
    let fundebItens = [];
    let fundebMatriculasETItens = [];
    let aplicacaoFinanceiraItens = [];
    let fndeItens = [];
    let estadoTransferenciasItens = [];

    let municipalTotal = 0;
    let uniaoFPMTotal = 0;
    let estadoTotal = 0;
    let deducoesTotal = 0;
    let fundebTotal = 0;
    let fundebMatriculasETTotal = 0;
    let aplicacaoFinanceiraTotal = 0;
    let fndeTotal = 0;
    let estadoTransferenciasTotal = 0;

    const codigosAplicacao = [
        '1321.01.1.1.02.01', '1321.01.1.1.02.02', '1321.01.1.1.02.04', 
        '1321.01.1.1.02.05', '1321.01.1.1.02.08', '1321.01.1.1.02.11'
    ];
    const codigosAplicacaoClean = codigosAplicacao.map(c => c.replace(/\./g, ''));

    const codigosEstadoTransf = ['1724.51.0.1.02.00', '1724.51.0.1.03.00'];
    const codigosEstadoTransfClean = codigosEstadoTransf.map(c => c.replace(/\./g, ''));

    dados.forEach(item => {
        const nat = String(item['Nat.Despesa'] || '').trim();
        const natClean = nat.replace(/\./g, '');
        const valor = limparEConverterNumero(item['Valor Receita']);

        // 1. Municipal
        if (natClean.startsWith('1112') || natClean.startsWith('1113') || natClean.startsWith('1114')) {
            municipalItens.push(item);
            municipalTotal += valor;
        } 
        // 2. União (FPM)
        else if (natClean.startsWith('1711')) {
            uniaoFPMItens.push(item);
            uniaoFPMTotal += valor;
        } 
        // 3. Estado
        else if (nat.startsWith('1721.50') || nat.startsWith('1721.51') || nat.startsWith('1721.52') || 
                 natClean.startsWith('172150') || natClean.startsWith('172151') || natClean.startsWith('172152')) {
            estadoItens.push(item);
            estadoTotal += valor;
        }

        // Deduções FUNDEB
        if (natClean.startsWith('9510')) {
            deducoesItens.push(item);
            deducoesTotal += valor;
        }

        // FUNDEB
        if (nat.includes('1751.50.0.1.00.00') || natClean.includes('175150010000') ||
            nat.includes('1321.01.1.1.02.06') || natClean.includes('132101110206')) {
            fundebItens.push(item);
            fundebTotal += valor;
        }

        // Transferência Recursos FUNDEB Destinados Criação Matrículas E.T
        if (nat.includes('1715.53.0.1.01.00') || natClean.includes('171553010100')) {
            fundebMatriculasETItens.push(item);
            fundebMatriculasETTotal += valor;
        }

        // Receita da Aplicação Financeira
        if (codigosAplicacao.includes(nat) || codigosAplicacaoClean.includes(natClean)) {
            aplicacaoFinanceiraItens.push(item);
            aplicacaoFinanceiraTotal += valor;
        }

        // Receita de Transferências do FNDE
        if (nat.startsWith('1714') || natClean.startsWith('1714')) {
            fndeItens.push(item);
            fndeTotal += valor;
        }
        
        // Receita de Transferências do Estado
        if (codigosEstadoTransf.includes(nat) || codigosEstadoTransfClean.includes(natClean)) {
            estadoTransferenciasItens.push(item);
            estadoTransferenciasTotal += valor;
        }
    });

    const totalImpostosTransferencias = municipalTotal + uniaoFPMTotal + estadoTotal;
    const aplicacaoObrigatoria25 = totalImpostosTransferencias * 0.25;
    const absDeducoes = Math.abs(deducoesTotal);
    const aplicacaoMinimaRecursosProprios = aplicacaoObrigatoria25 - absDeducoes;
    const totalReceitasAdicionaisEnsino = aplicacaoFinanceiraTotal + fndeTotal + estadoTransferenciasTotal;

    return {
        municipal: { itens: municipalItens, total: municipalTotal },
        uniaoFPM: { itens: uniaoFPMItens, total: uniaoFPMTotal },
        estado: { itens: estadoItens, total: estadoTotal },
        totalImpostosTransferencias,
        aplicacaoObrigatoria25,
        deducoes: { itens: deducoesItens, total: absDeducoes },
        aplicacaoMinimaRecursosProprios,
        fundeb: { itens: fundebItens, total: fundebTotal },
        fundebMatriculasET: { itens: fundebMatriculasETItens, total: fundebMatriculasETTotal },
        aplicacaoFinanceira: { itens: aplicacaoFinanceiraItens, total: aplicacaoFinanceiraTotal },
        fnde: { itens: fndeItens, total: fndeTotal },
        estadoTransferencias: { itens: estadoTransferenciasItens, total: estadoTransferenciasTotal },
        totalReceitasAdicionaisEnsino
    };
}

// ==========================================================================
/* AÇÕES DE EXPORTAÇÃO E IMPRESSÃO */
// ==========================================================================

window.imprimirRelatorio = function() {
    // Injeta CSS para formatar a página apenas para a impressora
    if (!document.getElementById('estilo-impressao')) {
        const style = document.createElement('style');
        style.id = 'estilo-impressao';
        style.innerHTML = `
            @media print {
                body * {
                    visibility: hidden;
                }
                #modulo-receitas, #modulo-receitas *,
                #modulo-despesas, #modulo-despesas * {
                    visibility: visible;
                }
                #modulo-receitas, #modulo-despesas {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    box-shadow: none !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                /* Oculta botões e elementos de navegação na impressão */
                button, .abas-navegacao, .btn-filtro-excel {
                    display: none !important;
                }
                /* Garante que áreas com rolagem exibam todo o conteúdo na folha */
                .responsive-table, div[style*="overflow"] {
                    overflow: visible !important;
                    max-height: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    window.print();
};

window.exportarReceitasXLSX = function(botaoAtivador) {
    const receitasFiltradas = obterDadosFiltrados('receitas');
    if (receitasFiltradas.length === 0) {
        alert('Não há dados de receitas para exportar com os filtros atuais.');
        return;
    }

    const textoOriginal = botaoAtivador.innerHTML;
    botaoAtivador.innerHTML = "⏳ Gerando XLSX...";
    botaoAtivador.disabled = true;

    const gerar = () => {
        // Prepara os dados convertendo valores monetários para números reais no Excel
        const dadosExcel = receitasFiltradas.map(row => ({
            'Nat.Despesa': row['Nat.Despesa'],
            'Descrição': row['Descrição'],
            'Valor Receita': limparEConverterNumero(row['Valor Receita']) 
        }));

        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        
        // Formata a coluna de Valor como Moeda no próprio Excel
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const cell = ws[XLSX.utils.encode_cell({c: 2, r: R})]; // Coluna C (índice 2)
            if (cell && cell.t === 'n') {
                cell.z = '"R$"#,##0.00;"R$"-#,##0.00'; 
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, "Receitas");
        XLSX.writeFile(wb, "receitas_filtradas.xlsx");
        
        botaoAtivador.innerHTML = textoOriginal;
        botaoAtivador.disabled = false;
    };

    // Carrega a biblioteca SheetJS dinamicamente se ela não existir
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = gerar;
        script.onerror = () => {
            alert('Erro ao carregar a biblioteca de exportação. Verifique sua conexão com a internet.');
            botaoAtivador.innerHTML = textoOriginal;
            botaoAtivador.disabled = false;
        };
        document.head.appendChild(script);
    } else {
        gerar();
    }
};

window.exportarReceitasCSV = function() {
    const receitasFiltradas = obterDadosFiltrados('receitas');
    if (receitasFiltradas.length === 0) {
        alert('Não há dados de receitas para exportar com os filtros atuais.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Nat.Despesa;Descrição;Valor Receita\n";

    receitasFiltradas.forEach(row => {
        const nat = String(row['Nat.Despesa'] || '').replace(/"/g, '""');
        const desc = String(row['Descrição'] || '').replace(/"/g, '""');
        const val = String(row['Valor Receita'] || '').replace(/"/g, '""');
        csvContent += `"${nat}";"${desc}";"${val}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "receitas_filtradas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ==========================================================================
/* SISTEMA DE ABAS E VISÕES */
// ==========================================================================
window.alternarAba = function(aba) {
    const moduloRec = document.getElementById('modulo-receitas');
    const moduloDesp = document.getElementById('modulo-despesas');
    const btnRec = document.getElementById('btn-tab-receitas');
    const btnDesp = document.getElementById('btn-tab-despesas');
    
    const estiloBase = "padding: 12px 28px; margin: 0 8px; cursor: pointer; border: 1px solid; border-radius: 8px; font-size: 15px; font-weight: 500; transition: all 0.25s ease-in-out; min-width: 180px;";
    const estiloAtivo = estiloBase + "background-color: #0284c7; color: white; border-color: #0284c7; font-weight: 600; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);";
    const estiloInativo = estiloBase + "background-color: #f8fafc; color: #64748b; border-color: #e2e8f0; box-shadow: none;";

    const tabelasAntigasHTML = document.querySelectorAll('.tabela-container-antiga'); 
    tabelasAntigasHTML.forEach(el => el.style.display = 'none');

    if (aba === 'receitas') {
        if(moduloRec) moduloRec.style.setProperty('display', 'block', 'important');
        if(moduloDesp) moduloDesp.style.setProperty('display', 'none', 'important');
        if(btnRec) btnRec.style.cssText = estiloAtivo;
        if(btnDesp) btnDesp.style.cssText = estiloInativo;
    } else {
        if(moduloRec) moduloRec.style.setProperty('display', 'none', 'important');
        if(moduloDesp) moduloDesp.style.setProperty('display', 'block', 'important');
        if(btnRec) btnRec.style.cssText = estiloInativo;
        if(btnDesp) btnDesp.style.cssText = estiloAtivo;
    }
};

window.alternarVisaoReceitas = function(visao) {
    const containerBlocos = document.getElementById('container-blocos-receitas');
    const containerTabelaWrapper = document.getElementById('container-tabela-receitas-wrapper');
    const btnRelatorio = document.getElementById('btn-visao-relatorio');
    const btnTabela = document.getElementById('btn-visao-tabela');

    const estiloBtnAtivo = "padding: 8px 18px; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";
    const estiloBtnInativo = "padding: 8px 18px; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;";

    if (visao === 'relatorio') {
        if(containerBlocos) containerBlocos.style.display = 'block';
        if(containerTabelaWrapper) containerTabelaWrapper.style.display = 'none';
        if(btnRelatorio) btnRelatorio.style.cssText = estiloBtnAtivo;
        if(btnTabela) btnTabela.style.cssText = estiloBtnInativo;
    } else {
        if(containerBlocos) containerBlocos.style.display = 'none';
        if(containerTabelaWrapper) containerTabelaWrapper.style.display = 'block';
        if(btnRelatorio) btnRelatorio.style.cssText = estiloBtnInativo;
        if(btnTabela) btnTabela.style.cssText = estiloBtnAtivo;
    }
};

// ==========================================================================
/* LÓGICA DE FILTROS E PAGINAÇÃO */
// ==========================================================================

window.carregarMais = function(tipo) {
    if (tipo === 'receitas') {
        limiteReceitas += 50;
    } else {
        limiteDespesas += 50;
    }
    renderizarTabela();
};

function toggleSelectAll(campo, masterCheckbox) {
    const checkboxes = document.querySelectorAll(`.ms-item-${campo}`);
    checkboxes.forEach(cb => {
        if(cb.closest('label').style.display !== 'none') cb.checked = masterCheckbox.checked;
    });
}

function verificarSelectAll(campo) {
    const checkboxes = document.querySelectorAll(`.ms-item-${campo}`);
    const master = document.querySelector(`.ms-select-all[data-campo="${campo}"]`);
    let todosMarcados = true;
    checkboxes.forEach(cb => { if(!cb.checked) todosMarcados = false; });
    if(master) master.checked = todosMarcados;
}

function filtrarDropdownPesquisa(campo, input) {
    const termo = input.value.toLowerCase();
    document.querySelectorAll(`#drop_${campo} .ms-item-label`).forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
}

function atualizarTextoBotaoFiltro(campo) {
    const checkboxes = document.querySelectorAll(`.ms-item-${campo}`);
    const txtBox = document.getElementById(`txt_${campo}`);
    const btnBox = document.getElementById(`btn_drop_${campo}`);
    const valoresPermitidos = filtrosAplicados[campo];

    if (valoresPermitidos === undefined || valoresPermitidos.length === checkboxes.length) {
        if(txtBox) txtBox.innerText = "Todos";
        if(btnBox) btnBox.classList.remove('active-filter');
    } else if (valoresPermitidos.length === 1) {
        if(txtBox) txtBox.innerText = valoresPermitidos[0];
        if(btnBox) btnBox.classList.add('active-filter');
    } else {
        if(txtBox) txtBox.innerText = valoresPermitidos.length + " sel.";
        if(btnBox) btnBox.classList.add('active-filter');
    }
}

function aplicarFiltro(campo) {
    const checkboxes = document.querySelectorAll(`.ms-item-${campo}`);
    const valoresMarcados = [];
    checkboxes.forEach(cb => { if(cb.checked) valoresMarcados.push(cb.value); });

    if (valoresMarcados.length === checkboxes.length || valoresMarcados.length === 0) {
        delete filtrosAplicados[campo]; 
    } else {
        filtrosAplicados[campo] = valoresMarcados; 
    }

    limiteReceitas = 50;
    limiteDespesas = 50;

    atualizarTextoBotaoFiltro(campo);
    const dropdown = document.getElementById(`drop_${campo}`);
    if (dropdown) dropdown.classList.add('hidden');
    renderizarTabela();
}

function obterDadosFiltrados(tipo) {
    const bufferData = tipo === 'receitas' ? dadosGlobaisReceitas : dadosGlobaisDespesas;
    const prefixo = tipo === 'receitas' ? 'rec_' : 'des_';

    return bufferData.filter(reg => {
        for (let campo in filtrosAplicados) {
            if (!campo.startsWith(prefixo)) continue;
            if (filtrosAplicados[campo] === undefined) continue;
            const valoresPermitidos = filtrosAplicados[campo];
            if (valoresPermitidos.length === 0) return false;

            const nomeRealColuna = mapaIdParaColuna[campo];
            const valorLinha = String(reg[nomeRealColuna] || '').trim().toLowerCase();

            let encontrou = false;
            for (let i = 0; i < valoresPermitidos.length; i++) {
                const valorPermitidoSanitizado = valoresPermitidos[i].replace(/&quot;/g, '"').trim().toLowerCase();
                if (valorLinha === valorPermitidoSanitizado) {
                    encontrou = true;
                    break;
                }
            }
            if (!encontrou) return false;
        }
        return true;
    });
}

function fecharDropdownSemSalvar(campo) {
    const dropdown = document.getElementById(`drop_${campo}`);
    if (dropdown) dropdown.classList.add('hidden');
    
    const inputBusca = document.querySelector(`#drop_${campo} .excel-search-input`);
    if (inputBusca) inputBusca.value = "";
    
    document.querySelectorAll(`#drop_${campo} .ms-item-label`).forEach(l => l.style.display = '');
    sincronizarCheckboxesComEstado(campo);
}

function sincronizarCheckboxesComEstado(campo) {
    const checkboxes = document.querySelectorAll(`.ms-item-${campo}`);
    const valoresPermitidos = filtrosAplicados[campo];
    const master = document.querySelector(`.ms-select-all[data-campo="${campo}"]`);

    if (valoresPermitidos === undefined) {
        checkboxes.forEach(cb => cb.checked = false);
        if (master) master.checked = false;
    } else {
        checkboxes.forEach(cb => { cb.checked = valoresPermitidos.includes(cb.value); });
        verificarSelectAll(campo);
    }
}

document.addEventListener('click', (e) => {
    const btnFiltro = e.target.closest('.btn-filtro-excel');
    if (btnFiltro) {
        e.stopPropagation();
        const campoIdCorreto = btnFiltro.id.replace('btn_drop_', ''); 
        const dropdown = btnFiltro.closest('th').querySelector('.excel-dropdown');
        
        document.querySelectorAll('.excel-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.add('hidden');
        });
        
        const estaOculto = dropdown.classList.contains('hidden');
        if (estaOculto) {
            sincronizarCheckboxesComEstado(campoIdCorreto);
            dropdown.classList.remove('hidden');
        } else {
            dropdown.classList.add('hidden');
        }
        return;
    }

    if (!e.target.closest('th')) {
        document.querySelectorAll('.excel-dropdown').forEach(d => {
            if(!d.classList.contains('hidden')){
                const campo = d.id.replace('drop_', '');
                fecharDropdownSemSalvar(campo);
            }
        });
    }
});

// ==========================================================================
/* ESTRUTURAÇÃO E POPULAÇÃO DAS TABELAS */
// ==========================================================================

function construirEstruturaTabelaBase(dados, containerId, tipo) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    container.innerHTML = "";

    if (!dados || dados.length === 0) {
        container.innerHTML = `<p class="no-data">Nenhum registro encontrado.</p>`;
        return;
    }

    const cabecalhos = Object.keys(dados[0]);
    
    let html = `<div class="responsive-table" style="width: 100%; overflow-x: auto; overflow-y: visible; border-radius: 8px; box-sizing: border-box;">
                <table style="width: 100%; border-collapse: collapse; box-sizing: border-box;">
                <thead><tr>`;

    cabecalhos.forEach((cabecalho, index) => {
        const campoId = Object.keys(mapaIdParaColuna).find(key => mapaIdParaColuna[key] === cabecalho);
        const valoresUnicos = [...new Set(dados.map(item => String(item[cabecalho]).trim()))].sort();
        const classeMenu = (index === cabecalhos.length - 1) ? 'excel-dropdown dropdown-last-child' : 'excel-dropdown';

        html += `
            <th data-col="${cabecalho}" style="position: relative;">
                <div class="th-container" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <span class="th-title-text">${cabecalho}</span>
                    <button id="btn_drop_${campoId}" class="btn-filtro-excel">
                         <span id="txt_${campoId}">Todos</span> 🔻
                    </button>
                </div>
                <div id="drop_${campoId}" class="${classeMenu} hidden" style="position: absolute; top: 100%; left: 0; z-index: 99999; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); width: 280px; padding: 12px; text-align: left; box-sizing: border-box; margin-top: 4px; color: #334155;">
                    <input type="text" class="excel-search-input" oninput="filtrarDropdownPesquisa('${campoId}', this)" placeholder="Pesquisar..." style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; box-sizing: border-box; margin-bottom: 8px; color: #334155;">
                    <label class="excel-option-label" style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 4px 0; cursor: pointer; width: 100%;">
                        <input type="checkbox" class="ms-select-all" data-campo="${campoId}" onchange="toggleSelectAll('${campoId}', this)"> <em>(Selecionar Tudo)</em>
                    </label>
                    <div class="excel-options-list" style="max-height: 180px; overflow-y: auto; margin-top: 6px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; background: #f8fafc; display: flex; flex-direction: column; gap: 4px;">
                        ${valoresUnicos.map(val => `
                            <label class="ms-item-label excel-option-label" style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; padding: 4px 6px; border-radius: 4px; cursor: pointer; width: 100%; box-sizing: border-box;">
                                <input type="checkbox" class="chk-item ms-item-${campoId}" value="${val.replace(/"/g, '&quot;')}" onchange="verificarSelectAll('${campoId}')" style="margin-top: 2px; flex-shrink: 0;"> 
                                <span style="word-break: break-word; line-height: 1.3;">${val || '(Vazio)'}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="excel-dropdown-actions" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                        <button class="btn-excel-ok" onclick="aplicarFiltro('${campoId}')" style="padding: 4px 12px; background: #0284c7; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 600;">OK</button>
                        <button class="btn-excel-limpar" onclick="fecharDropdownSemSalvar('${campoId}')" style="padding: 4px 12px; background: #e2e8f0; color: #334155; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">Cancelar</button>
                    </div>
                </div>
            </th>`;
    });

    html += `</tr></thead><tbody id="tbody_rows_${tipo}"></tbody></table></div>`;
    
    html += `<div id="container_btn_mais_${tipo}" style="text-align: center; margin-top: 20px; display: none;">
                <button onclick="carregarMais('${tipo}')" style="padding: 10px 24px; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: background-color 0.2s;">
                    Carregar mais 50 registros...
                </button>
             </div>`;
             
    container.innerHTML = html;
}

// Auxiliar para gerar o bloco no padrão de relatório (estilo SIOPS/Contábil)
function gerarBlocoRelatorio(titulo, total, itens, corFundo = '#84cc16') {
    const itensHTML = itens && itens.length > 0 
        ? itens.map(item => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-family: monospace; font-size: 13px; width: 200px;">${item['Nat.Despesa'] || ''}</td>
                <td style="padding: 8px 12px; font-size: 13px;">${item['Descrição'] || ''}</td>
                <td style="padding: 8px 12px; text-align: right; font-weight: 500; font-size: 13px; width: 180px; white-space: nowrap;">${formatarMoeda(limparEConverterNumero(item['Valor Receita']))}</td>
            </tr>
          `).join('')
        : `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic;">Nenhum lançamento encontrado para esta regra.</td></tr>`;

    return `
        <div style="margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="background-color: ${corFundo}; color: #0f172a; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-style: italic; font-size: 14px;">
                <span>${titulo}</span>
                <span style="font-style: normal; font-weight: 700;">${formatarMoeda(total)}</span>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        ${itensHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderizarTabela() {
    // ---------------- RECEITAS ----------------
    const receitasFiltradas = obterDadosFiltrados('receitas');
    const tbodyRec = document.getElementById('tbody_rows_receitas');
    const containerBtnMaisRec = document.getElementById('container_btn_mais_receitas');

    if (tbodyRec) {
        const receitasExibidas = receitasFiltradas.slice(0, limiteReceitas);
        
        tbodyRec.innerHTML = receitasExibidas.map(item => `
            <tr>
                <td style="word-wrap: break-word; max-width: 150px;">${item['Nat.Despesa']}</td>
                <td style="word-wrap: break-word; max-width: 300px;">${item['Descrição']}</td>
                <td class="text-right" style="white-space: nowrap;">${formatarMoeda(limparEConverterNumero(item['Valor Receita']))}</td>
            </tr>
        `).join('');

        if (containerBtnMaisRec) {
            containerBtnMaisRec.style.display = receitasFiltradas.length > limiteReceitas ? 'block' : 'none';
        }
    }

    // Processamento dos blocos detalhados de Receitas
    const dadosReceitaProc = processarDadosReceitas(receitasFiltradas);

    // Renderiza os blocos contábeis estilo SIOPS na aba de Receitas
    const containerBlocos = document.getElementById('container-blocos-receitas');
    if (containerBlocos) {
        
        // --- LÓGICA DE DATA AUTOMÁTICA ---
        const dataAtual = new Date();
        const mesAtual = dataAtual.toLocaleString('pt-BR', { month: 'long' }).toUpperCase(); 
        const anoAtual = dataAtual.getFullYear();
        const textoReferencia = `${mesAtual}/${anoAtual}`;
        // ---------------------------------

        containerBlocos.innerHTML = `
            <!-- NOVO CABEÇALHO DO RELATÓRIO (Clone Visual Oficial) -->
            <div style="font-family: Arial, Helvetica, sans-serif; text-align: center; background-color: #fff; margin-bottom: 25px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
                
                <!-- Seção do Brasão com as linhas de fundo -->
                <div style="position: relative; height: 120px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 10px;">
                    <!-- Linha fina superior -->
                    <div style="position: absolute; top: 35px; left: 0; right: 0; height: 1px; background-color: #999; z-index: 1;"></div>
                    <!-- Linha grossa inferior -->
                    <div style="position: absolute; top: 60px; left: 0; right: 0; height: 3px; background-color: #000; z-index: 1;"></div>
                    <!-- Brasão com fundo branco para sobrepor as linhas (Arquivo Local) -->
                    <img src="./brasao.png" alt="Brasão Oficial" style="height: 105px; position: relative; z-index: 2; background-color: #fff; padding: 0 25px;">
                </div>

                <!-- Títulos da Prefeitura -->
                <div style="border-top: 1px solid #ccc; padding-top: 12px; margin-top: -10px;">
                    <div style="font-size: 17px; font-weight: bold; color: #000; margin-bottom: 5px;">PREFEITURA MUNICIPAL DE BOTUCATU</div>
                    <div style="font-size: 15px; font-weight: bold; color: #000; margin-bottom: 7px;">SECRETARIA MUNICIPAL DA FAZENDA</div>
                    <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 10px;">Departamento de Planejamento, Orçamento e Gestão Econômica</div>
                </div>

                <!-- Faixa Referência Dinâmica (Cinza Escuro) -->
                <div style="background-color: #a6a6a6; border-top: 1px solid #999; border-bottom: 1px solid #999; padding: 7px 0;">
                    <span style="font-size: 15px; color: #000;">Referência - <strong>${textoReferencia}</strong></span>
                </div>

                <!-- Faixa Educação e Subtítulos -->
                <div style="margin-top: 15px;">
                    <div style="background-color: #e2e2e2; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 7px 0;">
                        <span style="font-size: 16px; font-weight: bold; color: #000;">EDUCAÇÃO</span>
                    </div>
                    <div style="padding: 12px 0; background-color: #fcfcfc; border-bottom: 1px solid #ccc;">
                        <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 3px;">MANUTENÇÃO E DESENVOLVIMENTO DO ENSINO</div>
                        <div style="font-size: 14px; font-weight: bold; color: #000;">ART.212 - CONSTITUIÇÃO FEDERAL</div>
                    </div>
                </div>
            </div>

            <!-- Título Impostos e Transferências -->
            <div style="background-color: #84cc16; color: #000; padding: 10px 15px; font-weight: bold; font-style: italic; border-radius: 5px; margin-bottom: 10px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                IMPOSTOS E TRANSFERÊNCIAS
            </div>

            ${gerarBlocoRelatorio('MUNICIPAL (Col. R: 1112, 1113, 1114)', dadosReceitaProc.municipal.total, dadosReceitaProc.municipal.itens, '#84cc16')}
            ${gerarBlocoRelatorio('UNIÃO - FPM (Col. R: 1711)', dadosReceitaProc.uniaoFPM.total, dadosReceitaProc.uniaoFPM.itens, '#a3e635')}
            ${gerarBlocoRelatorio('ESTADO (Col. R: 1721.50, 1721.51, 1721.52)', dadosReceitaProc.estado.total, dadosReceitaProc.estado.itens, '#bef264')}
            ${gerarBlocoRelatorio('TOTAL DE IMPOSTOS E TRANSFERÊNCIAS (Soma Municipal + União + Estado)', dadosReceitaProc.totalImpostosTransferencias, [], '#38bdf8')}
            ${gerarBlocoRelatorio('APLICAÇÃO OBRIGATÓRIA (25%)', dadosReceitaProc.aplicacaoObrigatoria25, [], '#34d399')}
            ${gerarBlocoRelatorio('DEDUÇÕES PARA FORMAÇÃO - FUNDEB (Col. R: 9510)', dadosReceitaProc.deducoes.total, dadosReceitaProc.deducoes.itens, '#fbbf24')}
            ${gerarBlocoRelatorio('APLICAÇÃO MÍNIMA OBRIGATÓRIA - RECURSOS PRÓPRIOS (25% - Deduções FUNDEB)', dadosReceitaProc.aplicacaoMinimaRecursosProprios, [], '#c084fc')}
            ${gerarBlocoRelatorio('FUNDEB (Col. R: 1751.50... / 1321.01...)', dadosReceitaProc.fundeb.total, dadosReceitaProc.fundeb.itens, '#38bdf8')}
            ${gerarBlocoRelatorio('TRANSFERÊNCIA RECURSOS FUNDEB DESTINADOS CRIAÇÃO MATRÍCULAS E.T (Col. R: 1715.53.0.1.01.00)', dadosReceitaProc.fundebMatriculasET.total, dadosReceitaProc.fundebMatriculasET.itens, '#38bdf8')}
            
            <!-- NOVA CAMADA: Título Receitas Adicionais -->
            <div style="background-color: #67e8f9; color: #000; padding: 10px 15px; font-weight: bold; font-style: italic; border-radius: 5px; margin-top: 20px; margin-bottom: 10px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                RECEITAS ADICIONAIS PARA O FINANCIAMENTO DO ENSINO
            </div>

            ${gerarBlocoRelatorio('RECEITA DA APLICAÇÃO FINANCEIRA (Col. R: 1321.01.1.1.02.01, .02, .04, .05, .08, .11)', dadosReceitaProc.aplicacaoFinanceira.total, dadosReceitaProc.aplicacaoFinanceira.itens, '#67e8f9')}
            ${gerarBlocoRelatorio('RECEITA DE TRANSFERÊNCIAS DO FNDE (Col. R: Começa com 1714)', dadosReceitaProc.fnde.total, dadosReceitaProc.fnde.itens, '#38bdf8')}
            ${gerarBlocoRelatorio('RECEITA DE TRANSFERÊNCIAS DO ESTADO (Col. R: 1724.51.0.1.02.00, .03.00)', dadosReceitaProc.estadoTransferencias.total, dadosReceitaProc.estadoTransferencias.itens, '#38bdf8')}
            ${gerarBlocoRelatorio('TOTAL - RECEITAS ADICIONAIS PARA O FINANCIAMENTO DO ENSINO (Soma Apl. Finan. + FNDE + Transf. Estado)', dadosReceitaProc.totalReceitasAdicionaisEnsino, [], '#0284c7')}
        `;
    }

    // ---------------- DESPESAS ----------------
    const despesasFiltradas = obterDadosFiltrados('despesas');
    const tbodyDesp = document.getElementById('tbody_rows_despesas');
    const containerBtnMaisDesp = document.getElementById('container_btn_mais_despesas');

    if (tbodyDesp) {
        const despesasExibidas = despesasFiltradas.slice(0, limiteDespesas);
        
        tbodyDesp.innerHTML = despesasExibidas.map(item => `
            <tr>
                <td style="word-wrap: break-word; max-width: 150px;">${item['Função/SubFunção']}</td>
                <td style="word-wrap: break-word; max-width: 250px;">${item['Vínculo']}</td>
                <td class="text-right" style="white-space: nowrap;">${formatarMoeda(limparEConverterNumero(item['Valor Empenhado']))}</td>
                <td class="text-right" style="white-space: nowrap;">${formatarMoeda(limparEConverterNumero(item['Valor Liquidado']))}</td>
                <td class="text-right" style="white-space: nowrap;">${formatarMoeda(limparEConverterNumero(item['Valor Pago']))}</td>
            </tr>
        `).join('');

        if (containerBtnMaisDesp) {
            containerBtnMaisDesp.style.display = despesasFiltradas.length > limiteDespesas ? 'block' : 'none';
        }
    }
}

// ==========================================================================
/* INJEÇÃO DA INTERFACE */
// ==========================================================================

document.getElementById('btn-processar').addEventListener('click', async () => {
    const inputReceitas = document.getElementById('csv-receitas').files[0];
    const inputDespesas = document.getElementById('csv-despesas').files[0];

    if (!inputReceitas || !inputDespesas) {
        alert('Por favor, selecione os dois arquivos antes de continuar.');
        return;
    }

    try {
        const [textoReceitas, textoDespesas] = await Promise.all([
            lerArquivo(inputReceitas),
            lerArquivo(inputDespesas)
        ]);

        const mapeamentoReceitas = { 'R': 'Nat.Despesa', 'K': 'Descrição', 'AB': 'Valor Receita' };
        const mapeamentoDespesas = { 'BJ': 'Função/SubFunção', 'BW': 'Vínculo', 'L': 'Valor Empenhado', 'N': 'Valor Liquidado', 'P': 'Valor Pago' };

        dadosGlobaisReceitas = converterCSVParaObjeto(textoReceitas, mapeamentoReceitas);
        dadosGlobaisDespesas = converterCSVParaObjeto(textoDespesas, mapeamentoDespesas);

        filtrosAplicados = {};
        limiteReceitas = 50;
        limiteDespesas = 50;

        const dashboard = document.getElementById('dashboard');
        dashboard.classList.remove('hidden');
        
        dashboard.style.width = "95%"; 
        dashboard.style.maxWidth = "1300px"; 
        dashboard.style.margin = "0 auto";
        dashboard.style.padding = "0 15px";
        dashboard.style.boxSizing = "border-box";

        document.getElementById('resultado-status').innerHTML = `
            <div class="abas-navegacao" style="margin: 10px 0 20px 0; text-align: center; display: flex; justify-content: center; width: 100%;">
                <button id="btn-tab-receitas" onclick="alternarAba('receitas')">Receitas</button>
                <button id="btn-tab-despesas" onclick="alternarAba('despesas')">Despesas</button>
            </div>

            <!-- Módulo de Receitas com Botões de Alternância (Relatório vs Tabela) e Exportação CSV -->
            <div id="modulo-receitas" style="width: 100%; box-sizing: border-box; margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; background: white; padding: 15px; border-radius: 8px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <h3 style="margin: 0; color: #1e293b; font-size: 1.3rem; margin-right: 15px;">Receitas</h3>
                        <button id="btn-visao-relatorio" onclick="alternarVisaoReceitas('relatorio')" style="padding: 8px 18px; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">📊 Demonstrativo</button>
                        <button id="btn-visao-tabela" onclick="alternarVisaoReceitas('tabela')" style="padding: 8px 18px; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">📋 Tabela</button>
                    </div>
                    
                    <!-- BARRAS DE AÇÃO: Imprimir, XLSX, CSV -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="imprimirRelatorio()" style="padding: 8px 14px; background-color: #475569; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: opacity 0.2s;">
                            🖨️ Imprimir Relatório
                        </button>
                        <button onclick="exportarReceitasXLSX(this)" style="padding: 8px 14px; background-color: #0369a1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: opacity 0.2s;">
                            📊 Exportar (XLSX)
                        </button>
                        <button onclick="exportarReceitasCSV()" style="padding: 8px 14px; background-color: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: opacity 0.2s;">
                            📥 Exportar (CSV)
                        </button>
                    </div>
                </div>

                <!-- Visão 1: Blocos de Relatório / Funções -->
                <div id="container-blocos-receitas" style="display: block;"></div>

                <!-- Visão 2: Tabela de Manipulação de Dados (Oculta por padrão) -->
                <div id="container-tabela-receitas-wrapper" style="display: none; background: white; padding: 15px; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: #334155; font-size: 1.1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Manipulação de Dados da Tabela</h4>
                    <div id="nova-tabela-receitas"></div>
                </div>
            </div>

            <div id="modulo-despesas" style="width: 100%; box-sizing: border-box; margin-top: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: none;">
                <h3 style="margin-bottom: 15px; color: #1e293b; font-size: 1.3rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Detalhamento de Despesas</h3>
                <div id="nova-tabela-despesas"></div>
            </div>
        `;

        construirEstruturaTabelaBase(dadosGlobaisReceitas, 'nova-tabela-receitas', 'receitas');
        construirEstruturaTabelaBase(dadosGlobaisDespesas, 'nova-tabela-despesas', 'despesas');

        renderizarTabela();
        
        const divsAntigasHTML = document.querySelectorAll('#tabela-receitas-container, #tabela-despesas-container');
        divsAntigasHTML.forEach(div => {
            if(div.parentElement) div.parentElement.style.display = 'none';
        });

        alternarAba('receitas');

    } catch (erro) {
        console.error(erro);
        alert(`Erro durante o processamento: ${erro.message}`);
    }
});
