(function () {
    let ultimoTotalHist = -1;

    async function injetarTabelaHistorico() {
        const area = document.getElementById("area-trabalho");
        const aba = document.querySelector(".aba-btn.active");
        if (!area || !aba) return;
        if (aba.id !== "tab-direccao" && aba.id !== "tab-administracao") return;

        const isAdmin = (aba.id === "tab-administracao");
        let lista = [];
        try {
            const r = await fetch("/api/cerprod/historico");
            const j = await r.json();
            lista = (j.lancamentos && j.lancamentos.length > 0) ? j.lancamentos : JSON.parse(localStorage.getItem("cerprod_apk_historico") || "[]");
        } catch (e) { lista = JSON.parse(localStorage.getItem("cerprod_apk_historico") || "[]"); }

        const boxExistente = document.getElementById("ocp-historico-box");
        if (boxExistente && ultimoTotalHist === lista.length && boxExistente.dataset.perfil === aba.id) return;
        ultimoTotalHist = lista.length;

        const linhas = lista.slice(0, 30).map((item, idx) => {
            const d = item.dados_producao || {};
            const dt = item.criado_em ? new Date(item.criado_em).toLocaleString("pt-AO") : "Registo Local";
            const term = (item.terminal_origem || "").toUpperCase();

            let resumoFisico = "";
            let custoItemKz = 0;

            if (term === "PRODUCAO") {
                resumoFisico = `Moldados: ${Number(d.prod_qtd || 0).toLocaleString("pt-AO")} un | Argila: ${d.ocp_argila_m3 || 0} m³`;
                custoItemKz = Number(d.ocp_argila_m3 || 0) * 8500;
            } else if (term === "SECAGEM") {
                resumoFisico = `Enfornados: ${Number(d.sec_qtd || 0).toLocaleString("pt-AO")} un | Comb.: ${d.ocp_gasoleo_l || 0}L | Energia: ${d.ocp_kwh || 0}kWh`;
                custoItemKz = (Number(d.ocp_gasoleo_l || 0) * 420) + (Number(d.ocp_kwh || 0) * 180);
            } else if (term === "DESENFORNA") {
                resumoFisico = `Prontos: ${Number(d.des_bons || 0).toLocaleString("pt-AO")} un | Quebrados: ${Number(d.des_quebrados || 0).toLocaleString("pt-AO")} un`;
            } else if (term === "SUPERVISAO") {
                resumoFisico = `Operários: ${d.sup_operarios || 0} | H.Extras: ${d.ocp_horas_extras || 0}h`;
                custoItemKz = (Number(d.sup_operarios || 0) * Number(d.ocp_salario_dia || 0)) + (Number(d.ocp_horas_extras || 0) * Number(d.ocp_valor_he || 0)) + Number(d.ocp_outros_prod || 0);
            }

            return `<tr style="border-bottom:1px solid #233058">
                <td style="padding:10px 8px;color:#94a3b8;font-size:12px">#${lista.length - idx}</td>
                <td style="padding:10px 8px;font-size:12px">${dt}</td>
                <td style="padding:10px 8px"><span style="background:#1e293b;color:#38bdf8;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold">${term}</span></td>
                <td style="padding:10px 8px;font-size:12px">${resumoFisico}</td>
                ${isAdmin ? `<td style="padding:10px 8px;font-size:12px;font-weight:bold;color:#10b981;text-align:right">${custoItemKz > 0 ? custoItemKz.toLocaleString("pt-AO") + " Kz" : "—"}</td>` : ""}
            </tr>`;
        }).join("");

        const htmlHist = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
                <div>
                    <div style="font-size:11px;color:#38bdf8;font-weight:bold;text-transform:uppercase">Arquivo Cronológico Permanente (Consulta Executiva / Viagens)</div>
                    <h3 style="font-size:16px;margin-top:2px">Histórico Auditado de Operações (${lista.length} registos)</h3>
                </div>
            </div>
            <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;text-align:left">
                    <thead>
                        <tr style="border-bottom:2px solid #334155;color:#94a3b8;font-size:11px;text-transform:uppercase">
                            <th style="padding:8px">ID</th>
                            <th style="padding:8px">Data & Hora</th>
                            <th style="padding:8px">Setor / Terminal</th>
                            <th style="padding:8px">Resumo Físico & Consumos</th>
                            ${isAdmin ? `<th style="padding:8px;text-align:right">Custo Apurado (KZ)</th>` : ""}
                        </tr>
                    </thead>
                    <tbody>
                        ${linhas || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;font-size:12px">Nenhum lançamento registado no histórico ainda.</td></tr>`}
                    </tbody>
                </table>
            </div>`;

        let box = document.getElementById("ocp-historico-box");
        if (!box) {
            box = document.createElement("div");
            box.id = "ocp-historico-box";
            box.className = "bi-box";
            box.style.marginTop = "20px";
            const rodape=area.lastElementChild;if(rodape)area.insertBefore(box,rodape);else area.appendChild(box);
        }
        box.dataset.perfil = aba.id;
        box.innerHTML = htmlHist;
    }

    setInterval(injetarTabelaHistorico, 1000);
})();