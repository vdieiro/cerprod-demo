(function () {
    const SB_URL = "https://supabase.co";
    const SB_KEY = "sb_publishable_7k9Xv8oght25jsXBT_F2Jg_KRTx9dRLY";
    const HEADERS = {
        "apikey": SB_KEY,
        "Authorization": "Bearer " + SB_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };

    const origFetch = window.fetch;
    window.fetch = async function (url, opts) {
        if (typeof url === "string" && url.includes("/api/cerprod/sincronizar") && opts && opts.method === "POST") {
            try {
                const body = JSON.parse(opts.body || "{}");
                const d = body.dados || {};
                const dt = d.pr_data || d.sc_data || d.ds_data || d.sp_data || new Date().toISOString().slice(0, 10);
                await origFetch(SB_URL + "/rest/v1/cerprod_lancamentos", {
                    method: "POST",
                    headers: HEADERS,
                    body: JSON.stringify({ terminal_origem: body.terminal, data_turno: dt, dados_producao: d })
                });
            } catch (e) {}
        }
        if (typeof url === "string" && url.includes("/api/cerprod/historico")) {
            try {
                const r = await origFetch(SB_URL + "/rest/v1/cerprod_lancamentos?select=*&order=id.desc&limit=100", { headers: HEADERS });
                if (r.ok) {
                    const rows = await r.json();
                    const db = (typeof getDB === "function") ? getDB() : { historico: [] };
                    db.historico = rows;
                    localStorage.setItem("cerprod_v4_db", JSON.stringify(db));
                    return new Response(JSON.stringify({ success: true, total: rows.length, lancamentos: rows }), { status: 200 });
                }
            } catch (e) {}
        }
        if (typeof url === "string" && url.includes("/api/cerprod/limpar") && opts && opts.method === "POST") {
            try {
                await origFetch(SB_URL + "/rest/v1/cerprod_lancamentos?id=gt.0", { method: "DELETE", headers: HEADERS });
            } catch (e) {}
        }
        return origFetch.apply(this, arguments);
    };

    setInterval(() => {
        if (typeof PERFIL_ATUAL !== "undefined" && (PERFIL_ATUAL === "direccao" || PERFIL_ATUAL === "administracao")) {
            if (typeof render === "function") render(PERFIL_ATUAL);
        }
    }, 8000);
})();