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
  Radio,
  Collapse,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { createSoalApi, updateSoalApi } from "../../../components/api/soal";
import { getQuizApi } from "../../../components/api/quiz";
import { NotifAlert, NotifToast } from "../../../components/global/ToastNotif";

const { Text } = Typography;

function TFOption({ value, label, active, onPick }) {
  return (
    <div
      onClick={() => onPick(value)}
      style={{
        borderRadius: 12,
        padding: "12px 14px",
        background: active ? "rgba(124,92,255,0.14)" : "rgba(10,16,28,0.50)",
        border: active
          ? "1px solid rgba(124,92,255,0.28)"
          : "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          border: active
            ? "5px solid #7C5CFF"
            : "2px solid rgba(255,255,255,0.35)",
          boxSizing: "border-box",
        }}
      />
      <Text style={{ color: "#E6ECFF", fontWeight: 700 }}>{label}</Text>
    </div>
  );
}

const TYPE_TO_API = {
  MCQ: "pilgan",
  TF: "true_false",
  CHECKBOX: "checkbox",
};

const DIFFICULTY_TO_API = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
};

export default function AddSoalModal({
  open,
  onClose,
  onSuccess,
  initialValues,
  loading = false,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizOptions, setQuizOptions] = useState([]);
  const [difficulty, setDifficulty] = useState("Easy");
  const [questionType, setQuestionType] = useState("MCQ");
  const [correctKey, setCorrectKey] = useState("A");
  const [cbOptions, setCbOptions] = useState([
    { id: 1, text: "", checked: false },
    { id: 2, text: "", checked: false },
    { id: 3, text: "", checked: false },
    { id: 4, text: "", checked: false },
  ]);
  const [inputMode, setInputMode] = useState("ui");
  const [jsonText, setJsonText] = useState("");

  const isEditMode = !!initialValues?.id;

  useEffect(() => {
    if (!open) return;

    const mappedType =
      initialValues?.type === "pilgan"
        ? "MCQ"
        : initialValues?.type === "true_false"
          ? "TF"
          : initialValues?.type === "checkbox"
            ? "CHECKBOX"
            : initialValues?.type || "MCQ";

    const mappedDifficulty =
      initialValues?.difficulty === "easy"
        ? "Easy"
        : initialValues?.difficulty === "medium"
          ? "Medium"
          : initialValues?.difficulty === "hard"
            ? "Hard"
            : initialValues?.difficulty || "Easy";

    const mapped = mapInitialAnswers(initialValues?.jawaban || [], mappedType);

    form.resetFields();
    setInputMode("ui");
    setJsonText("");
    setDifficulty(mappedDifficulty);
    setQuestionType(mappedType);
    setCorrectKey(mapped.correctKey);
    setCbOptions(
      mapped.cbOptions.length
        ? mapped.cbOptions
        : [
            { id: 1, text: "", checked: false },
            { id: 2, text: "", checked: false },
            { id: 3, text: "", checked: false },
            { id: 4, text: "", checked: false },
          ],
    );

    form.setFieldsValue({
      question: initialValues?.question || "",
      quizId: initialValues?.id_quiz
        ? Number(initialValues.id_quiz)
        : initialValues?.quizId
          ? Number(initialValues.quizId)
          : undefined,
      type: mappedType,
      answers: mapped.answers,
    });
  }, [open, initialValues, form]);

  useEffect(() => {
    if (!open) return;

    const loadQuizOptions = async () => {
      try {
        setLoadingQuiz(true);

        const params = new URLSearchParams({
          page: 1,
          limit: 1000,
        });

        const response = await getQuizApi(params);
        console.log("quiz api full response:", response);

        if (response?.status === 200) {
          const options = (response?.data?.data || [])
            .map((item) => ({
              value: Number(item.id),
              label: item.title,
            }))
            .filter((item) => !Number.isNaN(item.value) && item.label);

          console.log("quizOptions final:", options);
          setQuizOptions(options);
        } else {
          setQuizOptions([]);
          NotifAlert({
            icon: "error",
            title: "Gagal",
            message: response?.data?.message || "Gagal mengambil daftar quiz.",
          });
        }
      } catch (error) {
        console.error("getQuizApi error:", error);
        console.error("getQuizApi error response:", error?.response);
        console.error("getQuizApi error data:", error?.response?.data);
        setQuizOptions([]);
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: "Terjadi kesalahan saat mengambil daftar quiz.",
        });
      } finally {
        setLoadingQuiz(false);
      }
    };

    loadQuizOptions();
  }, [open]);

  const toggleCb = (id) => {
    setCbOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, checked: !o.checked } : o)),
    );
  };

  const updateCbText = (id, text) => {
    setCbOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const addCbOption = () => {
    setCbOptions((prev) => [
      ...prev,
      { id: Date.now(), text: "", checked: false },
    ]);
  };

  const parseJsonPayload = () => {
    let parsed;

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("Format JSON tidak valid");
    }

    const items = Array.isArray(parsed) ? parsed : [parsed];

    if (items.length === 0) {
      throw new Error("JSON kosong");
    }

    const normalizedItems = items.map((item, index) => {
      if (!item.soal) {
        throw new Error(`Item ke-${index + 1}: field 'soal' wajib diisi`);
      }

      if (!item.tipe_soal) {
        throw new Error(`Item ke-${index + 1}: field 'tipe_soal' wajib diisi`);
      }

      if (!item.difficulty) {
        throw new Error(`Item ke-${index + 1}: field 'difficulty' wajib diisi`);
      }

      if (!Array.isArray(item.jawaban) || item.jawaban.length < 2) {
        throw new Error(`Item ke-${index + 1}: field 'jawaban' minimal 2 item`);
      }

      let resolvedQuizId = item.id_quiz ? Number(item.id_quiz) : null;

      if (!resolvedQuizId && item.nama_quiz) {
        const matchedQuiz = quizOptions.find(
          (quiz) =>
            String(quiz.label).trim().toLowerCase() ===
            String(item.nama_quiz).trim().toLowerCase(),
        );

        if (!matchedQuiz) {
          throw new Error(
            `Item ke-${index + 1}: nama_quiz "${item.nama_quiz}" tidak ditemukan`,
          );
        }

        resolvedQuizId = Number(matchedQuiz.value);
      }

      if (!resolvedQuizId || Number.isNaN(resolvedQuizId)) {
        throw new Error(
          `Item ke-${index + 1}: field 'id_quiz' atau 'nama_quiz' wajib diisi`,
        );
      }

      if (item.tipe_soal === "pilgan" && item.jawaban.length < 4) {
        throw new Error(`Item ke-${index + 1}: soal pilgan minimal 4 jawaban`);
      }

      return {
        soal: item.soal,
        tipe_soal: item.tipe_soal,
        difficulty: item.difficulty,
        id_quiz: resolvedQuizId,
        jawaban: item.jawaban,
      };
    });

    return normalizedItems;
  };

  const buildPayload = (values) => {
    const tipe_soal = TYPE_TO_API[questionType];
    const difficultyApi = DIFFICULTY_TO_API[difficulty] || "easy";

    let jawaban = [];

    if (questionType === "MCQ") {
      const answers = values.answers || {};
      const requiredKeys = ["A", "B", "C", "D"];

      for (const key of requiredKeys) {
        if (!answers[key]?.trim()) {
          throw new Error(`Pilihan ${key} wajib diisi`);
        }
      }

      jawaban = ["A", "B", "C", "D", "E"]
        .map((key) => ({
          jawaban_soal: answers[key]?.trim() || "",
          is_true: correctKey === key,
        }))
        .filter((item) => item.jawaban_soal !== "");
    } else if (questionType === "TF") {
      jawaban = [
        { jawaban_soal: "True", is_true: correctKey === "TRUE" },
        { jawaban_soal: "False", is_true: correctKey === "FALSE" },
      ];
    } else if (questionType === "CHECKBOX") {
      jawaban = cbOptions
        .map((item) => ({
          jawaban_soal: item.text?.trim() || "",
          is_true: !!item.checked,
        }))
        .filter((item) => item.jawaban_soal !== "");

      if (jawaban.length < 2) {
        throw new Error("Pilihan checkbox minimal 2 item yang terisi");
      }

      const jumlahBenar = jawaban.filter((item) => item.is_true).length;
      if (jumlahBenar < 1) {
        throw new Error("Untuk checkbox, minimal 1 jawaban benar");
      }
    }

    return {
      soal: values.question,
      tipe_soal,
      difficulty: difficultyApi,
      id_quiz: Number(values.quizId),
      jawaban,
    };
  };

  const handleOk = async () => {
    try {
      setSubmitting(true);

      if (inputMode === "json") {
        const payloads = parseJsonPayload();

        for (const payload of payloads) {
          const response = await createSoalApi(payload);

          if (response?.status !== 200 && response?.status !== 201) {
            throw new Error(
              response?.data?.message || "Gagal menyimpan soal dari JSON.",
            );
          }
        }

        NotifToast({
          type: "success",
          message: `${payloads.length} soal berhasil ditambahkan.`,
        });

        onSuccess?.();
        onClose?.();
        return;
      }

      const values = await form.validateFields();
      const payload = buildPayload(values);

      const isEdit = !!initialValues?.id;
      const response = isEdit
        ? await updateSoalApi(initialValues.id, payload)
        : await createSoalApi(payload);

      if (response?.status === 200 || response?.status === 201) {
        NotifToast({
          type: "success",
          message:
            response?.data?.message ||
            (isEdit ? "Soal berhasil diupdate." : "Soal berhasil ditambahkan."),
        });

        onSuccess?.(response?.data?.data);
        onClose?.();
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal menyimpan soal.",
        });
      }
    } catch (error) {
      if (error?.errorFields) return;

      NotifAlert({
        icon: "error",
        title: "Validasi",
        message: error?.message || "Data soal belum valid.",
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
      optionRow: {
        borderRadius: 12,
        padding: "10px 12px",
        background: "rgba(10,16,28,0.50)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      },
      letter: {
        width: 26,
        height: 26,
        borderRadius: 8,
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        fontSize: 12,
        color: "#CDBBFF",
        background: "rgba(124,92,255,0.12)",
        border: "1px solid rgba(124,92,255,0.2)",
        flex: "0 0 auto",
      },
      cbRow: {
        borderRadius: 12,
        padding: "10px 12px",
        background: "rgba(10,16,28,0.50)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      },
      cbBox: (checked) => ({
        width: 16,
        height: 16,
        borderRadius: 4,
        border: checked
          ? "1px solid rgba(124,92,255,0.55)"
          : "1px solid rgba(255,255,255,0.25)",
        background: checked ? "rgba(124,92,255,0.9)" : "transparent",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        flex: "0 0 auto",
      }),
      cbInput: {
        ...baseInput,
        height: 36,
      },
    };
  }, []);

  const difficultyItems = ["Easy", "Medium", "Hard"];

  const mapInitialAnswers = (jawaban = [], type = "MCQ") => {
    if (!Array.isArray(jawaban)) {
      return {
        answers: { A: "", B: "", C: "", D: "", E: "" },
        correctKey: type === "TF" ? "TRUE" : "A",
        cbOptions: [
          { id: 1, text: "", checked: false },
          { id: 2, text: "", checked: false },
          { id: 3, text: "", checked: false },
          { id: 4, text: "", checked: false },
        ],
      };
    }

    if (type === "MCQ") {
      const labels = ["A", "B", "C", "D", "E"];
      const answers = { A: "", B: "", C: "", D: "", E: "" };
      let correctKey = "A";

      jawaban.forEach((item, index) => {
        const key = labels[index];
        if (!key) return;
        answers[key] = item?.jawaban_soal || "";
        if (item?.is_true) correctKey = key;
      });

      return {
        answers,
        correctKey,
        cbOptions: [
          { id: 1, text: "", checked: false },
          { id: 2, text: "", checked: false },
          { id: 3, text: "", checked: false },
          { id: 4, text: "", checked: false },
        ],
      };
    }

    if (type === "TF") {
      const trueAnswer = jawaban.find(
        (item) => String(item?.jawaban_soal).toLowerCase() === "true",
      );

      return {
        answers: { A: "", B: "", C: "", D: "", E: "" },
        correctKey: trueAnswer?.is_true ? "TRUE" : "FALSE",
        cbOptions: [
          { id: 1, text: "", checked: false },
          { id: 2, text: "", checked: false },
          { id: 3, text: "", checked: false },
          { id: 4, text: "", checked: false },
        ],
      };
    }

    return {
      answers: { A: "", B: "", C: "", D: "", E: "" },
      correctKey: "A",
      cbOptions: jawaban.map((item, index) => ({
        id: item?.id_jawaban || index + 1,
        text: item?.jawaban_soal || "",
        checked: !!item?.is_true,
      })),
    };
  };

  return (
    <Modal
      open={open}
      footer={null}
      centered
      width={680}
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
            <PlusOutlined />
          </div>
          <Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
            {initialValues?.id ? "Edit Soal" : "Tambah Soal Baru"}
          </Text>
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
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            question: "",
            quizId: undefined,
            type: "MCQ",
            answers: { A: "", B: "", C: "", D: "", E: "" },
            ...initialValues,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Mode Input</Text>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button
                type="primary"
                onClick={() => setInputMode("ui")}
                style={{ borderRadius: 12 }}
              >
                Input Soal
              </Button>

              {!isEditMode && (
                <Button
                  type={inputMode === "json" ? "primary" : "default"}
                  onClick={() => setInputMode("json")}
                  style={{ borderRadius: 12 }}
                >
                  Input JSON
                </Button>
              )}
            </div>
          </div>

          {inputMode === "json" ? (
            <Form.Item label={<Text style={styles.label}>JSON Soal</Text>}>
              <Input.TextArea
                rows={16}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Paste JSON soal di sini..."
                style={styles.textarea}
              />

              {/* <Text style={styles.subtle}>
                Bisa pakai <b>id_quiz</b> atau <b>nama_quiz</b>. 
              </Text> */}

              <div style={{ marginTop: 12 }}>
                <Collapse
                  ghost
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                  items={[
                    {
                      key: "format-json",
                      label: (
                        <span style={{ color: "#E6ECFF", fontWeight: 600 }}>
                          Lihat contoh format JSON
                        </span>
                      ),
                      children: (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <Text style={styles.subtle}>
                            Wajib: <b>soal</b>, <b>tipe_soal</b>,{" "}
                            <b>difficulty</b>, <b>jawaban</b>, dan salah satu
                            dari <b>id_quiz</b> atau <b>nama_quiz</b>. Untuk{" "}
                            <b>pilgan</b>, minimal <b>4 pilihan</b>.
                          </Text>

                          <div>
                            <Text style={{ ...styles.label, fontSize: 12 }}>
                              Contoh pakai nama_quiz
                            </Text>
                            <Input.TextArea
                              readOnly
                              autoSize={{ minRows: 6, maxRows: 8 }}
                              value={`{
  "soal": "Inheritance dalam OOP digunakan untuk apa?",
  "tipe_soal": "pilgan",
  "difficulty": "easy",
  "nama_quiz": "quiz 1",
  "jawaban": [
    { "jawaban_soal": "Mewariskan atribut dan method", "is_true": true },
    { "jawaban_soal": "Menghapus object", "is_true": false },
    { "jawaban_soal": "Membuat variabel global", "is_true": false },
    { "jawaban_soal": "Menghapus constructor", "is_true": false }
  ]
}`}
                              style={{
                                ...styles.textarea,
                                fontFamily: "monospace",
                                fontSize: 12,
                              }}
                            />
                          </div>

                          <div>
                            <Text style={{ ...styles.label, fontSize: 12 }}>
                              Contoh pakai id_quiz
                            </Text>
                            <Input.TextArea
                              readOnly
                              autoSize={{ minRows: 6, maxRows: 8 }}
                              value={`{
  "soal": "Polymorphism memungkinkan...",
  "tipe_soal": "pilgan",
  "difficulty": "medium",
  "id_quiz": 1,
  "jawaban": [
    { "jawaban_soal": "Satu method punya banyak bentuk", "is_true": true },
    { "jawaban_soal": "Semua class sama", "is_true": false },
    { "jawaban_soal": "Semua object identik", "is_true": false },
    { "jawaban_soal": "Class tidak bisa punya method", "is_true": false }
  ]
}`}
                              style={{
                                ...styles.textarea,
                                fontFamily: "monospace",
                                fontSize: 12,
                              }}
                            />
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </Form.Item>
          ) : (
            <>
              <Form.Item
                label={<Text style={styles.label}>Pertanyaan</Text>}
                name="question"
                rules={[{ required: true, message: "Pertanyaan wajib diisi" }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Tuliskan pertanyaan lengkap di sini..."
                  style={styles.textarea}
                />
              </Form.Item>

              <Form.Item
                label={<Text style={styles.label}>Judul Kuis</Text>}
                name="quizId"
                rules={[{ required: true, message: "Pilih kuis" }]}
              >
                <Select
                  showSearch
                  loading={loadingQuiz}
                  placeholder="Pilih quiz"
                  options={quizOptions}
                  optionFilterProp="label"
                  getPopupContainer={(trigger) => trigger.parentNode}
                  suffixIcon={
                    <SearchOutlined
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    />
                  }
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  notFoundContent={
                    loadingQuiz ? "Memuat quiz..." : "Tidak ada quiz"
                  }
                />
              </Form.Item>

              <div style={{ height: 12 }} />

              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text style={styles.label}>Tipe Soal</Text>}
                    name="type"
                    rules={[{ required: true, message: "Pilih tipe soal" }]}
                  >
                    <Select
                      placeholder="Pilih tipe..."
                      options={[
                        { value: "MCQ", label: "Pilihan Ganda" },
                        { value: "TF", label: "True / False" },
                        { value: "CHECKBOX", label: "Checkbox" },
                      ]}
                      style={{ width: "100%" }}
                      onChange={(val) => {
                        setQuestionType(val);

                        if (val === "TF") setCorrectKey("TRUE");
                        else setCorrectKey("A");

                        if (val === "CHECKBOX") {
                          setCbOptions([
                            { id: 1, text: "", checked: false },
                            { id: 2, text: "", checked: false },
                            { id: 3, text: "", checked: false },
                            { id: 4, text: "", checked: false },
                          ]);
                        }
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>Kesulitan</Text>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {difficultyItems.map((d) => (
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

              <div style={{ height: 6 }} />

              {questionType === "TF" ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ ...styles.label, fontWeight: 800 }}>
                      Jawaban Benar (True/False)
                    </Text>
                  </div>

                  <div style={{ height: 10 }} />

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <TFOption
                      value="TRUE"
                      label="True"
                      active={correctKey === "TRUE"}
                      onPick={setCorrectKey}
                    />
                    <TFOption
                      value="FALSE"
                      label="False"
                      active={correctKey === "FALSE"}
                      onPick={setCorrectKey}
                    />
                  </div>
                </>
              ) : questionType === "CHECKBOX" ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Text style={{ ...styles.label, fontWeight: 800 }}>
                        Pilihan Jawaban (Checkbox)
                      </Text>
                      <div>
                        <Text style={styles.subtle}>
                          Centang kotak ungu untuk menandai jawaban yang benar.
                        </Text>
                      </div>
                    </div>

                    <Button
                      type="primary"
                      onClick={addCbOption}
                      style={{ borderRadius: 12 }}
                    >
                      + Tambah Pilihan
                    </Button>
                  </div>

                  <div style={{ height: 12 }} />

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {cbOptions.map((opt) => (
                      <div key={opt.id} style={styles.cbRow}>
                        <div
                          onClick={() => toggleCb(opt.id)}
                          style={styles.cbBox(opt.checked)}
                          aria-label="toggle"
                        >
                          {opt.checked ? (
                            <span
                              style={{
                                color: "#0B1220",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              ✓
                            </span>
                          ) : null}
                        </div>

                        <Input
                          value={opt.text}
                          onChange={(e) => updateCbText(opt.id, e.target.value)}
                          placeholder="Masukkan pilihan jawaban..."
                          style={styles.cbInput}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ ...styles.label, fontWeight: 800 }}>
                      Jawaban Pilihan Ganda
                    </Text>
                    <Text style={styles.subtle}>
                      A, B, C, D wajib. E opsional.
                    </Text>
                  </div>

                  <div style={{ height: 10 }} />

                  <Radio.Group
                    value={correctKey}
                    onChange={(e) => setCorrectKey(e.target.value)}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {["A", "B", "C", "D", "E"].map((k) => (
                      <div key={k} style={styles.optionRow}>
                        <Radio value={k} />
                        <div style={styles.letter}>{k}</div>

                        <Form.Item
                          name={["answers", k]}
                          rules={
                            ["A", "B", "C", "D"].includes(k)
                              ? [
                                  {
                                    required: true,
                                    message: `Jawaban ${k} wajib diisi`,
                                  },
                                ]
                              : []
                          }
                          style={{ margin: 0, width: "100%" }}
                        >
                          <Input
                            placeholder={`Masukkan jawaban pilihan ${k}`}
                            style={styles.input}
                          />
                        </Form.Item>
                      </div>
                    ))}
                  </Radio.Group>
                </>
              )}
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
          Simpan Soal
        </Button>
      </div>
    </Modal>
  );
}
