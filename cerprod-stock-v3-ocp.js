(function () {
    // 1. Injeta o card de Expedição de Camiões no perfil Desenforna & Triagem
    setInterval(() => {
        if (typeof PERFIL_ATUAL === "undefined" || PERFIL_ATUAL !== "desenforna") return;
        const main = document.getElementById("main");
        if (!main || document.getElementById("box-expedicao-v3")) return;

        const dtHoje = (typeof hojeISO === "function") ? hojeISO() : new Date().toISOString().slice(0, 10);
        const box = document.createElement("div");
        box.id = "box-expedicao-v3";
        box.className = "box";
        box.style.maxWidth = "780px";
        box.innerHTML = `
            <h3 style="font-size:18px">Expedição de Camiões &amp; Saída de Stock</h3>
            <div class="grid-form">
                <div><label>Data de expedição</label><input type="date" id="ex_data" value="${dtHoje}"></div>
                <div><label>Matrícula do camião / Guia</label><input type="text" id="ex_camiao" placeholder="Ex.: LD-45-88-AA"></div>
                <div><label>Cliente / Obra destino</label><input type="text" id="ex_cliente" placeholder="Ex.: Construtora Kuito"></div>
                <div><label>Tijolos expedidos (unidades)</label><input type="number" id="ex_qtd" placeholder="Ex.: 8 000"></div>
                <div><label>Preço de venda unitário (Kz)</label><input type="number" id="ex_preco" placeholder="Ex.: 160"></div>
            </div>
            <button type="button" class="btn-primary" style="margin-top:8px" id="btn-sync-exp">Registar Saída &amp; Expedição</button>
        `;
        main.appendChild(box);

        document.getElementById("btn-sync-exp").onclick = async function () {
            const qtd = Number(document.getElementById("ex_qtd").value || 0);
            if (qtd <= 0) { alert("Indique a quantidade de tijolos expedidos."); return; }
            const dados = {
                ex_data: document.getElementById("ex_data").value,
                ex_camiao: document.getElementById("ex_camiao").value || "N/D",
                ex_cliente: document.getElementById("ex_cliente").value || "Cliente Geral",
                ex_qtd: qtd,
                ex_preco: Number(document.getElementById("ex_preco").value || 0)
            };
            const db = (typeof getDB === "function") ? getDB() : { historico: [] };
            db.historico.unshift({ id: db.historico.length + 1, terminal_origem: "expedicao", data_turno: dados.ex_data, dados_producao: dados, criado_em: new Date().toISOString() });
            localStorage.setItem("cerprod_v4_db", JSON.stringify(db));
            try {
                await fetch("/api/cerprod/sincronizar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ terminal: "expedicao", dados: dados })
                });
            } catch (e) {}
            alert("Expedição registada e stock actualizado!");
            if (typeof render === "function") render("desenforna");
        };
    }, 350);

    // 2. Injeta o Quadro de Stock em Pátio & Expedição na Direcção e Administração
    setInterval(() => {
        if (typeof PERFIL_ATUAL === "undefined" || (PERFIL_ATUAL !== "direccao" && PERFIL_ATUAL !== "administracao")) return;
        const main = document.getElementById("main");
        if (!main || document.getElementById("box-stock-patio-v3")) return;

        const isAdmin = (PERFIL_ATUAL === "administracao");
        const db = (typeof getDB === "function") ? getDB() : { historico: [] };
        const lista = db.historico || [];

        const totAprovados = lista.filter(x => x.terminal_origem === "desenforna").reduce((s, x) => s + Number((x.dados_producao || {}).ds_bons || 0), 0);
        const exps = lista.filter(x => x.terminal_origem === "expedicao");
        const totExpedidos = exps.reduce((s, x) => s + Number((x.dados_producao || {}).ex_qtd || 0), 0);
        const saldoPatio = Math.max(0, totAprovados - totExpedidos);
        const receitaTotal = exps.reduce((s, x) => {
            const d = x.dados_producao || {};
            return s + (Number(d.ex_qtd || 0) * Number(d.ex_preco || 0));
        }, 0);

        const fN = n => Math.round(Number(n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        const fK = n => { const p = Number(n || 0).toFixed(2).split("."); return p.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + p + " Kz"; };

        const linhasExp = exps.slice(0, 15).map(x => {
            const d = x.dados_producao || {};
            return `<tr><td>${x.data_turno || "-"}</td><td><b>${d.ex_camiao || "-"}</b></td><td>${d.ex_cliente || "-"}</td><td>${fN(d.ex_qtd)} un</td>${isAdmin ? `<td>${fK(Number(d.ex_qtd || 0) * Number(d.ex_preco || 0))}</td>` : ""}</tr>`;
        }).join("");

        const secStock = document.createElement("div");
        secStock.id = "box-stock-patio-v3";
        secStock.className = "box";
        secStock.innerHTML = `
            <div style="font-size:13px;color:#cbd5e1;font-weight:600;margin-bottom:12px">Gestão de Stock em Pátio &amp; Expedição de Camiões</div>
            <div class="kpi-row" style="margin-bottom:14px">
                <div class="kpi"><span>Total Produzido (Aprovado)</span><h2>${fN(totAprovados)} un</h2></div>
                <div class="kpi"><span>Total Expedido (Saídas)</span><h2>${fN(totExpedidos)} un</h2></div>
                <div class="kpi"><span>Saldo Disponível em Pátio</span><h2 style="color:#10b981">${fN(saldoPatio)} un</h2></div>
                ${isAdmin ? `<div class="kpi"><span>Facturação Bruta Expedida</span><h2>${fK(receitaTotal)}</h2></div>` : ""}
            </div>
            <div style="overflow-x:auto">
                <table>
                    <thead><tr><th>Data</th><th>Camião / Guia</th><th>Cliente / Destino</th><th>Quantidade</th>${isAdmin ? `<th>Valor Facturado</th>` : ""}</tr></thead>
                    <tbody>${linhasExp || `<tr><td colspan="${isAdmin ? 5 : 4}" style="text-align:center;color:#64748b;font-style:italic;padding:14px">Nenhuma expedição registada até ao momento.</td></tr>`}</tbody>
                </table>
            </div>
        `;
        const kpiRow = main.querySelector(".kpi-row");
        if (kpiRow) kpiRow.insertAdjacentElement("afterend", secStock);
    }, 450);
})();