import React, { useState } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import {
  MailOutlined,
  LockOutlined,
  CodeOutlined,
  TrophyOutlined,
  BarChartOutlined,
  BookOutlined,
} from "@ant-design/icons";
import handleSignIn from "../../utils/auth/SignIn";

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      await handleSignIn(values);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Login gagal. Cek email dan password kamu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <style>{responsiveCss}</style>

      <div style={styles.bgGrid} />
      <div style={styles.bgGlowOne} />
      <div style={styles.bgGlowTwo} />

      <section className="login-shell" style={styles.shell}>
        <div className="login-hero" style={styles.hero}>
          <div style={styles.codeGhost}>
            <pre style={{ ...styles.codeLine, top: 34, left: 34 }}>
              {`const trail = new Journey();`}
            </pre>
            <pre style={{ ...styles.codeLine, top: 88, right: 38 }}>
              {`if (module.done) unlockNext();`}
            </pre>
            <pre style={{ ...styles.codeLine, bottom: 72, left: 42 }}>
              {`// level up your logic`}
            </pre>
          </div>

          <div style={styles.heroContent}>
            <div style={styles.logoBadge}>
              <span style={styles.logoText}>CT</span>
              <span style={styles.logoDotA} />
              <span style={styles.logoDotB} />
              <span style={styles.logoTrail} />
            </div>

            <div style={styles.kicker}>// CODETRAILL ROADMAP</div>

            <Typography.Title className="login-title" style={styles.title}>
              Masuk ke Jalur Belajar
            </Typography.Title>

            <p style={styles.desc}>
              Lanjutkan progres roadmap, kumpulkan XP, selesaikan modul, dan
              buka tantangan berikutnya.
            </p>

            <div style={styles.badgeRow}>
              <MiniBadge icon={<BookOutlined />} text="MODUL" />
              <MiniBadge icon={<TrophyOutlined />} text="ACHIEVEMENT" />
              <MiniBadge icon={<BarChartOutlined />} text="LEADERBOARD" />
            </div>

          </div>
        </div>

        <div className="login-form-wrap" style={styles.formWrap}>
          <div className="login-form-card" style={styles.formCard}>
            <div style={styles.formLogoBadge}>
              <span style={styles.formLogoText}>CT</span>
              <span style={styles.formLogoDotA} />
              <span style={styles.formLogoDotB} />
              <span style={styles.formLogoTrail} />
            </div>

            <Typography.Title level={2} style={styles.formTitle}>
              Masuk
            </Typography.Title>

            <p style={styles.formSubtitle}>
              Gunakan akunmu untuk melanjutkan progres CodeTraill.
            </p>

            <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
              <Form.Item
                label={<span style={styles.label}>EMAIL</span>}
                name="email"
                rules={[
                  { required: true, message: "Email wajib diisi" },
                  { type: "email", message: "Format email tidak valid" },
                ]}
              >
                <Input
                  className="codetraill-login-input"
                  prefix={<MailOutlined />}
                  placeholder="kamu@email.com"
                  size="large"
                  style={styles.input}
                />
              </Form.Item>

              <Form.Item
                label={<span style={styles.label}>PASSWORD</span>}
                name="password"
                rules={[{ required: true, message: "Password wajib diisi" }]}
              >
                <Input.Password
                  className="codetraill-login-input"
                  prefix={<LockOutlined />}
                  placeholder="Masukkan password"
                  size="large"
                  style={styles.input}
                />
              </Form.Item>

              <Button
                className="codetraill-login-button"
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={styles.button}
              >
                Masuk
              </Button>
            </Form>

            <div style={styles.footerText}>
              Belum punya akun?{" "}
              <a href="/contact-admin" style={styles.footerLink}>
                Hubungi Admin
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniBadge({ icon, text }) {
  return (
    <span style={styles.miniBadge}>
      {icon}
      {text}
    </span>
  );
}

