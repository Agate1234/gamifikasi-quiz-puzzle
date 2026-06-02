import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Typography,
  Row,
  Col,
  Button,
  Select,
  Upload,
  Card,
  Empty,
} from "antd";
import {
  PlusOutlined,
  CloudUploadOutlined,
  ThunderboltFilled,
  EditOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  createMateriApi,
  updateMateriApi,
} from "../../../components/api/materi";
import { getModulesApi } from "../../../components/api/modul";
import { NotifAlert, NotifToast } from "../../../components/global/ToastNotif";

const { Text } = Typography;

function renderInlineMarkdown(text = "") {
  const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          style={{
            padding: "2px 6px",
            borderRadius: 6,
            background: "rgba(124,92,255,0.18)",
            color: "#E6ECFF",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function MarkdownPreview({ value }) {
  const markdown = String(value || "").trim();

  if (!markdown) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: "rgba(255,255,255,0.55)" }}>
            Preview markdown akan muncul di sini.
          </span>
        }
      />
    );
  }

  const lines = markdown.split("\n");
  const elements = [];
  let listBuffer = [];
  let orderedListBuffer = [];
  let codeBuffer = [];
  let inCodeBlock = false;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ marginTop: 0, paddingLeft: 22 }}>
          {listBuffer.map((item, index) => (
            <li key={index}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      listBuffer = [];
    }

    if (orderedListBuffer.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} style={{ marginTop: 0, paddingLeft: 22 }}>
          {orderedListBuffer.map((item, index) => (
            <li key={index}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      );
      orderedListBuffer = [];
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      elements.push(
        <pre
          key={`code-${elements.length}`}
          style={{
            margin: "8px 0",
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
            background: "rgba(0,0,0,0.32)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#E6ECFF",
          }}
        >
          <code>{codeBuffer.join("\n")}</code>
        </pre>,
      );
      codeBuffer = [];
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushList();

      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }

      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) {
      flushList();
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      orderedListBuffer = [];
      listBuffer.push(unorderedMatch[1]);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      listBuffer = [];
      orderedListBuffer.push(orderedMatch[1]);
      return;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${elements.length}`} style={{ color: "#E6ECFF", margin: "10px 0 6px" }}>
          {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${elements.length}`} style={{ color: "#E6ECFF", margin: "12px 0 8px" }}>
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
        </h2>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${elements.length}`} style={{ color: "#E6ECFF", margin: "12px 0 8px" }}>
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
        </h1>,
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          style={{
            margin: "8px 0",
            padding: "8px 12px",
            borderLeft: "3px solid rgba(124,92,255,0.9)",
            background: "rgba(124,92,255,0.10)",
            color: "rgba(230,236,255,0.84)",
          }}
        >
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
        </blockquote>,
      );
      return;
    }

    elements.push(
      <p key={`p-${elements.length}`} style={{ color: "rgba(230,236,255,0.82)", margin: "6px 0" }}>
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
  });

  flushList();
  flushCode();

  return <div>{elements}</div>;
}

export default function AddMaterialModal({
  open,
  onClose,
  onSuccess,
  initialValues,
  loading = false,
}) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [moduleOptions, setModuleOptions] = useState([]);
  const [existingFileRemoved, setExistingFileRemoved] = useState(false);

  const isEdit = Boolean(initialValues?.id_materi);
  const markdownValue = Form.useWatch("markdown_materi", form) || "";
  const hasMarkdown = String(markdownValue || "").trim().length > 0;
  const hasFile = fileList.length > 0;

  useEffect(() => {
    const loadModules = async () => {
      const response = await getModulesApi(
        new URLSearchParams({ page: 1, limit: 100, q: "" }),
      );

      if (response?.status === 200) {
        const options = (response?.data?.data || []).map((item) => ({
          value: item.id,
          label: item.title,
        }));
        setModuleOptions(options);
      }
    };

    if (open) loadModules();
  }, [open]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setExistingFileRemoved(false);

      if (initialValues) {
        form.setFieldsValue({
          judul_materi: initialValues.judul_materi || "",
          id_modul: initialValues.id_modul || undefined,
          exp_materi: initialValues.exp_materi ?? 100,
          deskripsi_materi: initialValues.deskripsi_materi || "",
          markdown_materi: initialValues.markdown_materi || "",
          link: initialValues.link || "",
        });

        if (initialValues.file_materi && !initialValues.markdown_materi) {
          setFileList([
            {
              uid: "existing-file",
              name: initialValues.file_materi,
              status: "done",
              url: initialValues.file_materi,
            },
          ]);
        } else {
          setFileList([]);
        }
      } else {
        form.setFieldsValue({
          judul_materi: "",
          id_modul: undefined,
          exp_materi: 100,
          deskripsi_materi: "",
          markdown_materi: "",
          link: "",
        });
        setFileList([]);
      }
    }
  }, [open, initialValues, form]);

  const handleFileChange = ({ fileList: fl }) => {
    const nextFileList = fl.slice(-1);
    setFileList(nextFileList);

    if (nextFileList.length > 0) {
      form.setFieldsValue({ markdown_materi: "" });
    }
  };

  const handleFileRemove = (file) => {
    if (file?.uid === "existing-file") {
      setExistingFileRemoved(true);
    }

    setFileList([]);
    return true;
  };

  const handleMarkdownChange = (e) => {
    const value = e.target.value;

    if (String(value || "").trim()) {
      setFileList([]);
      if (initialValues?.file_materi) setExistingFileRemoved(true);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const markdownMateri = String(values.markdown_materi || "").trim();
      const selectedFile = fileList?.[0];
      const hasSelectedFile = Boolean(selectedFile);
      const hasNewFile = Boolean(selectedFile?.originFileObj);

      if (markdownMateri && hasSelectedFile) {
        NotifAlert({
          icon: "warning",
          title: "Pilih salah satu",
          message: "Materi tidak bisa memakai markdown dan file sekaligus.",
        });
        return;
      }

      setSubmitting(true);

      const formData = new FormData();
      formData.append("judul_materi", values.judul_materi);
      formData.append("id_modul", values.id_modul);
      formData.append("exp_materi", values.exp_materi);
      formData.append("deskripsi_materi", values.deskripsi_materi || "");
      formData.append("markdown_materi", markdownMateri);
      formData.append("link", "");

      if (isEdit && (existingFileRemoved || markdownMateri)) {
        formData.append("hapus_file", "true");
      }

      if (hasNewFile) {
        formData.append("file_materi", selectedFile.originFileObj);
      }

      const response = isEdit
        ? await updateMateriApi(initialValues.id_materi, formData)
        : await createMateriApi(formData);

      if (response?.status === 200 || response?.status === 201) {
        NotifToast({
          type: "success",
          message:
            response?.data?.message ||
            (isEdit
              ? "Materi berhasil diupdate."
              : "Materi berhasil ditambahkan."),
        });

        onSuccess?.();
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message:
            response?.data?.message ||
            (isEdit
              ? "Gagal mengupdate materi."
              : "Gagal menambahkan materi."),
        });
      }
    } catch (error) {
      if (!error?.errorFields) {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: "Terjadi kesalahan saat menyimpan materi.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(
    () => ({
      content: {
        padding: 0,
        borderRadius: 14,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(20,30,46,0.98) 0%, rgba(23,33,50,0.98) 55%, rgba(18,27,42,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
      },
      headerWrap: {
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      },
      input: {
        borderRadius: 12,
        background: "rgba(10,16,28,0.55)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#E6ECFF",
      },
      textarea: {
        borderRadius: 12,
        background: "rgba(10,16,28,0.55)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#E6ECFF",
        resize: "none",
      },
      label: { color: "rgba(255,255,255,0.85)" },
      footer: {
        padding: "12px 16px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        background: "transparent",
        borderTop: "none",
      },
      dropzone: {
        borderRadius: 12,
        padding: "18px 14px",
        background: hasMarkdown ? "rgba(255,255,255,0.025)" : "rgba(10,16,28,0.45)",
        border: "1px dashed rgba(255,255,255,0.14)",
        textAlign: "center",
        color: "rgba(255,255,255,0.8)",
        opacity: hasMarkdown ? 0.55 : 1,
      },
      markdownPreview: {
        borderRadius: 14,
        background: "rgba(10,16,28,0.38)",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    }),
    [hasMarkdown],
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={920}
      closeIcon={
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>×</span>
      }
      styles={{
        content: styles.content,
        header: { display: "none" },
        body: { padding: 0, background: "transparent" },
      }}
    >
      <div style={styles.headerWrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "rgba(124,92,255,0.18)",
              border: "1px solid rgba(124,92,255,0.25)",
              color: "#7C5CFF",
            }}
          >
            {isEdit ? <EditOutlined /> : <PlusOutlined />}
          </div>

          <Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
            {isEdit ? "Edit Materi" : "Tambah Materi Baru"}
          </Text>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<Text style={styles.label}>Judul Materi</Text>}
            name="judul_materi"
            rules={[{ required: true, message: "Judul materi wajib diisi" }]}
          >
            <Input
              placeholder="Contoh: Pengenalan Python Dasar"
              style={styles.input}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} md={16}>
              <Form.Item
                label={<Text style={styles.label}>Modul Terkait</Text>}
                name="id_modul"
                rules={[{ required: true, message: "Pilih modul terkait" }]}
              >
                <Select
                  placeholder="Pilih modul terkait..."
                  options={moduleOptions}
                  style={{ width: "100%" }}
                  popupMatchSelectWidth
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={<Text style={styles.label}>XP Materi</Text>}
                name="exp_materi"
                rules={[
                  { required: true, message: "XP wajib diisi" },
                  {
                    type: "number",
                    transform: (v) => Number(v),
                    min: 0,
                    message: "XP minimal 0",
                  },
                ]}
              >
                <Input
                  type="number"
                  suffix={<ThunderboltFilled style={{ color: "#F7C948" }} />}
                  style={styles.input}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<Text style={styles.label}>Deskripsi Materi</Text>}
            name="deskripsi_materi"
          >
            <Input.TextArea
              rows={3}
              placeholder="Jelaskan isi materi..."
              style={styles.textarea}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <span>
                    <Text style={styles.label}>Konten Markdown</Text>{" "}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {hasFile ? "(Nonaktif karena ada file)" : "(Opsional)"}
                    </Text>
                  </span>
                }
                name="markdown_materi"
              >
                <Input.TextArea
                  rows={10}
                  disabled={hasFile}
                  onChange={handleMarkdownChange}
                  placeholder={`Contoh:\n# Encapsulation\nEncapsulation adalah...\n\n- Private attribute\n- Getter dan setter\n\n\`public class Main {}\``}
                  style={{
                    ...styles.textarea,
                    opacity: hasFile ? 0.55 : 1,
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Text style={{ ...styles.label, display: "block", marginBottom: 8 }}>
                Preview Markdown
              </Text>
              <Card bordered={false} style={styles.markdownPreview} bodyStyle={{ padding: 12, minHeight: 250, maxHeight: 300, overflow: "auto" }}>
                <MarkdownPreview value={markdownValue} />
              </Card>
            </Col>
          </Row>

          <Form.Item
            label={
              <span>
                <Text style={styles.label}>Lampiran File</Text>{" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {hasMarkdown ? "(Nonaktif karena ada markdown)" : "(Opsional)"}
                </Text>
              </span>
            }
          >
            <Upload.Dragger
              multiple={false}
              fileList={fileList}
              disabled={hasMarkdown}
              accept="video/mp4,.mp4"
              beforeUpload={() => false}
              onChange={handleFileChange}
              onRemove={handleFileRemove}
              style={styles.dropzone}
              showUploadList
            >
              <div style={{ display: "grid", placeItems: "center", gap: 6 }}>
                {hasMarkdown ? (
                  <FileTextOutlined
                    style={{ fontSize: 20, color: "rgba(255,255,255,0.65)" }}
                  />
                ) : (
                  <CloudUploadOutlined
                    style={{ fontSize: 20, color: "rgba(255,255,255,0.75)" }}
                  />
                )}
                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                  {hasMarkdown
                    ? "File dinonaktifkan karena markdown sudah diisi"
                    : "Klik untuk unggah atau seret file"}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hanya MP4. Jika memakai file, markdown harus kosong.
                </Text>
              </div>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </div>

      <div style={styles.footer}>
        <Button
          onClick={onClose}
          style={{
            borderRadius: 12,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          Batal
        </Button>

        <Button
          type="primary"
          loading={loading || submitting}
          onClick={handleOk}
          style={{ borderRadius: 12 }}
        >
          {isEdit ? "Update Materi" : "Simpan Materi"}
        </Button>
      </div>
    </Modal>
  );
}
