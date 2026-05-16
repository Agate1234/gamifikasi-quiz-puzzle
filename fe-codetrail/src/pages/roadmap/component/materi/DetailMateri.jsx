import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function normalizePdfTextToMarkdown(text = "", title = "") {
  const rawLines = String(text)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const mergedLines = [];
  const fieldPattern =
    /^(nama|tanggal lahir|jenjang pendidikan|tanggal tes|email|program studi)\s*:/i;

  for (const line of rawLines) {
    const prev = mergedLines[mergedLines.length - 1];

    if (
      prev &&
      fieldPattern.test(prev) &&
      !fieldPattern.test(line) &&
      !/^hasil /i.test(line) &&
      !/^diagram /i.test(line) &&
      !/^visualisasi /i.test(line)
    ) {
      mergedLines[mergedLines.length - 1] = `${prev} ${line}`;
    } else {
      mergedLines.push(line);
    }
  }

  const out = [];
  let titleUsed = false;

  for (const line of mergedLines) {
    if (/^\d+$/.test(line)) continue;

    if (!titleUsed) {
      out.push(`# ${line}`);
      out.push("");
      titleUsed = true;
      continue;
    }

    if (
      /^hasil /i.test(line) ||
      /^diagram /i.test(line) ||
      /^visualisasi /i.test(line)
    ) {
      out.push(`## ${line}`);
      out.push("");
      continue;
    }

    if (fieldPattern.test(line)) {
      const [label, ...rest] = line.split(":");
      out.push(`- **${label.trim()}**: ${rest.join(":").trim()}`);
      continue;
    }

    out.push(line);
  }

  return out
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfStructuredText(url) {
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const items = textContent.items
      .filter((item) => "str" in item && item.str?.trim())
      .map((item) => {
        const x = item.transform[4];
        const y = item.transform[5];
        return {
          text: item.str.trim(),
          x,
          y,
        };
      });

    const lines = [];
    const tolerance = 3;

    for (const item of items) {
      let targetLine = lines.find(
        (line) => Math.abs(line.y - item.y) <= tolerance,
      );

      if (!targetLine) {
        targetLine = { y: item.y, items: [] };
        lines.push(targetLine);
      }

      targetLine.items.push(item);
    }

    lines.sort((a, b) => b.y - a.y);

    const pageLines = lines.map((line) => {
      const sortedItems = line.items.sort((a, b) => a.x - b.x);

      let row = "";
      let prevX = null;

      for (const part of sortedItems) {
        if (prevX !== null) {
          const gap = part.x - prevX;
          row += gap > 25 ? "    " : " ";
        }
        row += part.text;
        prevX = part.x + (part.text?.length || 0) * 4;
      }

      return row.trim();
    });

    pages.push(pageLines.join("\n"));
  }

  return pages.join("\n\n---\n\n");
}

export default function MateriFullscreen({
  open,
  materi,
  moduleTitle,
  onClose,
  onNext,
}) {
  const [markdownContent, setMarkdownContent] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

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

  const isPdf = tipeFile.includes("pdf") || fileName.endsWith(".pdf");

  const hasPreviewFile = Boolean(materi?.file_materi && materi?.id_materi);
  const hasExternalLink = Boolean(materi?.link);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!open || !hasPreviewFile || !isPdf || !fileApiUrl) {
        setMarkdownContent("");
        setPdfError("");
        setPdfLoading(false);
        return;
      }

      try {
        setPdfLoading(true);
        setPdfError("");

        const extractedText = await extractPdfStructuredText(fileApiUrl);
        const markdown = normalizePdfTextToMarkdown(
          extractedText,
          materi?.judul_materi || "Materi PDF",
        );

        if (!cancelled) {
          setMarkdownContent(markdown);
        }
      } catch (error) {
        if (!cancelled) {
          setPdfError("PDF tidak berhasil dikonversi ke markdown.");
          setMarkdownContent("");
        }
      } finally {
        if (!cancelled) {
          setPdfLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [open, hasPreviewFile, isPdf, fileApiUrl, materi?.judul_materi]);

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
              <div style={S.previewTitle}>
                {isPdf ? "Isi Materi" : "Preview Materi"}
              </div>

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

                {hasPreviewFile && (
                  <a
                    href={fileApiUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={S.primaryBtn}
                  >
                    Buka File
                  </a>
                )}
              </div>
            </div>

            <div style={S.previewBox}>
              {hasPreviewFile && isVideo ? (
                <video
                  controls
                  preload="metadata"
                  src={fileApiUrl}
                  style={S.videoPreview}
                />
              ) : hasPreviewFile && isPdf ? (
                pdfLoading ? (
                  <div style={S.emptyPreview}>
                    <div style={S.emptyText}>Mengubah PDF ke markdown...</div>
                  </div>
                ) : pdfError ? (
                  <div style={S.emptyPreview}>
                    <div style={S.emptyText}>{pdfError}</div>
                    <iframe
                      src={fileApiUrl}
                      title="Preview PDF Materi"
                      style={S.iframePreview}
                    />
                  </div>
                ) : (
                  <article style={S.markdownWrap}>
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                  </article>
                )
              ) : hasPreviewFile ? (
                <div style={S.emptyPreview}>
                  <div style={S.emptyText}>
                    Preview file belum tersedia untuk tipe ini.
                  </div>
                  <a
                    href={fileApiUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={S.primaryBtn}
                  >
                    Download / Buka File
                  </a>
                </div>
              ) : hasExternalLink ? (
                <iframe
                  src={materi.link}
                  title="Preview Link Materi"
                  style={S.iframePreview}
                />
              ) : (
                <div style={S.emptyPreview}>
                  <div style={S.emptyText}>
                    Materi ini belum memiliki file atau link untuk dipreview.
                  </div>
                </div>
              )}
            </div>

            <div style={S.bottomBar}>
              <button style={S.backAction} onClick={onClose}>
                ← Kembali
              </button>
              <button style={S.nextAction} onClick={onNext || (() => {})}>
                Selanjutnya →
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

  breadcrumb: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
  },

  muted: { fontSize: 12, opacity: 0.7 },

  strong: {
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.95,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  rightIcons: { display: "flex", alignItems: "center", gap: 10 },
  
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

  title: { fontSize: 28, fontWeight: 900, marginBottom: 6 },
  subTitle: { fontSize: 12, opacity: 0.7, marginBottom: 10 },
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

  iframePreview: {
    width: "100%",
    height: 460,
    border: "none",
    borderRadius: 14,
    background: "#fff",
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

  emptyPreview: {
    minHeight: 320,
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
};