const responsiveCss = `
  .codetraill-login-input,
  .codetraill-login-input input,
  .codetraill-login-input .ant-input,
  .codetraill-login-input .ant-input-password {
    background: rgba(255,255,255,0.03) !important;
    color: #d7defa !important;
  }

  .codetraill-login-input input::placeholder {
    color: rgba(215,222,250,0.42) !important;
  }


  .codetraill-login-input.ant-input-affix-wrapper,
  .codetraill-login-input.ant-input-password,
  .codetraill-login-input .ant-input-affix-wrapper {
    background: rgba(255,255,255,0.03) !important;
  }


  .codetraill-login-input.ant-input-affix-wrapper {
    padding: 0 16px !important;
    gap: 10px !important;
  }

  .codetraill-login-input.ant-input-affix-wrapper > input.ant-input {
    padding-left: 6px !important;
    padding-right: 8px !important;
  }

  .codetraill-login-input.ant-input-affix-wrapper .ant-input-prefix {
    margin-inline-end: 8px !important;
  }

  .codetraill-login-input.ant-input-affix-wrapper .ant-input-suffix {
    margin-inline-start: 8px !important;
  }

  .codetraill-login-input input:-webkit-autofill,
  .codetraill-login-input input:-webkit-autofill:hover,
  .codetraill-login-input input:-webkit-autofill:focus,
  .codetraill-login-input input:-webkit-autofill:active {
    -webkit-text-fill-color: #d7defa !important;
    caret-color: #d7defa !important;
    transition: background-color 999999s ease-in-out 0s !important;
    box-shadow: 0 0 0 1000px #0b1020 inset !important;
    border-radius: 12px !important;
  }

  .codetraill-login-input input {
    background: transparent !important;
    box-shadow: none !important;
  }

  .codetraill-login-input .ant-input-prefix,
  .codetraill-login-input .ant-input-suffix {
    color: rgba(60,255,201,0.76) !important;
  }

  .codetraill-login-input:hover,
  .codetraill-login-input:focus,
  .codetraill-login-input:focus-within {
    border-color: rgba(60,255,201,0.46) !important;
    box-shadow: 0 0 0 3px rgba(60,255,201,0.09), 0 0 24px rgba(60,255,201,0.10) !important;
  }

  .codetraill-login-button:hover {
    transform: translateY(-1px);
    background: rgba(60,255,201,1) !important;
  }

  .login-form-card .ant-form-item-label {
    padding-bottom: 10px !important;
  }

  .login-form-card .ant-form-item {
    margin-bottom: 24px !important;
  }

  .login-form-card .ant-form-item-label > label {
    width: 100% !important;
    height: auto !important;
  }

  @media (max-width: 900px) {
    .login-shell {
      grid-template-columns: 1fr !important;
      min-height: auto !important;
    }

    .login-hero {
      min-height: auto !important;
      padding: 30px 18px 14px !important;
    }

    .login-form-wrap {
      padding: 14px 18px 34px !important;
    }

    .login-title {
      font-size: 34px !important;
    }
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(1200px 700px at 60% 30%, #0a2a2a 0%, #070a14 55%, #050611 100%)",
    color: "#d7defa",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },

  bgGrid: {
    position: "absolute",
    inset: 0,
    opacity: 0.24,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
    backgroundSize: "34px 34px",
    pointerEvents: "none",
  },

  bgGlowOne: {
    position: "absolute",
    width: 460,
    height: 460,
    left: -160,
    top: -140,
    borderRadius: "50%",
    background: "rgba(60,255,201,0.10)",
    filter: "blur(20px)",
  },

  bgGlowTwo: {
    position: "absolute",
    width: 520,
    height: 520,
    right: -190,
    bottom: -190,
    borderRadius: "50%",
    background: "rgba(140,86,255,0.16)",
    filter: "blur(22px)",
  },

  shell: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    width: "min(1180px, calc(100% - 36px))",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.04fr 0.96fr",
    alignItems: "center",
    gap: 18,
    padding: "18px 0",
  },

  hero: {
    minHeight: 560,
    position: "relative",
    overflow: "hidden",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    boxShadow: "0 18px 70px rgba(0,0,0,0.30)",
    padding: 34,
    display: "flex",
    alignItems: "center",
  },

  codeGhost: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },

  codeLine: {
    position: "absolute",
    margin: 0,
    color: "rgba(215,222,250,0.09)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 16,
  },

  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: 540,
  },

  logoBadge: {
    width: 86,
    height: 86,
    borderRadius: 24,
    display: "grid",
    placeItems: "center",
    position: "relative",
    marginBottom: 22,
    border: "1px solid rgba(60,255,201,0.30)",
    background:
      "radial-gradient(circle at 30% 25%, rgba(60,255,201,0.18), transparent 48%), rgba(255,255,255,0.03)",
    boxShadow:
      "0 0 28px rgba(60,255,201,0.13), inset 0 0 20px rgba(255,255,255,0.03)",
  },

  logoText: {
    fontSize: 36,
    fontWeight: 950,
    letterSpacing: -5,
    paddingRight: 5,
    background:
      "linear-gradient(135deg, rgba(60,255,201,1), rgba(140,86,255,1))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  logoTrail: {
    position: "absolute",
    width: 48,
    height: 2,
    left: 18,
    bottom: 19,
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.95), rgba(140,86,255,0.95))",
    transform: "rotate(-20deg)",
    boxShadow: "0 0 16px rgba(60,255,201,0.34)",
  },

  logoDotA: {
    position: "absolute",
    width: 8,
    height: 8,
    left: 18,
    bottom: 14,
    borderRadius: 999,
    background: "rgba(60,255,201,1)",
    boxShadow: "0 0 14px rgba(60,255,201,0.8)",
  },

  logoDotB: {
    position: "absolute",
    width: 8,
    height: 8,
    right: 18,
    bottom: 30,
    borderRadius: 999,
    background: "rgba(140,86,255,1)",
    boxShadow: "0 0 14px rgba(140,86,255,0.8)",
  },

  kicker: {
    color: "rgba(60,255,201,0.92)",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "0.20em",
    textTransform: "uppercase",
    marginBottom: 12,
  },

  title: {
    margin: 0,
    color: "#eef2ff",
    fontSize: 50,
    lineHeight: 1.05,
    letterSpacing: -2,
    fontWeight: 950,
  },

  desc: {
    maxWidth: 480,
    margin: "18px 0 0",
    color: "rgba(215,222,250,0.78)",
    fontSize: 15,
    lineHeight: 1.75,
  },

  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 24,
  },

  miniBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.08)",
    color: "rgba(235,240,255,0.92)",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: 0.5,
  },

  roadmapPreview: {
    width: "min(430px, 100%)",
    marginTop: 54,
    borderRadius: 18,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },

  previewTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  previewLabel: {
    color: "rgba(60,255,201,0.92)",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  previewTitle: {
    marginTop: 4,
    color: "#d7defa",
    fontSize: 14,
    fontWeight: 800,
  },

  previewIcon: {
    fontSize: 24,
    color: "rgba(140,86,255,0.95)",
  },

  previewTrack: {
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  previewNodeActive: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(60,255,201,0.50)",
    background: "rgba(60,255,201,0.12)",
    color: "#d7defa",
    fontWeight: 900,
  },

  previewNode: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(60,255,201,0.30)",
    background: "rgba(60,255,201,0.08)",
    color: "#d7defa",
    fontWeight: 900,
  },

  previewNodeLocked: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#d7defa",
    fontSize: 13,
  },

  previewConnector: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.72), rgba(140,86,255,0.72))",
  },

  previewConnectorDim: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
  },

  formWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  formCard: {
    width: "min(420px, 100%)",
    borderRadius: 24,
    padding: 24,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "radial-gradient(700px 360px at 50% 0%, rgba(60,255,201,0.12), rgba(10,12,22,0.92) 58%)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
  },

  formIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    marginBottom: 16,
    border: "1px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.09)",
    color: "rgba(60,255,201,0.95)",
    fontSize: 28,
  },

  formLogoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    display: "grid",
    placeItems: "center",
    position: "relative",
    marginBottom: 18,
    border: "1px solid rgba(60,255,201,0.30)",
    background:
      "radial-gradient(circle at 30% 25%, rgba(60,255,201,0.18), transparent 48%), rgba(255,255,255,0.03)",
    boxShadow:
      "0 0 28px rgba(60,255,201,0.13), inset 0 0 20px rgba(255,255,255,0.03)",
  },

  formLogoText: {
    fontSize: 31,
    fontWeight: 950,
    letterSpacing: -4,
    paddingRight: 4,
    background:
      "linear-gradient(135deg, rgba(60,255,201,1), rgba(140,86,255,1))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  formLogoTrail: {
    position: "absolute",
    width: 40,
    height: 2,
    left: 15,
    bottom: 16,
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.95), rgba(140,86,255,0.95))",
    transform: "rotate(-20deg)",
    boxShadow: "0 0 16px rgba(60,255,201,0.34)",
  },

  formLogoDotA: {
    position: "absolute",
    width: 7,
    height: 7,
    left: 15,
    bottom: 12,
    borderRadius: 999,
    background: "rgba(60,255,201,1)",
    boxShadow: "0 0 14px rgba(60,255,201,0.8)",
  },

  formLogoDotB: {
    position: "absolute",
    width: 7,
    height: 7,
    right: 15,
    bottom: 26,
    borderRadius: 999,
    background: "rgba(140,86,255,1)",
    boxShadow: "0 0 14px rgba(140,86,255,0.8)",
  },

  formTitle: {
    margin: 0,
    color: "#eef2ff",
    fontSize: 34,
    fontWeight: 950,
    letterSpacing: -1,
  },

  formSubtitle: {
    margin: "8px 0 24px",
    color: "rgba(215,222,250,0.70)",
    fontSize: 13,
    lineHeight: 1.65,
  },

  label: {
    display: "inline-block",
    color: "rgba(215,222,250,0.88)",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  passwordLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    marginBottom: 2,
  },

  forgotLink: {
    color: "rgba(60,255,201,0.92)",
    fontSize: 12,
    fontWeight: 850,
    textDecoration: "none",
  },

  input: {
    height: 54,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    color: "#d7defa",
  },

  button: {
    height: 54,
    border: "none",
    borderRadius: 16,
    marginTop: 4,
    color: "#07111f",
    fontSize: 16,
    fontWeight: 950,
    background: "rgba(60,255,201,0.92)",
    boxShadow: "0 14px 28px rgba(60,255,201,0.13)",
    transition: "all 160ms ease",
  },

  footerText: {
    textAlign: "center",
    marginTop: 20,
    color: "rgba(215,222,250,0.66)",
    fontSize: 13,
  },

  footerLink: {
    color: "rgba(60,255,201,0.95)",
    fontWeight: 900,
    textDecoration: "none",
  },
};
