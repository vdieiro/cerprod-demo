(function () {
    const st = document.createElement("style");
    st.innerHTML = `
        #cerprod-a4-print { display: none; }
        @media print {
            @page { size: A4 portrait; margin: 14mm 12mm; }
            body { background: #ffffff !important; color: #0f172a !important; }
            body > *:not(#cerprod-a4-print) { display: none !important; }
            #cerprod-a4-print { display: block !important; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
            .a4-header { border-bottom: 3px solid #0b132b; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
            .a4-title { font-size: 18px; font-weight: 800; color: #0b132b; letter-spacing: 0.3px; }
            .a4-sub { font-size: 10.5px; color: #475569; margin-top: 2px; }
            .a4-meta { text-align: right; font-size: 10px; color: #334155; line-height: 1.45; }
            .a4-sec { font-size: 11.5px; font-weight: 700; color: #0b132b; text-transform: uppercase; border-left: 4px solid #e63946; padding-left: 8px; margin: 14px 0 6px 0; }
            .a4-tbl { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 10px; }
            .a4-tbl th { background: #0b132b !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 6px 8px; text-align: left; font-weight: 600; }
            .a4-tbl td { border: 1px solid #cbd5e1; padding: 6px 8px; color: #1e293b; }
            .a4-tbl tr:nth-child(even) td { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .a4-kpi-box { border: 1.5px solid #0b132b; background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 9px 14px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; }
            .a4-signs { display: flex; justify-content: space-between; margin-top: 28px; page-break-inside: avoid; }
            .a4-sign-col { width: 45%; text-align: center; font-size: 10.5px; color: #334155; }
            .a4-sign-line { border-top: 1px solid #334155; margin-bottom: 4px; height: 32px; }
            .a4-foot { margin-top: 18px; border-top: 1px solid #cbd5e1; padding-top: 5px; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; }
        }
    `;
    document.head.appendChild(st);

    document.addEventListener("click", function (e) {
        const btn = e.target.closest("button");
        if (!btn) return;
        const txt = (btn.innerText || "").toLowerCase();
        if (!txt.includes("pdf") && !txt.includes("imprimir") && !txt.includes("print")) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        const isAdmin = (typeof PERFIL_ATUAL !== "undefined" && PERFIL_ATUAL === "administracao");
        const db = (typeof getDB === "function") ? getDB() : { historico: [] };
        const lista = db.historico || [];
        const filtro = (typeof FILTRO_DATA_HIST !== "undefined" && FILTRO_DATA_HIST) ? FILTRO_DATA_HIST : "";
        const listaFiltrada = filtro ? lista.filter(x => (x.data_turno || (x.criado_em || "").slice(0, 10)) === filtro) : lista;

        const gd = term => listaFiltrada.filter(x => x.terminal_origem === term).reverse().reduce((ac, cu) => Object.assign(ac, cu.dados_producao || {}), {});
        const p1 = gd("producao"), p2 = gd("secagem"), p3 = gd("desenforna"), p4 = gd("supervisao");

        const mold = Number(p1.pr_qtd || 0), sec = Number(p2.sc_qtd || 0), bons = Number(p3.ds_bons || 0), queb = Number(p3.ds_quebrados || 0);
        const argilaM3 = Number(p1.pr_argila || 0), combL = Number(p2.sc_combustivel || 0), energKwh = Number(p2.sc_energia || 0);
        const oper = Number(p4.sp_operarios || 0), sal = Number(p4.sp_salario || 0), he = Number(p4.sp_he || 0), vhe = Number(p4.sp_val_he || 0), cManut = Number(p4.sp_manutencao || 0);

        const cArgila = argilaM3 * Number(p4.sp_tf_argila || 0);
        const cComb = combL * Number(p4.sp_tf_comb || 0);
        const cEnerg = energKwh * Number(p4.sp_tf_energ || 0);
        const cPessoal = (oper * sal) + (he * vhe);
        const custoTotal = cArgila + cComb + cEnerg + cPessoal + cManut;
        const custoUnit = bons > 0 ? (custoTotal / bons) : 0;

        const totAprovAll = listaFiltrada.filter(x => x.terminal_origem === "desenforna").reduce((s, x) => s + Number((x.dados_producao || {}).ds_bons || 0), 0);
        const exps = listaFiltrada.filter(x => x.terminal_origem === "expedicao");
        const totExpAll = exps.reduce((s, x) => s + Number((x.dados_producao || {}).ex_qtd || 0), 0);
        const saldoPatio = Math.max(0, totAprovAll - totExpAll);
        const fatExp = exps.reduce((s, x) => s + (Number((x.dados_producao || {}).ex_qtd || 0) * Number((x.dados_producao || {}).ex_preco || 0)), 0);
        const totTri = bons + queb;
        const pctOk = totTri > 0 ? ((bons / totTri) * 100).toFixed(1).replace(".", ",") : "0,0";
        const agora = new Date();
        const dtEmissao = agora.toLocaleDateString("pt-AO") + " às " + agora.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
        const refDoc = "REL-V3-" + agora.getFullYear() + String(agora.getMonth() + 1).padStart(2, "0") + String(agora.getDate()).padStart(2, "0") + "-" + String(listaFiltrada.length).padStart(3, "0");

        const fN = n => Math.round(Number(n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        const fK = n => { const p = Number(n || 0).toFixed(2).split("."); return p.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + p + " Kz"; };
        const pctPilar = v => custoTotal > 0 ? ((v / custoTotal) * 100).toFixed(1).replace(".", ",") + "%" : "0,0%";

        const linhasTabela = listaFiltrada.map((item, idx) => {
            const d = item.dados_producao || {};
            const dt = item.data_turno || (item.criado_em ? item.criado_em.slice(0, 10) : "-");
            const tm = (item.terminal_origem || "").toUpperCase();
            let desc = "";
            if (tm === "PRODUCAO") desc = `Moldagem: ${fN(d.pr_qtd)} un | Argila: ${d.pr_argila || 0} m³`;
            else if (tm === "SECAGEM") desc = `Secagem/Forno: ${fN(d.sc_qtd)} un | Combustível: ${fN(d.sc_combustivel)} L | Energia: ${fN(d.sc_energia)} kWh`;
            else if (tm === "DESENFORNA") desc = `Aprovados: ${fN(d.ds_bons)} un | Quebras: ${fN(d.ds_quebrados)} un`;
            else if (tm === "SUPERVISAO") {
                const cSup = (Number(d.sp_operarios || 0) * Number(d.sp_salario || 0)) + (Number(d.sp_he || 0) * Number(d.sp_val_he || 0)) + Number(d.sp_manutencao || 0);
                desc = `Efectivo: ${d.sp_operarios || 0} op | H. extras: ${d.sp_he || 0} h` + (isAdmin ? ` | Encargos & Manut.: ${fK(cSup)}` : "");
            } else if (tm === "EXPEDICAO") {
                desc = `Camião: ${d.ex_camiao || "-"} | Cliente: ${d.ex_cliente || "-"} | Saída: ${fN(d.ex_qtd)} un` + (isAdmin ? ` (${fK(Number(d.ex_qtd || 0) * Number(d.ex_preco || 0))})` : "");
            }
            return `<tr><td>#${listaFiltrada.length - idx}</td><td>${dt}</td><td><b>${tm}</b></td><td>${desc}</td></tr>`;
        }).join("");

        let boxA4 = document.getElementById("cerprod-a4-print");
        if (!boxA4) { boxA4 = document.createElement("div"); boxA4.id = "cerprod-a4-print"; document.body.appendChild(boxA4); }

        boxA4.innerHTML = `<div class="a4-header"><div><div class="a4-title">CER<span style="color:#e63946">PROD</span> INDUSTRIAL V3.0</div><div class="a4-sub">${isAdmin ? "RELATÓRIO EXECUTIVO DE PRODUÇÃO, CUSTO UNITÁRIO & STOCK (SEDE LUANDA)" : "RELATÓRIO OPERACIONAL DE PRODUÇÃO & STOCK EM PÁTIO (UNIDADE BIÉ • NDA)"}</div></div><div class="a4-meta"><b>Doc. N.º:</b> ${refDoc}<br><b>Emissão:</b> ${dtEmissao}<br><b>Período:</b> ${filtro ? filtro : "Consolidado Geral (" + listaFiltrada.length + " registos)"}</div></div><div class="a4-sec">1. Síntese de Produção &amp; Eficiência Fabril</div><table class="a4-tbl"><thead><tr><th>1. Produção</th><th>2. Secagem &amp; Forno</th><th>3. Desenforna (Bons)</th><th>Quebras</th><th>Aproveitamento</th><th>Argila / Comb. / Energ.</th></tr></thead><tbody><tr><td><b>${fN(mold)} un</b></td><td><b>${fN(sec)} un</b></td><td><b>${fN(bons)} un</b></td><td>${fN(queb)} un</td><td><b>${pctOk}%</b></td><td>${argilaM3} m³ | ${fN(combL)} L | ${fN(energKwh)} kWh</td></tr></tbody></table><div class="a4-sec">2. Balanço de Stock em Pátio &amp; Expedição de Camiões</div><table class="a4-tbl"><thead><tr><th>Total Aprovado (Período)</th><th>Total Expedido (Saídas)</th><th>Saldo Disponível em Pátio</th>${isAdmin ? `<th>Facturação Bruta Expedida</th>` : ""}</tr></thead><tbody><tr><td>${fN(totAprovAll)} un</td><td>${fN(totExpAll)} un</td><td><b>${fN(saldoPatio)} un</b></td>${isAdmin ? `<td><b>${fK(fatExp)}</b></td>` : ""}</tr></tbody></table>${isAdmin ? `<div class="a4-sec">3. Demonstração Analítica de Custos por Pilar (Sede Luanda)</div><div class="a4-kpi-box"><div><span style="font-size:10px;color:#475569;text-transform:uppercase;font-weight:700">Custo Real Apurado por Tijolo</span><div style="font-size:17px;font-weight:800;color:#0b132b">${fK(custoUnit)} / un</div></div><div style="text-align:right"><span style="font-size:10px;color:#475569;text-transform:uppercase;font-weight:700">Custo Global Apurado</span><div style="font-size:17px;font-weight:800;color:#0b132b">${fK(custoTotal)}</div></div></div><table class="a4-tbl"><thead><tr><th>Pilar de Custo</th><th>Referência Física</th><th style="text-align:right">Valor (Kz)</th><th style="text-align:right">Peso (%)</th></tr></thead><tbody><tr><td>Combustível / Gasóleo</td><td>${fN(combL)} L × ${fK(p4.sp_tf_comb || 0)}</td><td style="text-align:right">${fK(cComb)}</td><td style="text-align:right">${pctPilar(cComb)}</td></tr><tr><td>Energia Eléctrica</td><td>${fN(energKwh)} kWh × ${fK(p4.sp_tf_energ || 0)}</td><td style="text-align:right">${fK(cEnerg)}</td><td style="text-align:right">${pctPilar(cEnerg)}</td></tr><tr><td>Matéria-Prima (Argila)</td><td>${argilaM3} m³ × ${fK(p4.sp_tf_argila || 0)}</td><td style="text-align:right">${fK(cArgila)}</td><td style="text-align:right">${pctPilar(cArgila)}</td></tr><tr><td>Mão-de-Obra &amp; Horas Extras</td><td>${oper} op + ${he} h extras</td><td style="text-align:right">${fK(cPessoal)}</td><td style="text-align:right">${pctPilar(cPessoal)}</td></tr><tr><td>Manutenção &amp; Lubrificantes</td><td>Lançamento directo de turno</td><td style="text-align:right">${fK(cManut)}</td><td style="text-align:right">${pctPilar(cManut)}</td></tr><tr><td colspan="2"><b>TOTAL GERAL DE CUSTOS</b></td><td style="text-align:right"><b>${fK(custoTotal)}</b></td><td style="text-align:right"><b>100,0%</b></td></tr></tbody></table>` : ""}<div class="a4-sec">${isAdmin ? "4." : "3."} Registo Cronológico Auditado de Operações</div><table class="a4-tbl"><thead><tr><th style="width:42px">ID</th><th style="width:88px">Data</th><th style="width:105px">Sector</th><th>Detalhe Operacional</th></tr></thead><tbody>${linhasTabela || `<tr><td colspan="4" style="text-align:center;color:#64748b">Sem lançamentos registados para o período.</td></tr>`}</tbody></table><div class="a4-signs"><div class="a4-sign-col"><div class="a4-sign-line"></div><b>Conferido por (Supervisão / Direcção Bié)</b><br>Data: ____/____/2026</div><div class="a4-sign-col"><div class="a4-sign-line"></div><b>Homologado por (${isAdmin ? "Administração Executiva Luanda" : "Direcção de Unidade"})</b><br>Assinatura e Carimbo</div></div><div class="a4-foot"><span>CERPROD INDUSTRIAL V3.0 • Documento Oficial para Arquivo Corporativo</span><span>Gerado automaticamente pelo sistema • Confidencial</span></div>`;
        window.print();
    }, true);
})();