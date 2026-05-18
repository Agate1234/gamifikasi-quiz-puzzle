import React from "react";

export default function HasilPuzzle({
  open,
  puzzleTitle = "Puzzle",
  puzzle,
  result,
  onBackToModule,
}) {
  if (!open) return null;

  const attempt = result?.attempt ?? puzzle?.attempt ?? 0;
  const xp = result?.xp ?? puzzle?.xp ?? puzzle?.exp_puzzle ?? 0;
  const waktu = result?.waktu ?? puzzle?.waktu ?? 0;

  const tipe = puzzle?.tipe_puzzle || puzzle?.type || result?.type || "-";
  const jawaban = puzzle?.jawaban || result?.jawaban || null;
  const hasil = puzzle?.hasil || result?.hasil || null;
  const detail = puzzle?.detail || {};

  const waktuText =
    waktu > 0
      ? `${Math.floor(Number(waktu) / 60)} menit ${Number(waktu) % 60} detik`
      : "-";

  return (
    <div style={R.wrap}>
      <div style={R.content}>
        <div style={R.trophyCircle}>🏆</div>

        <div style={R.title}>Puzzle Selesai!</div>

        <div style={R.subtitle}>
          Berikut adalah hasil pengerjaan pada{" "}
          <span style={R.linkLike}>{puzzleTitle}</span>
        </div>

        <div style={R.card}>
          <div style={R.smallLabel}>TOTAL ATTEMPT</div>

          <div style={R.scoreRow}>
            <div style={R.scoreBig}>{attempt}</div>
            <div style={R.scoreSmall}>x</div>
          </div>

          <div style={R.statsGrid}>
            <StatBox label="XP DIPEROLEH" value={`+${xp} XP`} icon="⚡" />
            <StatBox label="WAKTU PENGERJAAN" value={waktuText} icon="⏱" />
            <StatBox label="TIPE PUZZLE" value={formatType(tipe)} icon="🧩" />
            <StatBox label="STATUS" value="Selesai" icon="✅" />
          </div>

          <div style={R.actions}>
            <button style={R.primaryBtn} onClick={onBackToModule}>
              ← Kembali ke Modul
            </button>
          </div>
        </div>

        <PuzzlePreview
          tipe={tipe}
          jawaban={jawaban}
          hasil={hasil}
          detail={detail}
        />

        <div style={R.quote}>
          “Learning never exhausts the mind.” — Leonardo da Vinci
        </div>
      </div>
    </div>
  );
}

function formatType(type) {
  if (type === "drag_drop") return "Drag Drop";
  if (type === "fill_blank") return "Fill Blank";
  if (type === "code") return "Code";
  return "-";
}

function StatBox({ icon, label, value }) {
  return (
    <div style={R.statBox}>
      <div style={R.statIcon}>{icon}</div>
      <div style={R.statLabel}>{label}</div>
      <div style={R.statValue}>{value}</div>
    </div>
  );
}

