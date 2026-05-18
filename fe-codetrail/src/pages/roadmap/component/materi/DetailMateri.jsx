import React, { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";

const markdownComponents = {
  h1({ children }) {
    return <h1 style={S.mdH1}>{children}</h1>;
  },
  h2({ children }) {
    return <h2 style={S.mdH2}>{children}</h2>;
  },
  h3({ children }) {
    return <h3 style={S.mdH3}>{children}</h3>;
  },
  p({ children }) {
    return <p style={S.mdP}>{children}</p>;
  },
  ul({ children }) {
    return <ul style={S.mdUl}>{children}</ul>;
  },
  ol({ children }) {
    return <ol style={S.mdOl}>{children}</ol>;
  },
  li({ children }) {
    return <li style={S.mdLi}>{children}</li>;
  },
  blockquote({ children }) {
    return <blockquote style={S.mdBlockquote}>{children}</blockquote>;
  },
  code({ inline, className, children, ...props }) {
    const value = String(children || "").replace(/\n$/, "");

    if (inline) {
      return (
        <code style={S.inlineCode} {...props}>
          {children}
        </code>
      );
    }

    return (
      <div style={S.codeCard}>
        <div style={S.codeHeader}>
          <span style={S.codeDotGreen} />
          <span style={S.codeDotPurple} />
          <span style={S.codeHeaderText}>CODE</span>
        </div>
        <pre style={S.codePre}>
          <code className={className} style={S.codeBlock} {...props}>
            {value}
          </code>
        </pre>
      </div>
    );
  },
  table({ children }) {
    return (
      <div style={S.tableScroll}>
        <table style={S.mdTable}>{children}</table>
      </div>
    );
  },
  th({ children }) {
    return <th style={S.mdTh}>{children}</th>;
  },
  td({ children }) {
    return <td style={S.mdTd}>{children}</td>;
  },
};


export default function MateriFullscreen({
  open,
  materi,
  moduleTitle,
  onClose,
  onNext,
}) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const fileApiUrl = useMemo(() => {
    return materi?.id_materi
      ? `${import.meta.env.VITE_API_BASE_URL}/materi/${materi.id_materi}/file`
      : null;
  }, [materi?.id_materi]);

  const tipeFile = String(materi?.tipe_file || "").toLowerCase();
  const fileName = String(materi?.file_materi || "").toLowerCase();

  const isVideo =
    tipeFile.includes("video") ||
    tipeFile.includes("mp4") ||
    fileName.endsWith(".mp4");

  const hasPreviewFile = Boolean(materi?.file_materi && materi?.id_materi);
  const hasExternalLink = Boolean(materi?.link);

  const markdownMateri =
    materi?.markdown_materi ||
    materi?.isi_materi ||
    materi?.content_materi ||
    "";

  const hasMarkdown = String(markdownMateri).trim().length > 0;

  const rawStatus =
    materi?.raw_status ||
    materi?.status ||
    (materi?.is_unlock ? "not done" : "locked");

  const normalizedStatus =
    rawStatus === "done"
      ? "done"
      : rawStatus === "locked"
        ? "locked"
        : "not done";

  const nextLabel = normalizedStatus === "done" ? "Selesai ✓" : "Selesai →";
  const isNextDisabled = normalizedStatus === "locked";

  if (!open) return null;

  return (
    <div style={S.overlay} onMouseDown={onClose}>
      <div style={S.sheet} onMouseDown={(e) => e.stopPropagation()}>
        <div style={S.topbar}>
          <div style={S.breadcrumb}>
            <button style={S.backBtn} onClick={onClose}>
              ←
            </button>
            <span style={S.muted}>Roadmap</span>
            <span style={S.muted}>›</span>
            <span style={S.muted}>Modul</span>
            <span style={S.muted}>›</span>
            <span style={S.strong}>{materi?.judul_materi || "Materi"}</span>
          </div>

          <div style={S.rightIcons}>
            <div style={S.circleIcon} title="Tema">
              ☾
            </div>
          </div>
        </div>

        <div style={S.body}>
          <aside style={S.leftPad} />

          <section style={S.contentCard}>
            <div style={S.headerTop}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.title}>
                  {materi?.judul_materi || "Judul Materi"}
                </div>
                <div style={S.subTitle}>
                  Bagian dari modul: {materi?.judul_modul || moduleTitle || "-"}
                </div>
                <div style={S.desc}>
                  {materi?.deskripsi_materi || "Tidak ada deskripsi materi."}
                </div>
              </div>

              <div style={S.expBadge}>{materi?.exp_materi || 0} EXP</div>
            </div>

            <div style={S.previewHeader}>
              <div style={S.previewTitle}>Isi Materi</div>

              <div style={S.previewActions}>
                {hasExternalLink && (
                  <a
                    href={materi.link}
                    target="_blank"
                    rel="noreferrer"
                    style={S.linkBtn}
                  >
                    Buka Link
                  </a>
                )}

                {hasPreviewFile && isVideo && (
                  <a
                    href={fileApiUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={S.primaryBtn}
                  >
                    Buka Video
                  </a>
                )}
              </div>
            </div>

            <div style={S.previewBox}>
              {hasMarkdown ? (
                <article style={S.markdownWrap}>
                  <ReactMarkdown components={markdownComponents}>{markdownMateri}</ReactMarkdown>
                </article>
              ) : (
                <div style={S.emptyPreview}>
                  <div style={S.emptyText}>
                    Materi markdown belum diisi.
                  </div>
                </div>
              )}
            </div>

            {hasPreviewFile && isVideo ? (
              <>
                <div style={S.sectionGap} />
                <div style={S.previewHeader}>
                  <div style={S.previewTitle}>Video Materi</div>
                </div>

                <div style={S.previewBox}>
                  <video
                    controls
                    preload="metadata"
                    src={fileApiUrl}
                    style={S.videoPreview}
                  />
                </div>
              </>
            ) : null}

            {!isVideo && hasPreviewFile ? (
              <div style={S.warningBox}>
                File materi lama bukan MP4. Sistem sekarang hanya menampilkan
                markdown dan video MP4, jadi file PDF tidak dipreview lagi.
              </div>
            ) : null}

            <div style={S.bottomBar}>
              <button style={S.backAction} onClick={onClose}>
                ← Kembali
              </button>
              <button
                style={{
                  ...S.nextAction,
                  ...(isNextDisabled ? S.disabledAction : {}),
                }}
                disabled={isNextDisabled}
                onClick={onNext || (() => {})}
              >
                {isNextDisabled ? "Terkunci" : nextLabel}
              </button>
            </div>
          </section>

          <aside style={S.rightPad} />
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
  },

  sheet: {
    width: "100%",
    height: "100%",
    background:
      "radial-gradient(1000px 600px at 60% 20%, rgba(92,255,210,0.10) 0%, rgba(80,90,255,0.10) 25%, rgba(10,12,22,1) 60%)",
    color: "rgba(235,240,255,0.92)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    overflowY: "auto",
    overflowX: "hidden",
  },

  topbar: {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
  },

  muted: {
    fontSize: 12,
    opacity: 0.7,
  },

  strong: {
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.95,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  rightIcons: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  circleIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    display: "grid",
    placeItems: "center",
  },

  body: {
    display: "grid",
    gridTemplateColumns: "240px minmax(0, 1fr) 240px",
    gap: 16,
    padding: 16,
    alignItems: "start",
  },

  leftPad: {},
  rightPad: {},

  contentCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
    alignSelf: "start",
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 6,
  },

  subTitle: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 10,
  },

  desc: {
    fontSize: 13,
    opacity: 0.82,
    lineHeight: 1.7,
  },

  expBadge: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(23,201,100,0.12)",
    border: "1px solid rgba(23,201,100,0.25)",
    color: "#9EF0B8",
    fontWeight: 800,
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  previewTitle: {
    fontSize: 16,
    fontWeight: 800,
  },

  previewActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  previewBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 20,
  },

  videoPreview: {
    width: "100%",
    borderRadius: 14,
    background: "#000",
    maxHeight: 440,
  },

  markdownWrap: {
    minHeight: 0,
    lineHeight: 1.8,
    fontSize: 15,
    color: "rgba(235,240,255,0.92)",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  },


  mdH1: {
    fontSize: 30,
    fontWeight: 950,
    lineHeight: 1.25,
    margin: "0 0 18px",
    color: "rgba(245,248,255,0.96)",
  },

  mdH2: {
    fontSize: 23,
    fontWeight: 900,
    lineHeight: 1.3,
    margin: "30px 0 14px",
    color: "rgba(245,248,255,0.94)",
  },

  mdH3: {
    fontSize: 18,
    fontWeight: 850,
    lineHeight: 1.35,
    margin: "24px 0 10px",
    color: "rgba(245,248,255,0.92)",
  },

  mdP: {
    margin: "0 0 15px",
    lineHeight: 1.85,
    color: "rgba(235,240,255,0.86)",
  },

  mdUl: {
    margin: "8px 0 18px",
    paddingLeft: 24,
  },

  mdOl: {
    margin: "8px 0 18px",
    paddingLeft: 24,
  },

  mdLi: {
    margin: "7px 0",
    lineHeight: 1.75,
    color: "rgba(235,240,255,0.86)",
  },

  mdBlockquote: {
    margin: "18px 0",
    padding: "14px 16px",
    borderLeft: "4px solid rgba(60,255,201,0.55)",
    borderRadius: 14,
    background: "rgba(60,255,201,0.07)",
    color: "rgba(235,240,255,0.86)",
  },

  inlineCode: {
    padding: "3px 7px",
    borderRadius: 8,
    border: "1px solid rgba(60,255,201,0.18)",
    background: "rgba(60,255,201,0.08)",
    color: "rgba(145,255,223,0.96)",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.92em",
    fontWeight: 750,
  },

  codeCard: {
    margin: "18px 0 24px",
    borderRadius: 16,
    border: "1px solid rgba(60,255,201,0.20)",
    background:
      "linear-gradient(180deg, rgba(9,14,28,0.96), rgba(5,8,18,0.96))",
    boxShadow:
      "0 16px 44px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
    overflow: "hidden",
  },

  codeHeader: {
    height: 38,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
  },

  codeDotGreen: {
    width: 9,
    height: 9,
    borderRadius: 999,
    background: "rgba(60,255,201,0.95)",
    boxShadow: "0 0 14px rgba(60,255,201,0.50)",
  },

  codeDotPurple: {
    width: 9,
    height: 9,
    borderRadius: 999,
    background: "rgba(140,86,255,0.95)",
    boxShadow: "0 0 14px rgba(140,86,255,0.50)",
  },

  codeHeaderText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.1,
    color: "rgba(215,222,250,0.58)",
  },

  codePre: {
    margin: 0,
    padding: 18,
    overflowX: "auto",
  },

  codeBlock: {
    display: "block",
    minWidth: "100%",
    color: "rgba(235,240,255,0.94)",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    lineHeight: 1.75,
    whiteSpace: "pre",
    tabSize: 2,
  },

  tableScroll: {
    width: "100%",
    overflowX: "auto",
    margin: "18px 0 24px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
  },

  mdTable: {
    width: "100%",
    borderCollapse: "collapse",
    background: "rgba(255,255,255,0.025)",
  },

  mdTh: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(60,255,201,0.07)",
    color: "rgba(235,240,255,0.94)",
    textAlign: "left",
    fontWeight: 900,
  },

  mdTd: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(235,240,255,0.84)",
  },


  emptyPreview: {
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 13,
    opacity: 0.72,
  },

  warningBox: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,210,90,0.22)",
    background: "rgba(255,210,90,0.08)",
    color: "rgba(255,237,189,0.92)",
    fontSize: 13,
    lineHeight: 1.6,
  },

  sectionGap: {
    height: 18,
  },

  linkBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#E6ECFF",
    textDecoration: "none",
    background: "transparent",
  },

  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(120,90,255,0.30)",
    background: "rgba(120,90,255,0.16)",
    color: "rgba(235,240,255,0.92)",
    textDecoration: "none",
    fontWeight: 800,
  },

  bottomBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
  },

  backAction: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    minWidth: 120,
  },

  nextAction: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(120,90,255,0.30)",
    background: "rgba(120,90,255,0.16)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    minWidth: 140,
    fontWeight: 800,
  },

  disabledAction: {
    opacity: 0.45,
    cursor: "not-allowed",
    filter: "grayscale(0.4)",
  },
};
