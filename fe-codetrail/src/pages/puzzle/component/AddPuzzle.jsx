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
  Switch,
  Divider,
} from "antd";
import {
  PlusOutlined,
  ThunderboltFilled,
  AppstoreOutlined,
  DragOutlined,
  CodeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { getModulesApi } from "../../../components/api/modul";
import {
  createPuzzleApi,
  updatePuzzleApi,
} from "../../../components/api/puzzle";
import { NotifAlert, NotifToast } from "../../../components/Global/ToastNotif";

const { Text } = Typography;

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function AddPuzzleModal({
  open,
  onClose,
  onSuccess,
  initialValues,
  loading = false,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingModule, setLoadingModule] = useState(false);
  const [moduleOptions, setModuleOptions] = useState([]);

  const [tipePuzzle, setTipePuzzle] = useState("drag_drop");
  const [difficulty, setDifficulty] = useState("easy");
  const [isEvent, setIsEvent] = useState(false);

  const [items, setItems] = useState([
    { id: 1, value: "" },
    { id: 2, value: "" },
    { id: 3, value: "" },
    { id: 4, value: "" },
  ]);

  const [expectedAnswersText, setExpectedAnswersText] = useState(
    '{\n  "blank1": "",\n  "blank2": ""\n}',
  );

  const [testcasesText, setTestcasesText] = useState(
    '[\n  {\n    "input": [1, 2],\n    "expected_output": 3\n  }\n]',
  );

  const isEditMode = !!initialValues?.id;

  useEffect(() => {
    if (!open) return;

    const loadModules = async () => {
      try {
        setLoadingModule(true);
        const params = new URLSearchParams({
          page: 1,
          limit: 1000,
          q: "",
        });

        const response = await getModulesApi(params);

        if (response?.status === 200) {
          const options = (response?.data?.data || []).map((item) => ({
            value: Number(item.id),
            label: item.title,
          }));

          setModuleOptions(options);
        } else {
          setModuleOptions([]);
          NotifAlert({
            icon: "error",
            title: "Gagal",
            message: response?.data?.message || "Gagal mengambil daftar modul.",
          });
        }
      } catch {
        setModuleOptions([]);
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: "Terjadi kesalahan saat mengambil daftar modul.",
        });
      } finally {
        setLoadingModule(false);
      }
    };

    loadModules();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    form.resetFields();

    const mappedType = initialValues?.tipe_puzzle || "drag_drop";
    const mappedDifficulty = initialValues?.difficulty_puzzle || "easy";
    const mappedIsEvent = !!initialValues?.is_event;

    setTipePuzzle(mappedType);
    setDifficulty(mappedDifficulty);
    setIsEvent(mappedIsEvent);

    if (mappedType === "drag_drop") {
      const sourceItems = Array.isArray(initialValues?.items)
        ? initialValues.items
        : [];

      setItems(
        sourceItems.length
          ? sourceItems.map((item, index) => ({
              id: Date.now() + index,
              value: String(item ?? ""),
            }))
          : [
              { id: 1, value: "" },
              { id: 2, value: "" },
              { id: 3, value: "" },
              { id: 4, value: "" },
            ],
      );
    } else {
      setItems([
        { id: 1, value: "" },
        { id: 2, value: "" },
        { id: 3, value: "" },
        { id: 4, value: "" },
      ]);
    }

    if (mappedType === "fill_blank") {
      setExpectedAnswersText(
        JSON.stringify(initialValues?.expected_answers || {}, null, 2),
      );
    } else {
      setExpectedAnswersText('{\n  "blank1": "",\n  "blank2": ""\n}');
    }

    if (mappedType === "code") {
      setTestcasesText(JSON.stringify(initialValues?.testcases || [], null, 2));
    } else {
      setTestcasesText(
        '[\n  {\n    "input": [1, 2],\n    "expected_output": 3\n  }\n]',
      );
    }

    form.setFieldsValue({
      judul_puzzle: initialValues?.title || initialValues?.judul_puzzle || "",
      deskripsi_puzzle:
        initialValues?.desc || initialValues?.deskripsi_puzzle || "",
      id_modul:
        initialValues?.id_modul !== undefined
          ? Number(initialValues.id_modul)
          : undefined,
      exp_puzzle:
        initialValues?.xp !== undefined
          ? Number(initialValues.xp)
          : initialValues?.exp_puzzle !== undefined
            ? Number(initialValues.exp_puzzle)
            : 0,
      instruksi:
        initialValues?.drag_drop_instruksi ||
        initialValues?.fill_blank_instruksi ||
        initialValues?.code_instruksi ||
        initialValues?.instruksi ||
        "",
      template_text: initialValues?.template_text || "",
      starter_code: initialValues?.starter_code || "",
      reference_solution: initialValues?.reference_solution || "",
      function_name: initialValues?.function_name || "",
      language: initialValues?.language || "javascript",
      time_limit_ms:
        initialValues?.time_limit_ms !== undefined
          ? Number(initialValues.time_limit_ms)
          : 1000,
      memory_limit_mb:
        initialValues?.memory_limit_mb !== undefined
          ? Number(initialValues.memory_limit_mb)
          : 128,
    });
  }, [open, initialValues, form]);

  const updateItemValue = (id, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item)),
    );
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { id: Date.now(), value: "" }]);
  };

  const removeItemRow = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const parseExpectedAnswers = () => {
    let parsed;

    try {
      parsed = JSON.parse(expectedAnswersText);
    } catch {
      throw new Error("Format expected_answers tidak valid");
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("expected_answers harus berupa object JSON");
    }

    if (Object.keys(parsed).length === 0) {
      throw new Error("expected_answers tidak boleh kosong");
    }

    return parsed;
  };

  const parseTestcases = () => {
    let parsed;

    try {
      parsed = JSON.parse(testcasesText);
    } catch {
      throw new Error("Format testcases tidak valid");
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("testcases harus berupa array dan tidak boleh kosong");
    }

    return parsed;
  };

  const buildPayload = (values) => {
    const basePayload = {
      judul_puzzle: values.judul_puzzle,
      deskripsi_puzzle: values.deskripsi_puzzle || "",
      difficulty_puzzle: difficulty,
      is_event: isEvent,
      exp_puzzle: Number(values.exp_puzzle),
      id_modul: Number(values.id_modul),
      instruksi: values.instruksi,
    };

    if (!isEditMode) {
      basePayload.tipe_puzzle = tipePuzzle;
    }

    if (tipePuzzle === "drag_drop") {
      const normalizedItems = items
        .map((item) => String(item.value || "").trim())
        .filter((item) => item !== "");

      if (normalizedItems.length === 0) {
        throw new Error("Items drag & drop tidak boleh kosong");
      }

      return {
        ...basePayload,
        items: normalizedItems,
      };
    }

    if (tipePuzzle === "fill_blank") {
      if (!values.template_text?.trim()) {
        throw new Error("template_text wajib diisi");
      }

      return {
        ...basePayload,
        template_text: values.template_text,
        expected_answers: parseExpectedAnswers(),
      };
    }

    if (tipePuzzle === "code") {
      if (!values.language?.trim()) {
        throw new Error("language wajib diisi");
      }

      return {
        ...basePayload,
        starter_code: values.starter_code || "",
        reference_solution: values.reference_solution || "",
        function_name: values.function_name || "",
        language: values.language,
        testcases: parseTestcases(),
        time_limit_ms: Number(values.time_limit_ms || 1000),
        memory_limit_mb: Number(values.memory_limit_mb || 128),
      };
    }

    throw new Error("Tipe puzzle tidak dikenali");
  };

  const handleOk = async () => {
    try {
      setSubmitting(true);

      const values = await form.validateFields();
      const payload = buildPayload(values);

      const response = isEditMode
        ? await updatePuzzleApi(initialValues.id, payload)
        : await createPuzzleApi(payload);

      if (response?.status === 200 || response?.status === 201) {
        NotifToast({
          type: "success",
          message:
            response?.data?.message ||
            (isEditMode
              ? "Puzzle berhasil diupdate."
              : "Puzzle berhasil ditambahkan."),
        });

        onSuccess?.(response?.data?.data);
        onClose?.();
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal menyimpan puzzle.",
        });
      }
    } catch (error) {
      if (error?.errorFields) return;

      NotifAlert({
        icon: "error",
        title: "Validasi",
        message: error?.message || "Data puzzle belum valid.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(() => {
    const baseInput = {
      borderRadius: 12,
      background: "rgba(10,16,28,0.55)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#E6ECFF",
    };

    return {
      content: {
        padding: 0,
        borderRadius: 14,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(20,30,46,0.98) 0%, rgba(23,33,50,0.98) 55%, rgba(18,27,42,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
      },
      header: {
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "transparent",
      },
      input: baseInput,
      textarea: {
        ...baseInput,
        resize: "none",
      },
      label: { color: "rgba(255,255,255,0.85)" },
      subtle: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
      footer: {
        padding: "12px 16px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        background: "transparent",
        borderTop: "none",
      },
      chip: (active) => ({
        height: 34,
        padding: "0 14px",
        borderRadius: 10,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 12,
        color: active ? "#E6ECFF" : "rgba(255,255,255,0.65)",
        background: active ? "rgba(124,92,255,0.20)" : "rgba(255,255,255,0.03)",
        border: active
          ? "1px solid rgba(124,92,255,0.30)"
          : "1px solid rgba(255,255,255,0.08)",
      }),
      rowWrap: {
        borderRadius: 12,
        padding: "10px 12px",
        background: "rgba(10,16,28,0.50)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      },
    };
  }, []);

  return (
    <Modal
      open={open}
      footer={null}
      centered
      width={820}
      closable={false}
      maskClosable
      keyboard
      destroyOnClose
      onCancel={onClose}
      styles={{
        content: styles.content,
        body: { padding: 0, background: "transparent" },
      }}
    >
      <div style={styles.header}>
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
            <AppstoreOutlined />
          </div>
          <div>
            <Text
              style={{ color: "#E6ECFF", fontWeight: 800, display: "block" }}
            >
              {isEditMode ? "Edit Puzzle" : "Tambah Puzzle"}
            </Text>
            <Text style={styles.subtle}>
              Form akan berubah sesuai tipe puzzle.
            </Text>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose?.();
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.75)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<Text style={styles.label}>Judul Puzzle</Text>}
            name="judul_puzzle"
            rules={[{ required: true, message: "Judul puzzle wajib diisi" }]}
          >
            <Input
              placeholder="Masukkan judul puzzle..."
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            label={<Text style={styles.label}>Deskripsi Puzzle</Text>}
            name="deskripsi_puzzle"
          >
            <Input.TextArea
              rows={3}
              placeholder="Masukkan deskripsi puzzle..."
              style={styles.textarea}
            />
          </Form.Item>

          <Row gutter={12}>
            {/* EVENT (kiri) */}
            <Col xs={24} md={3}>
              <div style={{ marginBottom: 8 }}>
                <Text style={styles.label}>Event</Text>
              </div>
              <Switch checked={isEvent} onChange={setIsEvent} />
            </Col>

            {/* TIPE PUZZLE */}
            <Col xs={24} md={10}>
              <Form.Item
                label={<Text style={styles.label}>Tipe Puzzle</Text>}
                style={{ marginBottom: 0 }}
              >
                <Select
                  value={tipePuzzle}
                  disabled={isEditMode}
                  onChange={(value) => setTipePuzzle(value)}
                  placeholder="Pilih tipe puzzle"
                  options={[
                    { value: "drag_drop", label: "Drag Drop" },
                    { value: "fill_blank", label: "Fill Blank" },
                    { value: "code", label: "Code" },
                  ]}
                />
              </Form.Item>

              {isEditMode && (
                <div style={{ marginTop: 6 }}>
                  <Text style={styles.subtle}>
                    Tipe puzzle tidak bisa diubah saat edit.
                  </Text>
                </div>
              )}
            </Col>

            {/* KESULITAN */}
            <Col xs={24} md={10}>
              <div style={{ marginBottom: 8 }}>
                <Text style={styles.label}>Kesulitan</Text>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DIFFICULTIES.map((d) => (
                  <div
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={styles.chip(difficulty === d)}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </Col>
          </Row>

          <div style={{ height: 12 }} />

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<Text style={styles.label}>Modul Terkait</Text>}
                name="id_modul"
                rules={[{ required: true, message: "Pilih modul terkait" }]}
              >
                <Select
                  showSearch
                  loading={loadingModule}
                  placeholder="Pilih modul..."
                  options={moduleOptions}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    String(option?.label || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<Text style={styles.label}>XP Reward</Text>}
                name="exp_puzzle"
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
                  prefix={<ThunderboltFilled style={{ color: "#7C5CFF" }} />}
                  style={styles.input}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<Text style={styles.label}>Instruksi</Text>}
            name="instruksi"
            rules={[{ required: true, message: "Instruksi wajib diisi" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Masukkan instruksi puzzle..."
              style={styles.textarea}
            />
          </Form.Item>

          <Divider style={{ borderColor: "rgba(255,255,255,0.06)" }} />

          {tipePuzzle === "drag_drop" && (
            <>
              <Form.Item
                label={<Text style={styles.label}>Items Drag Drop</Text>}
              >
                <Input.TextArea
                  rows={8}
                  value={items.map((item) => item.value).join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    setItems(
                      lines.map((line, index) => ({
                        id: index + 1,
                        value: line,
                      })),
                    );
                  }}
                  placeholder={`CREATE TABLE users (
id INT PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100)
);`}
                  style={styles.textarea}
                />
              </Form.Item>
            </>
          )}

          {tipePuzzle === "fill_blank" && (
            <>
              <Form.Item
                label={<Text style={styles.label}>Template Text</Text>}
                name="template_text"
                rules={[
                  { required: true, message: "Template text wajib diisi" },
                ]}
              >
                <Input.TextArea
                  rows={10}
                  placeholder={"Contoh:\nconst <blank1> add = (a, b) => a + b;"}
                  style={{
                    ...styles.textarea,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                />
              </Form.Item>

              <div style={{ marginBottom: 8 }}>
                <Text style={styles.label}>Expected Answers (JSON)</Text>
              </div>

              <Input.TextArea
                rows={8}
                value={expectedAnswersText}
                onChange={(e) => setExpectedAnswersText(e.target.value)}
                placeholder='{\n  "blank1": "const",\n  "blank2": "items"\n}'
                style={{
                  ...styles.textarea,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              />
            </>
          )}

          {tipePuzzle === "code" && (
            <>
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text style={styles.label}>Function Name</Text>}
                    name="function_name"
                  >
                    <Input placeholder="add" style={styles.input} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text style={styles.label}>Language</Text>}
                    name="language"
                    rules={[
                      { required: true, message: "Language wajib diisi" },
                    ]}
                  >
                    <Input placeholder="javascript" style={styles.input} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={<Text style={styles.label}>Starter Code</Text>}
                name="starter_code"
              >
                <Input.TextArea
                  rows={8}
                  placeholder={"function add(a, b) {\n  \n}"}
                  style={{
                    ...styles.textarea,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                />
              </Form.Item>

              <Form.Item
                label={<Text style={styles.label}>Reference Solution</Text>}
                name="reference_solution"
              >
                <Input.TextArea
                  rows={8}
                  placeholder={"function add(a, b) {\n  return a + b;\n}"}
                  style={{
                    ...styles.textarea,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                />
              </Form.Item>

              <div style={{ marginBottom: 8 }}>
                <Text style={styles.label}>Testcases (JSON Array)</Text>
              </div>

              <Input.TextArea
                rows={10}
                value={testcasesText}
                onChange={(e) => setTestcasesText(e.target.value)}
                placeholder={`[
  {
    "input": [1, 2],
    "expected_output": 3
  }
]`}
                style={{
                  ...styles.textarea,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              />

              <Row gutter={12} style={{ marginTop: 12 }}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text style={styles.label}>Time Limit (ms)</Text>}
                    name="time_limit_ms"
                  >
                    <Input type="number" style={styles.input} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text style={styles.label}>Memory Limit (mb)</Text>}
                    name="memory_limit_mb"
                  >
                    <Input type="number" style={styles.input} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
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
          {isEditMode ? "Update Puzzle" : "Simpan Puzzle"}
        </Button>
      </div>
    </Modal>
  );
}