function PuzzlePreview({ tipe, jawaban, hasil, detail }) {
  if (tipe === "drag_drop") {
    const answer = jawaban?.answer || [];

    return (
      <div style={R.card}>
        <div style={R.previewTitle}>Preview Jawaban Drag & Drop</div>

        <div style={R.singlePreviewPanel}>
          <div style={R.previewLabel}>Jawaban Mahasiswa</div>
          <CodeList items={answer} />
        </div>
      </div>
    );
  }

  if (tipe === "fill_blank") {
    const answer = jawaban?.answers || {};
    const template = hasil?.template || detail?.template_text || "-";

    return (
      <div style={R.card}>
        <div style={R.previewTitle}>Preview Jawaban Fill Blank</div>

        <div style={R.singlePreviewPanel}>
          <div style={R.previewLabel}>Soal</div>
          <pre style={R.pre}>{template}</pre>
        </div>

        <div style={R.templateBox}>
          <div style={R.previewLabel}>Jawaban Mahasiswa</div>
          <AnswerObject data={answer} />
        </div>
      </div>
    );
  }

  if (tipe === "code") {
    const code = jawaban?.code || "";
    const testResults = hasil?.testResults || [];

    return (
      <div style={R.card}>
        <div style={R.previewTitle}>Preview Jawaban Code Puzzle</div>

        <div style={R.singlePreviewPanel}>
          <div style={R.previewLabel}>Jawaban Mahasiswa</div>
          <pre style={R.pre}>{code || "-"}</pre>
        </div>

        <div style={R.templateBox}>
          <div style={R.previewLabel}>Expected Output & Hasil Testcase</div>

          {testResults.length > 0 ? (
            <div style={R.testList}>
              {testResults.map((item) => (
                <div
                  key={item.index}
                  style={{
                    ...R.testItem,
                    ...(item.passed ? R.testPassStrong : R.testFail),
                  }}
                >
                  <div style={R.testTitleRow}>
                    <span style={item.passed ? R.checkBadge : R.failBadge}>
                      {item.passed ? "✓" : "✕"}
                    </span>

                    <span>
                      Testcase {item.index} {item.passed ? "Berhasil" : "Gagal"}
                    </span>
                  </div>

                  <div style={R.testDetailGrid}>
                    <div style={R.testDetailBox}>
                      <div style={R.previewLabel}>Input</div>
                      <code>{JSON.stringify(item.input)}</code>
                    </div>

                    <div style={R.testDetailBox}>
                      <div style={R.previewLabel}>Expected Output</div>
                      <code>{JSON.stringify(item.expected_output)}</code>
                    </div>

                    <div style={R.testDetailBox}>
                      <div style={R.previewLabel}>Output Mahasiswa</div>
                      <code>{JSON.stringify(item.actual_output)}</code>
                    </div>
                  </div>

                  {item.error ? (
                    <div style={R.errorText}>
                      Error: <code>{item.error}</code>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <pre style={R.pre}>Belum ada hasil testcase.</pre>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function CodeList({ items = [] }) {
  if (!items.length) {
    return <div style={R.emptyText}>Belum ada jawaban tersimpan.</div>;
  }

  return (
    <div style={R.codeList}>
      {items.map((item, index) => (
        <div key={index} style={R.codeLine}>
          <span style={R.lineNo}>{index + 1}</span>
          <code>{item}</code>
        </div>
      ))}
    </div>
  );
}

function AnswerObject({ data = {} }) {
  const entries = Object.entries(data);

  if (!entries.length) {
    return <div style={R.emptyText}>Belum ada data.</div>;
  }

  return (
    <div style={R.answerList}>
      {entries.map(([key, value]) => (
        <div key={key} style={R.answerItem}>
          <span style={R.answerKey}>{key}</span>
          <code>{String(value)}</code>
        </div>
      ))}
    </div>
  );
}

const R = {
  wrap: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(6px)",
    overflowY: "auto",
    padding: 22,
    color: "rgba(235,240,255,0.92)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },

  content: {
    width: "min(980px, 94vw)",
    margin: "0 auto",
    textAlign: "center",
  },

  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "2px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.06)",
    boxShadow: "0 0 90px rgba(60,255,201,0.16)",
    fontSize: 58,
    margin: "0 auto 14px",
  },

  title: { fontSize: 28, fontWeight: 950 },
  subtitle: { marginTop: 6, fontSize: 12, opacity: 0.75 },
  linkLike: { color: "rgba(140,86,255,0.95)", fontWeight: 800 },

  card: {
    width: "min(560px, 92vw)",
    margin: "18px auto 18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    textAlign: "left",
  },

  smallLabel: {
    fontSize: 11,
    opacity: 0.6,
    letterSpacing: 1.2,
    textAlign: "center",
  },

  scoreRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 6,
    marginTop: 6,
  },

  scoreBig: {
    fontSize: 58,
    fontWeight: 950,
    color: "rgba(140,86,255,0.95)",
    lineHeight: 1,
  },

  scoreSmall: { fontSize: 16, opacity: 0.7, paddingBottom: 8 },

  statsGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  statBox: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.25)",
    padding: 12,
    textAlign: "center",
  },

  statIcon: { fontSize: 18, opacity: 0.9 },
  statLabel: { marginTop: 6, fontSize: 10, opacity: 0.7, letterSpacing: 0.6 },
  statValue: { marginTop: 6, fontSize: 13, fontWeight: 900 },

  actions: {
    marginTop: 14,
    display: "grid",
    gap: 12,
  },

  primaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(120,90,255,0.30)",
    background: "rgba(120,90,255,0.16)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    width: "100%",
    fontWeight: 900,
  },

  previewCard: {
    marginTop: 18,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
    textAlign: "left",
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: 950,
    marginBottom: 14,
  },

  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },

  previewPanel: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.25)",
    padding: 14,
  },

  previewLabel: {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.8,
    marginBottom: 10,
  },

  codeList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  codeLine: {
    display: "grid",
    gridTemplateColumns: "30px 1fr",
    gap: 10,
    alignItems: "center",
    borderRadius: 12,
    border: "1px solid rgba(140,86,255,0.18)",
    background: "rgba(140,86,255,0.08)",
    padding: "10px 12px",
    fontSize: 12,
    lineHeight: 1.6,
  },

  lineNo: {
    opacity: 0.5,
    textAlign: "right",
    fontSize: 11,
  },

  answerList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  answerItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 12,
    border: "1px solid rgba(140,86,255,0.18)",
    background: "rgba(140,86,255,0.08)",
    padding: "10px 12px",
    fontSize: 12,
  },

  answerKey: {
    fontWeight: 900,
    opacity: 0.8,
  },

  templateBox: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.25)",
    padding: 14,
  },

  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    fontSize: 12,
    lineHeight: 1.7,
    color: "rgba(235,240,255,0.86)",
  },

  emptyText: {
    fontSize: 12,
    opacity: 0.65,
  },

  testList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  testItem: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 12,
    fontSize: 12,
    lineHeight: 1.6,
  },

  testPass: {
    background: "rgba(60,255,201,0.08)",
    border: "1px solid rgba(60,255,201,0.18)",
  },

  testFail: {
    background: "rgba(255,80,120,0.08)",
    border: "1px solid rgba(255,80,120,0.18)",
  },

  testTitle: {
    fontWeight: 900,
    marginBottom: 6,
  },

  quote: { marginTop: 18, fontSize: 11, opacity: 0.4 },

  singlePreviewPanel: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.25)",
    padding: 14,
  },

  testPassStrong: {
    background: "rgba(60,255,201,0.10)",
    border: "1px solid rgba(60,255,201,0.32)",
    boxShadow: "0 0 28px rgba(60,255,201,0.08)",
  },

  testTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 950,
    marginBottom: 10,
  },

  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(60,255,201,0.15)",
    border: "1px solid rgba(60,255,201,0.42)",
    color: "rgba(60,255,201,0.98)",
    fontWeight: 950,
  },

  failBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,80,120,0.14)",
    border: "1px solid rgba(255,80,120,0.35)",
    color: "rgba(255,110,140,0.98)",
    fontWeight: 950,
  },

  testDetailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
  },

  testDetailBox: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.25)",
    padding: 10,
    overflowX: "auto",
  },

  errorText: {
    marginTop: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,80,120,0.22)",
    background: "rgba(255,80,120,0.08)",
    padding: 10,
    color: "rgba(255,150,170,0.95)",
  },
};