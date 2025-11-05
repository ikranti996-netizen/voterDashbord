// src/App.jsx
import React, { useMemo, useState } from "react";
import votersData from "./data/voters.json";
import bannerUrl from "./assets/banner.jpeg";
import resultPhoto from "./assets/mama.jpeg";

// Mobile-optimized, single-file React component
// - Keeps all original functionality (aggregation, selection, CSV export)
// - Improves responsive behavior for phones/tablets: touch-friendly sizes, stacked rows on narrow screens,
//   scrollable chips, flexible grid columns, and better breakpoints.
// - Uses an embedded style block so you can drop this file straight into your project.

function extractSurnameImproved(voter, stats) {
  const normalize = (s) => (s || "").toString().trim().replace(/[.,\/\\()\[\]"'`:-]/g, "");
  const fullName = normalize(voter.name_english || voter.name_marathi || "");
  if (!fullName) return "Unknown";
  const tokens = fullName.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "Unknown";

  const first = tokens[0];
  let last = tokens[tokens.length - 1];

  if (last.length <= 2 && tokens.length > 1) {
    last = first;
  }

  let candidate = last;
  if (stats) {
    const fFreq = stats.firstFreq.get(first) || 0;
    const lFreq = stats.lastFreq.get(last) || 0;

    if (fFreq > lFreq) candidate = first;
    else if (fFreq === lFreq) candidate = tokens.length >= 3 ? first : last;
  } else {
    candidate = tokens.length >= 3 ? first : last;
  }

  if (/[\u0900-\u097F]/.test(candidate)) return candidate;

  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}

export default function App() {
  const stats = useMemo(() => {
    const firstFreq = new Map();
    const lastFreq = new Map();
    (votersData || []).forEach((v) => {
      const normalize = (s) => (s || "").toString().trim().replace(/[.,\/\\()\[\]"'`:-]/g, "");
      const full = normalize(v.name_english || v.name_marathi || "");
      if (!full) return;
      const tokens = full.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return;
      const f = tokens[0];
      const l = tokens[tokens.length - 1];
      firstFreq.set(f, (firstFreq.get(f) || 0) + 1);
      lastFreq.set(l, (lastFreq.get(l) || 0) + 1);
    });
    return { firstFreq, lastFreq };
  }, []);

  const [selectedSurname, setSelectedSurname] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showTopN, setShowTopN] = useState(8);

  const { surnameCounts, surnameBuckets } = useMemo(() => {
    const map = new Map();
    const buckets = {};

    (votersData || []).forEach((v) => {
      const s = extractSurnameImproved(v, stats) || "Unknown";
      const key = s.toString();
      if (!map.has(key)) map.set(key, 0);
      map.set(key, map.get(key) + 1);
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(v);
    });

    const counts = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { surnameCounts: counts, surnameBuckets: buckets };
  }, [stats]);

  const topSurnames = surnameCounts.slice(0, showTopN);
  const maxCount = topSurnames.length ? Math.max(...topSurnames.map((s) => s.count)) : 1;

  const selectSurname = (name) => {
    setSelectedSurname((prev) => (prev === name ? null : name));
    setSelectedIds(new Set());
  };

  const toggleSelectRecord = (voterId) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(voterId)) copy.delete(voterId);
      else copy.add(voterId);
      return copy;
    });
  };

  const exportCSV = (onlySelected = false) => {
    const rows = [];
    const headers = [
      "box_number",
      "name_english",
      "name_marathi",
      "relative_name_english",
      "relative_name_marathi",
      "voter_id",
      "part_no",
      "age",
      "gender",
      "address",
    ];
    rows.push(headers.join(","));

    const gather = (arr) =>
      arr.forEach((v) => {
        if (onlySelected && !selectedIds.has(v.voter_id)) return;
        const row = headers.map((h) => {
          const raw = v[h] === undefined || v[h] === null ? "" : String(v[h]);
          const val = raw.replace(/"/g, '""');
          if (/[,\n\r]/.test(val)) return `"${val}"`;
          return val;
        });
        rows.push(row.join(","));
      });

    if (selectedSurname) gather(surnameBuckets[selectedSurname] || []);
    else {
      if (onlySelected) {
        const all = votersData.filter((v) => selectedIds.has(v.voter_id));
        gather(all);
      } else gather(votersData);
    }

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = selectedSurname ? `voters_${selectedSurname}.csv` : "voters_export.csv";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAllVisible = () => {
    const visible = selectedSurname ? surnameBuckets[selectedSurname] || [] : votersData;
    const newSet = new Set(selectedIds);
    const allIds = visible.map((v) => v.voter_id);
    const allSelected = allIds.every((id) => newSet.has(id));
    if (allSelected) allIds.forEach((id) => newSet.delete(id));
    else allIds.forEach((id) => newSet.add(id));
    setSelectedIds(newSet);
  };

  const displayName = (v) => v.name_english || v.name_marathi || "-";

  return (
    <div className="app-root">
      <style>{`
        :root{ --bg:#f8fafc; --muted:#64748b; --brand:#0b57d0; --panel-bg:#ffffff; --gap:14px; --radius:12px; }
        *{box-sizing:border-box}
        .app-root{ font-family: Inter, system-ui, -apple-system, Roboto, Arial, sans-serif; min-height:100vh; background: linear-gradient(180deg,var(--bg) 0%, #f1f5f9 100%); color:#0f172a; padding:18px 12px 40px; }
        .shell{ max-width:1200px; margin:0 auto; padding:0 12px; }
        .header{ display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px; }
        .brand{ display:flex; gap:12px; align-items:center; }
        .title{ margin:0; font-size:18px; color:var(--brand); }
        .sub{ color:var(--muted); font-size:13px }

        .hero{ border-radius:var(--radius); overflow:hidden; position:relative; min-height:120px; display:flex; align-items:center; margin-bottom:16px; box-shadow:0 10px 30px rgba(2,6,23,0.06); }
        .hero img{ width:100%; height:120px; object-fit:cover; display:block; }

        /* Layout: left, center, right — flexible & safe for narrow screens */
        .layout{ display:grid; grid-template-columns: minmax(240px,320px) 1fr minmax(260px,420px); gap:var(--gap); align-items:start; }
        .panel{ background:var(--panel-bg); border-radius:var(--radius); padding:12px; box-shadow:0 8px 26px rgba(2,6,23,0.04); border:1px solid rgba(2,6,23,0.04); }

        /* Chips (surname quick-select) */
        .chipsWrap{ display:flex; gap:8px; flex-wrap:nowrap; overflow-x:auto; padding-bottom:6px; -webkit-overflow-scrolling:touch; }
        .chip{ flex:0 0 auto; display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; background:#f8fafc; cursor:pointer; margin:6px 0; border:1px solid rgba(15,23,42,0.04); font-weight:600; white-space:nowrap; }
        .chip.active{ background: linear-gradient(90deg,#fed7aa,#ffedd5); border:1px solid rgba(2,6,23,0.06); box-shadow:0 10px 28px rgba(249,115,22,0.06); }

        /* Bar chart (compact) */
        .barContainer{ display:flex; flex-direction:column; gap:8px; padding-top:8px; }
        .barRow{ display:flex; align-items:center; gap:12px; }
        .barLabel{ min-width:90px; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bar{ height:18px; border-radius:10px; background:#eef2ff; flex:1; overflow:hidden; position:relative; }
        .barFill{ height:100%; border-radius:10px; background: linear-gradient(90deg,#60a5fa,#0ea5e9); box-shadow:0 6px 18px rgba(14,165,233,0.12); }

        .legend{ display:flex; align-items:center; gap:10px; margin-top:12px; flex-wrap:wrap; }

        /* Voter list */
        .list{ max-height:520px; overflow:auto; }
        .row{ display:grid; grid-template-columns:84px 1fr 110px; gap:12px; align-items:center; padding:10px 8px; border-bottom:1px solid rgba(2,6,23,0.04); }
        .avatar{ width:64px; height:64px; border-radius:8px; object-fit:cover; border:2px solid #fff; box-shadow:0 8px 20px rgba(2,6,23,0.06); }

        .controls{ display:flex; gap:8px; align-items:center; }
        .btn{ background:var(--brand); color:#fff; padding:10px 14px; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:14px; }
        .btnGhost{ background:transparent; border:1px solid rgba(2,6,23,0.06); padding:9px 12px; border-radius:10px; cursor:pointer; }

        footer{ margin-top:18px; text-align:center; color:var(--muted); font-size:13px }

        /* Smaller screens: tablet -> single column */
        @media (max-width:1100px){
          .layout{ grid-template-columns: 1fr 1fr; }
          .hero img{ height:110px; }
          .avatar{ width:56px; height:56px; }
          .panel{ padding:10px; }
        }

        /* Mobile: stack, enlarge touch targets, make rows vertical */
        @media (max-width:700px){
          .header{ flex-direction:column; align-items:flex-start; gap:10px; }
          .layout{ grid-template-columns:1fr; }
          .hero{ min-height:90px; }
          .hero img{ height:90px; }
          .row{ grid-template-columns:1fr; grid-auto-rows:auto; gap:8px; align-items:flex-start; }
          .row > div:nth-child(1){ display:flex; justify-content:flex-start; }
          .row > div:nth-child(3){ text-align:left; }
          .avatar{ width:56px; height:56px; }

          /* Make action buttons full-width and large for touch */
          .controls{ width:100%; display:flex; gap:8px; flex-wrap:wrap; }
          .btn, .btnGhost{ flex:1 1 auto; padding:12px 14px; font-size:15px; }

          .barLabel{ min-width:70px; font-size:12px; }
          .chipsWrap{ gap:6px; padding:6px 2px; }

          .list{ max-height:420px; }
        }

        /* Extra small phones: reduce padding */
        @media (max-width:420px){
          .app-root{ padding:12px 8px 28px; }
          .chip{ padding:7px 10px; font-size:13px }
          .title{ font-size:16px }
        }

        /* Accessibility focus styles */
        .chip:focus, .btn:focus, .btnGhost:focus{ outline:3px solid rgba(11,87,208,0.12); outline-offset:2px; }
      `}</style>

      <div className="shell">
        <header className="header">
          <div className="brand">
            <div style={{ fontSize: 28 }}>🗳️</div>
            <div>
              <h3 className="title">Voter Surname Dashboard — Ward 7</h3>
              <div className="sub">Aggregate & export lists by surname</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Records: <strong>{votersData.length}</strong></div>
            <button className="btn" onClick={() => exportCSV(false)} aria-label="Export all voters as CSV">Export All CSV</button>
          </div>
        </header>

        <div className="hero" role="img" aria-label="Campaign banner">
          <img src={bannerUrl} alt="banner" />
        </div>

        <main className="layout">
          {/* Left panel — surname list & filters */}
          <aside className="panel" aria-label="Surnames">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong>Top surnames</strong>
              <div style={{ color: "#64748b", fontSize: 13 }}>show</div>
            </div>

            <div className="chipsWrap" aria-hidden={false}>
              {topSurnames.map((s) => (
                <button
                  key={s.name}
                  onClick={() => selectSurname(s.name)}
                  className={`chip ${selectedSurname === s.name ? "active" : ""}`}
                  title={`${s.name} — ${s.count}`}
                >
                  <div style={{ fontWeight: 800 }}>{s.name}</div>
                  <div style={{ color: "#475569", fontSize: 12 }}>{s.count}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <small style={{ color: "#94a3b8" }}>Bars show relative counts</small>

              <div className="barContainer">
                {topSurnames.map((s) => (
                  <div key={s.name} className="barRow">
                    <div className="barLabel">{s.name}</div>
                    <div className="bar" onClick={() => selectSurname(s.name)} role="button" aria-pressed={selectedSurname === s.name} tabIndex={0}>
                      <div
                        className="barFill"
                        style={{ width: `${(s.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <div style={{ width: 44, textAlign: "right", fontWeight: 700 }}>{s.count}</div>
                  </div>
                ))}
              </div>

              <div className="legend">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="range"
                    min={4}
                    max={20}
                    value={showTopN}
                    onChange={(e) => setShowTopN(Number(e.target.value))}
                    aria-label="Top surnames to show"
                  />
                  <small style={{ color: "#64748b" }}>Top {showTopN}</small>
                </label>
              </div>
            </div>
          </aside>

          {/* Center — chart & details */}
          <section className="panel" aria-label="Chart and details">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <strong style={{ fontSize: 16 }}>{selectedSurname ? `Records: ${surnameBuckets[selectedSurname]?.length ?? 0}` : "Surname distribution"}</strong>
                <div style={{ color: "#64748b", fontSize: 13 }}>{selectedSurname ? `Showing voters with surname: ${selectedSurname}` : "Click a surname to inspect its list"}</div>
              </div>

              <div className="controls">
                <button className="btnGhost" onClick={() => { setSelectedSurname(null); setSelectedIds(new Set()); }}>Clear</button>
                <button className="btn" onClick={() => exportCSV(false)}>Export All</button>
                <button className="btn" onClick={() => exportCSV(true)}>Export Visible</button>
              </div>
            </div>

            <div style={{ width: "100%", height: 220 }}>
              <svg className="svgChart" viewBox={`0 0 100 ${topSurnames.length * 10}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                {topSurnames.map((s, i) => {
                  const barLen = (s.count / maxCount) * 80;
                  return (
                    <g key={s.name} transform={`translate(0, ${i * 10})`}>
                      <rect x={15} y={1} width={barLen} height={8} rx={2} ry={2} onClick={() => selectSurname(s.name)} style={{ fill: "#60a5fa", cursor: "pointer" }} />
                      <text x={0} y={7} fontSize={3.8} fill="#0f172a">{s.name}</text>
                      <text x={Math.min(16 + barLen, 98)} y={7} fontSize={3.8} fill="#0f172a" textAnchor={barLen > 10 ? 'end' : 'start'}>{s.count}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ marginTop: 12 }}>
              <small style={{ color: "#64748b" }}>Tip: tap a surname either in the chips, the bars, or the right list to view individual records.</small>
            </div>
          </section>

          {/* Right — record list */}
          <aside className="panel" aria-label="Voter list">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong>{selectedSurname ? `List — ${selectedSurname}` : "All voters"}</strong>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btnGhost" onClick={toggleSelectAllVisible}>Toggle select</button>
                <button className="btn" onClick={() => exportCSV(true)}>Download Selected</button>
              </div>
            </div>

            <div className="list">
              {(selectedSurname ? (surnameBuckets[selectedSurname] || []) : votersData).map((v) => (
                <div key={v.voter_id || `${v.box_number}-${v.part_no}`} className="row" role="listitem">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <img className="avatar" src={v.photo || resultPhoto} alt="pic" onError={(e) => (e.currentTarget.src = resultPhoto)} />
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800 }}>{displayName(v)}</div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>{v.relative_name_english || v.relative_name_marathi}</div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: 110 }}>
                        <div style={{ color: "#0b57d0", fontWeight: 800 }}>{v.voter_id}</div>
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{v.part_no}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#475569", fontSize: 13 }}>{v.address || "N/A"}</div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <input type="checkbox" checked={selectedIds.has(v.voter_id)} onChange={() => toggleSelectRecord(v.voter_id)} />
                          <small style={{ color: "#64748b" }}>{v.age ?? "-"}</small>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, color: "#111827" }}>Box #{v.box_number ?? "-"}</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>{v.gender ?? "-"}</div>
                  </div>
                </div>
              ))}

              { (selectedSurname ? (surnameBuckets[selectedSurname] || []).length === 0 : votersData.length === 0) && (
                <div style={{ padding: 12, color: "#64748b" }}>No records to show.</div>
              ) }
            </div>
          </aside>
        </main>

        <footer>
          © {new Date().getFullYear()} Voter Surname Dashboard — built with care
        </footer>
      </div>
    </div>
  );
}
