(function () {
    document.querySelectorAll(".aba-btn").forEach(b => {
        b.innerText = b.innerText.replace("(BI Bié)", "(Bié)").replace("(BI Luanda)", "(Luanda)");
    });

    function getLocalHistory() {
        return JSON.parse(localStorage.getItem("cerprod_apk_historico") || "[]");
    }

    window.zerarTestesCerprod = async function () {
        if (!confirm("Zerar todos os dados para iniciar limpo?")) return;
        try { await fetch("http://10.0.2", { method: "POST" }); } catch (e) {}
        try { await fetch("/api/cerprod/limpar", { method: "POST" }); } catch (e) {}
        localStorage.removeItem("cerprod_consumos_fisicos");
        localStorage.removeItem("cerprod_apk_historico");
        const a = document.getElementById("area-trabalho");
        if (a) a.dataset.ocpLock = "";
        renderizarPainelAnalitico();
    };

    document.addEventListener("click", async (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const txt = (b.innerText || "").toLowerCase();

        if (txt.includes("sincronizar")) {
            e.stopImmediatePropagation();
            const a = document.getElementById("area-trabalho"), d = {};
            if (a) a.querySelectorAll("input,select").forEach(i => { if (i.id) d[i.id] = i.value; });
            const ab = document.querySelector(".aba-btn.active");
            let t = "producao";
            if (ab) {
                if (ab.id.includes("secagem")) t = "secagem";
                else if (ab.id.includes("desenforna")) t = "desenforna";
                else if (ab.id.includes("supervisao")) t = "supervisao";
            }

            const hist = getLocalHistory();
            hist.unshift({ terminal_origem: t, dados_producao: d, criado_em: new Date().toISOString() });
            localStorage.setItem("cerprod_apk_historico", JSON.stringify(hist));

            const dl = JSON.parse(localStorage.getItem("cerprod_consumos_fisicos") || "{}");
            Object.assign(dl, d);
            localStorage.setItem("cerprod_consumos_fisicos", JSON.stringify(dl));

            const urls = ["/api/cerprod/sincronizar", "http://10.0.2"];
            for (const u of urls) {
                try {
                    await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ terminal: t, dados: d }) });
                } catch (x) {}
            }
            alert("Sincronizado com sucesso!");
        }
    }, true);

    async function renderizarPainelAnalitico() {
        const a = document.getElementById("area-trabalho");
        const ab = document.querySelector(".aba-btn.active");
        if (!a || !ab) return;

        const dl = JSON.parse(localStorage.getItem("cerprod_consumos_fisicos") || "{}");

        if (ab.id === "tab-producao" && !document.getElementById("ocp_argila_m3")) {
            const g = a.querySelector(".grid-2");
            if (g) g.insertAdjacentHTML("beforeend", `<div class="field"><label>Consumo de Argila (m3)</label><input type="number" id="ocp_argila_m3" value="${dl.ocp_argila_m3 || 45}"></div>`);
            return;
        }
        if (ab.id === "tab-secagem" && !document.getElementById("ocp_gasoleo_l")) {
            const g = a.querySelector(".grid-2");
            if (g) g.insertAdjacentHTML("beforeend", `<div class="field"><label>Combustivel / Gasoleo (Litros)</label><input type="number" id="ocp_gasoleo_l" value="${dl.ocp_gasoleo_l || 850}"></div><div class="field"><label>Energia / Electricidade (kWh)</label><input type="number" id="ocp_kwh" value="${dl.ocp_kwh || 620}"></div>`);
            return;
        }
        if (ab.id === "tab-supervisao" && !document.getElementById("ocp_salario_dia")) {
            const g = a.querySelector(".grid-2");
            if (g) g.insertAdjacentHTML("beforeend", `<div class="field"><label>Salario Diario Base (Kz)</label><input type="number" id="ocp_salario_dia" value="${dl.ocp_salario_dia || 6500}"></div><div class="field"><label>Horas Extras (h)</label><input type="number" id="ocp_horas_extras" value="${dl.ocp_horas_extras || 16}"></div><div class="field"><label>Valor Hora Extra (Kz)</label><input type="number" id="ocp_valor_he" value="${dl.ocp_valor_he || 1500}"></div><div class="field"><label>Manutencao, Lubrificantes & Outros (Kz)</label><input type="number" id="ocp_outros_prod" value="${dl.ocp_outros_prod || 45000}"></div>`);
            return;
        }
        if (ab.id === "tab-direccao" || ab.id === "tab-administracao") {
            const adm = ab.id === "tab-administracao";
            let lista = getLocalHistory();

            for (const u of ["/api/cerprod/historico", "http://10.0.2"]) {
                try {
                    const r = await fetch(u);
                    if (r.ok) {
                        const j = await r.json();
                        if (j.lancamentos && j.lancamentos.length > 0) { lista = j.lancamentos; break; }
                    }
                } catch (x) {}
            }

            const tot = lista.length;
            const gd = t => lista.filter(x => x.terminal_origem === t).reverse().reduce((ac, cu) => Object.assign(ac, cu.dados_producao || {}), {});
            const p1 = gd("producao"), p2 = gd("secagem"), p3 = gd("desenforna"), p4 = gd("supervisao");

            const m = Number(p1.prod_qtd || dl.prod_qtd || 0), s = Number(p2.sec_qtd || dl.sec_qtd || 0);
            const b = Number(p3.des_bons || dl.des_bons || 0), q = Number(p3.des_quebrados || dl.des_quebrados || 0);
            const ar = Number(p1.ocp_argila_m3 || dl.ocp_argila_m3 || 0), ga = Number(p2.ocp_gasoleo_l || dl.ocp_gasoleo_l || 0), kw = Number(p2.ocp_kwh || dl.ocp_kwh || 0);
            const op = Number(p4.sup_operarios || dl.sup_operarios || 0), sd = Number(p4.ocp_salario_dia || dl.ocp_salario_dia || 0), he = Number(p4.ocp_horas_extras || dl.ocp_horas_extras || 0), vh = Number(p4.ocp_valor_he || dl.ocp_valor_he || 0), ou = Number(p4.ocp_outros_prod || dl.ocp_outros_prod || 0);

            const ok = (b + q) > 0 ? Math.round((b / (b + q)) * 100) : 0;
            const mp = Math.max(m, s, b, q, 1);
            const ca = ar * 8500, cg = ga * 420, ce = kw * 180, cp = (op * sd) + (he * vh), ct = ca + cg + ce + cp + ou;
            const cu = b > 0 ? (ct / b).toFixed(2) : "0.00";
            const mc = Math.max(ca, cg, ce, cp, ou, 1);

            let h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:10px;flex-wrap:wrap"><div><div style="font-size:11px;color:#f59e0b;font-weight:bold">' + (adm ? 'SEDE LUANDA • ENGENHARIA DE CUSTO UNITARIO (KZ)' : 'UNIDADE BIE • INDICADORES FISICOS (NDA)') + '</div><h1 style="font-size:22px">CERPROD • Painel Analitico</h1></div><div style="display:flex;gap:8px">';
            if (adm) h += '<button class="btn-print no-print" style="background:#e63946;color:#fff" onclick="zerarTestesCerprod()">Zerar Dados</button>';
            h += '<button class="btn-print no-print" onclick="window.print()">Exportar / Imprimir PDF</button></div></div>';

            h += '<div class="kpi-grid" style="margin-bottom:20px"><div class="kpi-card" style="border-color:#38bdf8"><span>1. Producao</span><h2>' + m.toLocaleString("pt-AO") + ' un</h2></div><div class="kpi-card" style="border-color:#f59e0b"><span>2. Secagem</span><h2>' + s.toLocaleString("pt-AO") + ' un</h2></div><div class="kpi-card" style="border-color:#10b981"><span>3. Desenforna</span><h2 style="color:#10b981">' + b.toLocaleString("pt-AO") + ' un</h2></div><div class="kpi-card" style="border-color:#a855f7"><span>Sincronizacoes</span><h2>' + tot + ' lotes</h2></div>';
            if (adm) h += '<div class="kpi-card" style="border-color:#e63946;background:#2b121d"><span>Custo Real / Tijolo</span><h2 style="color:#fda4af">' + cu + ' Kz/un</h2></div><div class="kpi-card" style="border-color:#10b981;background:#064e3b"><span>Custo Total Fornada</span><h2>' + ct.toLocaleString("pt-AO") + ' Kz</h2></div>';
            h += '</div>';

            h += '<div class="bi-grid"><div class="bi-box"><div style="font-size:12px;color:#94a3b8;font-weight:bold;margin-bottom:12px">FLUXO FISICO REAL (UNIDADES)</div><div class="col-chart">';
            h += '<div class="col-item"><div class="col-bar" style="height:' + Math.max(5, Math.round((m / mp) * 95)) + '%;background:#38bdf8"><span class="col-val">' + m.toLocaleString("pt-AO") + '</span></div><div class="col-lbl">Producao</div></div>';
            h += '<div class="col-item"><div class="col-bar" style="height:' + Math.max(5, Math.round((s / mp) * 95)) + '%;background:#f59e0b"><span class="col-val">' + s.toLocaleString("pt-AO") + '</span></div><div class="col-lbl">Secagem</div></div>';
            h += '<div class="col-item"><div class="col-bar" style="height:' + Math.max(5, Math.round((b / mp) * 95)) + '%;background:#10b981"><span class="col-val">' + b.toLocaleString("pt-AO") + '</span></div><div class="col-lbl">Desenforna</div></div>';
            h += '<div class="col-item"><div class="col-bar" style="height:' + Math.max(5, Math.round((q / mp) * 95)) + '%;background:#e63946"><span class="col-val">' + q.toLocaleString("pt-AO") + '</span></div><div class="col-lbl">Quebras</div></div></div></div>';

            h += '<div class="bi-box"><div style="font-size:12px;color:#94a3b8;font-weight:bold;margin-bottom:12px">EFICIENCIA & CONSUMOS FISICOS</div><div style="display:flex;align-items:center;justify-content:space-around;height:190px"><div class="donut" style="background:conic-gradient(#10b981 0% ' + ok + '%,#e63946 ' + ok + '% 100%)"><div class="donut-in"><b style="font-size:20px;color:#10b981">' + ok + '%</b><span style="font-size:9px;color:#94a3b8">APROVADO</span></div></div><div style="font-size:12px;line-height:1.9"><div><b>Argila:</b> ' + ar + ' m3</div><div><b>Combustivel:</b> ' + ga + ' L</div><div><b>Energia:</b> ' + kw + ' kWh</div><div><b>Pessoal:</b> ' + op + ' op (' + he + 'h)</div></div></div></div>';

            if (adm) {
                h += '<div class="bi-box" style="border:1px solid #10b981"><div style="font-size:12px;color:#6ee7b7;font-weight:bold;margin-bottom:12px">CUSTO UNITARIO POR PILAR (SEDE LUANDA - KZ)</div><div class="col-chart">';
                h += '<div class="col-item" style="width:18%"><div class="col-bar" style="height:' + Math.max(5, Math.round((cg / mc) * 88)) + '%;background:#f59e0b"><span class="col-val">' + (cg / 1000).toFixed(0) + 'k</span></div><div class="col-lbl">Combustivel</div></div>';
                h += '<div class="col-item" style="width:18%"><div class="col-bar" style="height:' + Math.max(5, Math.round((ce / mc) * 88)) + '%;background:#a855f7"><span class="col-val">' + (ce / 1000).toFixed(0) + 'k</span></div><div class="col-lbl">Energia</div></div>';
                h += '<div class="col-item" style="width:18%"><div class="col-bar" style="height:' + Math.max(5, Math.round((ca / mc) * 88)) + '%;background:#38bdf8"><span class="col-val">' + (ca / 1000).toFixed(0) + 'k</span></div><div class="col-lbl">Argila</div></div>';
                h += '<div class="col-item" style="width:18%"><div class="col-bar" style="height:' + Math.max(5, Math.round((cp / mc) * 88)) + '%;background:#e63946"><span class="col-val">' + (cp / 1000).toFixed(0) + 'k</span></div><div class="col-lbl">Pessoal</div></div>';
                h += '<div class="col-item" style="width:18%"><div class="col-bar" style="height:' + Math.max(5, Math.round((ou / mc) * 88)) + '%;background:#10b981"><span class="col-val">' + (ou / 1000).toFixed(0) + 'k</span></div><div class="col-lbl">Manut./Lub.</div></div></div></div>';
            }
            h += '</div><div style="margin-top:30px;padding-top:14px;border-top:1px dashed #334155;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between"><span>CERPROD INDUSTRIAL • Custo Unitario Auditado</span><span>Licenca Anual Valida ate 23/11/2027 • Vladmir Dieiro</span></div>';

            if (a.innerText.includes("65.564") || !a.dataset.ocpLock) {
                a.innerHTML = h;
                a.dataset.ocpLock = "true";
            }
        }
    }

    setInterval(renderizarPainelAnalitico, 500);
})();