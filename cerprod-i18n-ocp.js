(function () {
    let l = localStorage.getItem("cerprod_lang") || "PT";
    const d = {
        "PORTAL INDUSTRIAL MES/ERP • ACESSO RESTRITO": "INDUSTRIAL MES/ERP PORTAL • RESTRICTED ACCESS",
        "PERFIL DE UTILIZADOR": "USER PROFILE",
        "CÓDIGO PIN / PASSWORD": "PIN CODE / PASSWORD",
        "ENTRAR NO PORTAL": "LOGIN TO PORTAL",
        "MÓDULOS AUTORIZADOS": "AUTHORIZED MODULES",
        "TERMINAR SESSÃO": "LOGOUT",
        "ZERAR DADOS": "RESET DATA",
        "EXPORTAR / IMPRIMIR PDF": "EXPORT / PRINT PDF",
        "CERPROD • Painel Analitico": "CERPROD • Analytical Dashboard",
        "SEDE LUANDA • ENGENHARIA DE CUSTO UNITARIO (KZ)": "LUANDA HQ • UNIT COST ENGINEERING (KZ)",
        "UNIDADE BIE • INDICADORES FISICOS (NDA)": "BIÉ PLANT • PHYSICAL INDICATORS (NDA)",
        "1. PRODUCAO": "1. PRODUCTION",
        "2. SECAGEM": "2. DRYING",
        "3. DESENFORNA": "3. UNLOADING",
        "SINCRONIZACOES": "SYNCS",
        "CUSTO REAL / TIJOLO": "REAL COST / BRICK",
        "CUSTO TOTAL FORNADA": "TOTAL BATCH COST",
        "FLUXO FISICO REAL (UNIDADES)": "REAL PHYSICAL FLOW (UNITS)",
        "EFICIENCIA & CONSUMOS FISICOS": "EFFICIENCY & PHYSICAL CONSUMPTION",
        "CUSTO UNITARIO POR PILAR (SEDE LUANDA - KZ)": "UNIT COST BY PILLAR (LUANDA HQ - KZ)",
        "Producao": "Production",
        "Secagem": "Drying",
        "Desenforna": "Unloading",
        "Quebras": "Breakage",
        "APROVADO": "APPROVED",
        "Combustivel": "Fuel",
        "Energia": "Energy",
        "Argila": "Clay",
        "Pessoal": "Staff",
        "Manut./Lub.": "Maint./Lub.", "Argila:": "Clay:", "Combustivel:": "Fuel:", "Energia:": "Energy:", "Pessoal:": "Staff:",
        "ARQUIVO CRONOLÓGICO PERMANENTE (CONSULTA EXECUTIVA / VIAGENS)": "PERMANENT CHRONOLOGICAL ARCHIVE (EXECUTIVE / TRAVEL AUDIT)",
        "DATA & HORA": "DATE & TIME",
        "SETOR / TERMINAL": "SECTOR / TERMINAL",
        "RESUMO FÍSICO & CONSUMOS": "PHYSICAL SUMMARY & CONSUMPTION",
        "CUSTO APURADO (KZ)": "CALCULATED COST (KZ)",
        "Nenhum lançamento registado no histórico ainda.": "No records logged in history yet.",
        "CERPROD INDUSTRIAL • Custo Unitario Auditado": "CERPROD INDUSTRIAL • Audited Unit Cost",
        "Arquitetura SOLID (OCP)": "SOLID Architecture (OCP)",
        "Desenvolvido por Vladmir Dieiro": "Developed by Vladmir Dieiro"
    };

    window.mudarIdioma = function () {
        localStorage.setItem("cerprod_lang", l === "PT" ? "EN" : "PT");
        location.reload();
    };

    setInterval(() => {
        const t = document.querySelector(".topbar, .top, #login-box");
        if (t && !document.getElementById("btn-pt-en")) {
            const b = document.createElement("button");
            b.id = "btn-pt-en";
            b.type = "button";
            b.innerText = l === "PT" ? "🌐 PT | EN" : "🌐 EN | PT";
            b.style.cssText = "background:#1e293b;color:#38bdf8;border:1px solid #38bdf8;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:bold;cursor:pointer;margin-right:8px";
            b.onclick = window.mudarIdioma;
            t.appendChild(b);
        }
        if (l === "EN") {
            document.querySelectorAll("button,label,option,div,span,p,h1,h3,th,td").forEach(e => {
                if (e.children.length === 0) {
                    const x = (e.innerText || "").trim();
                    if (d[x]) e.innerText = d[x];
                }
            });
            document.querySelectorAll(".aba-btn").forEach(b => {
                b.innerHTML = b.innerHTML
                    .replace("1. Produção (Moldagem)", "1. Production (Molding)")
                    .replace("2. Secagem &amp; Forno", "2. Drying &amp; Kiln")
                    .replace("2. Secagem & Forno", "2. Drying & Kiln")
                    .replace("3. Desenforna &amp; Triagem", "3. Unloading &amp; Sorting")
                    .replace("3. Desenforna & Triagem", "3. Unloading & Sorting")
                    .replace("4. Supervisão de Turno", "4. Shift Supervision")
                    .replace("5. Direcção (Bié)", "5. Management (Bié)")
                    .replace("6. Administração (Luanda)", "6. Administration (Luanda)");
            });
            const h3 = document.querySelector("#ocp-historico-box h3");
            if (h3 && h3.innerText.includes("Histórico")) {
                h3.innerText = h3.innerText.replace("Histórico Auditado de Operações", "Audited Operations History").replace("registos", "records");
            }
        }
    }, 450);
})();