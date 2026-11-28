(function () {
    function exportarExcelCSV() {
        const isAdmin = (typeof PERFIL_ATUAL !== "undefined" && PERFIL_ATUAL === "administracao");
        const db = (typeof getDB === "function") ? getDB() : { historico: [] };
        const lista = db.historico || [];
        if (lista.length === 0) { alert("Sem registos para exportar."); return; }

        let csv = "\uFEFFID;Data;Sector;Tijolos_Moldados;Argila_m3;Tijolos_Secos;Combustivel_L;Energia_kWh;Tijolos_Bons;Quebras;Efectivo;Horas_Extras;Expedidos_un;Cliente_Camiao" + (isAdmin ? ";Custo_Total_Turno_Kz;Facturacao_Kz" : "") + "\r\n";

        lista.forEach((item, idx) => {
            const d = item.dados_producao || {};
            const tm = (item.terminal_origem || "").toUpperCase();
            const dt = item.data_turno || (item.criado_em ? item.criado_em.slice(0, 10) : "");
            const cTurno = (Number(d.sp_operarios || 0) * Number(d.sp_salario || 0)) + (Number(d.sp_he || 0) * Number(d.sp_val_he || 0)) + Number(d.sp_manutencao || 0);
            const fatExp = Number(d.ex_qtd || 0) * Number(d.ex_preco || 0);

            const row = [
                lista.length - idx,
                dt,
                tm,
                d.pr_qtd || 0,
                d.pr_argila || 0,
                d.sc_qtd || 0,
                d.sc_combustivel || 0,
                d.sc_energia || 0,
                d.ds_bons || 0,
                d.ds_quebrados || 0,
                d.sp_operarios || 0,
                d.sp_he || 0,
                d.ex_qtd || 0,
                (d.ex_cliente || d.ex_camiao || "").replace(/;/g, ",")
            ];
            if (isAdmin) {
                row.push(cTurno.toFixed(2).replace(".", ","));
                row.push(fatExp.toFixed(2).replace(".", ","));
            }
            csv += row.join(";") + "\r\n";
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "CERPROD_AUDITORIA_" + new Date().toISOString().slice(0, 10) + ".csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    setInterval(() => {
        if (typeof PERFIL_ATUAL === "undefined" || (PERFIL_ATUAL !== "direccao" && PERFIL_ATUAL !== "administracao")) return;
        const main = document.getElementById("main");
        if (!main) return;

        // 1. Injeta botão Exportar Excel (.csv) ao lado do botão de PDF
        const btnPrint = main.querySelector("button[onclick*='print']");
        if (btnPrint && !document.getElementById("btn-export-csv-v3")) {
            const wrapBtns = document.createElement("div");
            wrapBtns.className = "noprint";
            wrapBtns.style.display = "flex";
            wrapBtns.style.gap = "8px";
            wrapBtns.style.flexWrap = "wrap";

            const btnCsv = document.createElement("button");
            btnCsv.id = "btn-export-csv-v3";
            btnCsv.type = "button";
            btnCsv.className = "btn-outline";
            btnCsv.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> Exportar Excel (.csv)`;
            btnCsv.onclick = exportarExcelCSV;

            btnPrint.parentNode.insertBefore(wrapBtns, btnPrint);
            wrapBtns.appendChild(btnCsv);
            wrapBtns.appendChild(btnPrint);
        }

        // 2. Injeta Monitor de Alertas de Desvio de Meta
        if (document.getElementById("box-alertas-meta-v3")) return;
        const isAdmin = (PERFIL_ATUAL === "administracao");
        const db = (typeof getDB === "function") ? getDB() : { historico: [] };
        const lista = db.historico || [];
        if (lista.length === 0) return;

        const gd = term => lista.filter(x => x.terminal_origem === term).reverse().reduce((ac, cu) => Object.assign(ac, cu.dados_producao || {}), {});
        const p1 = gd("producao"), p2 = gd("secagem"), p3 = gd("desenforna"), p4 = gd("supervisao");

        const sec = Number(p2.sc_qtd || 0), combL = Number(p2.sc_combustivel || 0);
        const bons = Number(p3.ds_bons || 0), queb = Number(p3.ds_quebrados || 0);
        const totTri = bons + queb;
        const pctQuebra = totTri > 0 ? ((queb / totTri) * 100) : 0;
        const consGasoleoMil = sec > 0 ? ((combL / sec) * 1000) : 0;

        const cTotal = (Number(p1.pr_argila || 0) * Number(p4.sp_tf_argila || 0)) +
                       (combL * Number(p4.sp_tf_comb || 0)) +
                       (Number(p2.sc_energia || 0) * Number(p4.sp_tf_energ || 0)) +
                       (Number(p4.sp_operarios || 0) * Number(p4.sp_salario || 0)) +
                       (Number(p4.sp_he || 0) * Number(p4.sp_val_he || 0)) +
                       Number(p4.sp_manutencao || 0);
        const custoUnit = bons > 0 ? (cTotal / bons) : 0;

        const alertas = [];
        if (pctQuebra > 5) alertas.push(`Índice de quebras em <b>${pctQuebra.toFixed(1).replace(".", ",")}%</b> (acima da meta máxima de 5,0%).`);
        if (consGasoleoMil > 75) alertas.push(`Consumo térmico de gasóleo em <b>${Math.round(consGasoleoMil)} L / 1 000 un</b> (acima do padrão de 75 L).`);
        if (isAdmin && custoUnit > 150) alertas.push(`Custo Real por tijolo em <b>${custoUnit.toFixed(2).replace(".", ",")} Kz/un</b> (acima da meta orçamental de 150,00 Kz).`);

        const banner = document.createElement("div");
        banner.id = "box-alertas-meta-v3";
        banner.className = "noprint";
        banner.style.padding = "12px 16px";
        banner.style.borderRadius = "8px";
        banner.style.marginBottom = "18px";
        banner.style.fontSize = "13px";

        if (alertas.length > 0) {
            banner.style.background = "rgba(245, 158, 11, 0.14)";
            banner.style.border = "1px solid #f59e0b";
            banner.style.color = "#fcd34d";
            banner.innerHTML = `<b>Atenção — Desvios de Meta Detectados:</b><ul style="margin:6px 0 0 18px;line-height:1.6">${alertas.map(a => `<li>${a}</li>`).join("")}</ul>`;
        } else {
            banner.style.background = "rgba(16, 185, 129, 0.12)";
            banner.style.border = "1px solid #10b981";
            banner.style.color = "#6ee7b7";
            banner.innerHTML = `<b>Conformidade Operacional:</b> Todos os indicadores do turno encontram-se dentro das metas industriais definidas.`;
        }

        const kpiRow = main.querySelector(".kpi-row");
        if (kpiRow) kpiRow.insertAdjacentElement("beforebegin", banner);
    }, 450);
})();