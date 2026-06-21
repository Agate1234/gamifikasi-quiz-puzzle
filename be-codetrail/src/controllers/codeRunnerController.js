const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFile } = require("child_process");

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        timeout: options.timeout || 5000,
        cwd: options.cwd,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        resolve({
          error,
          stdout,
          stderr,
        });
      },
    );
  });
};

const normalizeExpected = (value) => {
  if (value === null || value === undefined) return String(value);

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const toJavaArgument = (arg) => {
  if (typeof arg === "number") return String(arg);
  if (typeof arg === "boolean") return String(arg);
  if (typeof arg === "string") return JSON.stringify(arg);

  if (Array.isArray(arg)) {
    const isNumberArray = arg.every((item) => typeof item === "number");
    const isBooleanArray = arg.every((item) => typeof item === "boolean");

    const values = arg
      .map((item) => {
        if (typeof item === "number") return String(item);
        if (typeof item === "boolean") return String(item);
        return JSON.stringify(String(item));
      })
      .join(", ");

    if (isNumberArray) return `new int[]{${values}}`;
    if (isBooleanArray) return `new boolean[]{${values}}`;

    return `new String[]{${values}}`;
  }

  return JSON.stringify(String(arg));
};

const buildJavaMainFile = ({
  userCode,
  className,
  functionName,
  getterName,
  constructorInputCount,
  input,
}) => {
  const args = Array.isArray(input) ? input : [];

  const safeConstructorInputCount = Math.max(
    0,
    Number(constructorInputCount || 0),
  );

  const constructorArgs = args
    .slice(0, safeConstructorInputCount)
    .map(toJavaArgument)
    .join(", ");

  const methodArgs = args
    .slice(safeConstructorInputCount)
    .map(toJavaArgument)
    .join(", ");

  const createObjectLine =
    safeConstructorInputCount > 0
      ? `${className} solution = new ${className}(${constructorArgs});`
      : `${className} solution = new ${className}();`;

  const runMethodLine = getterName
    ? `
    solution.${functionName}(${methodArgs});
    Object result = solution.${getterName}();`
    : `
    Object result = solution.${functionName}(${methodArgs});`;

  return `
${userCode}

class Main {
  public static void main(String[] args) {
    ${createObjectLine}
    ${runMethodLine}
    System.out.print(result);
  }
}
`;
};

const runJavaTestcases = async ({
  code,
  function_name,
  getter_name,
  constructor_input_count,
  testcases,
  time_limit_ms,
}) => {
  const tempId = crypto.randomBytes(8).toString("hex");
  const tempDir = path.join(os.tmpdir(), `codetraill-java-${tempId}`);

  fs.mkdirSync(tempDir, { recursive: true });

  const classNameMatch = String(code || "").match(
    /class\s+([A-Za-z_][A-Za-z0-9_]*)/,
  );

  const className = classNameMatch?.[1] || "Solution";

  const results = [];

  try {
    for (let index = 0; index < testcases.length; index += 1) {
      const testcase = testcases[index];

      const expectedOutput =
        testcase.expected_output !== undefined
          ? testcase.expected_output
          : testcase.expected;

      const sanitizedCode = code.replace(
        /public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/,
        "class $1",
      );

      const mainCode = buildJavaMainFile({
        userCode: sanitizedCode,
        className,
        functionName: function_name,
        getterName: getter_name,
        constructorInputCount: constructor_input_count,
        input: testcase.input,
      });

      const filePath = path.join(tempDir, "Main.java");
      fs.writeFileSync(filePath, mainCode, "utf8");

      const limit = Number(time_limit_ms || 1000) + 4000;

      const compileResult = await runCommand("javac", ["Main.java"], {
        cwd: tempDir,
        timeout: limit,
      });

      if (compileResult.error) {
        results.push({
          index: index + 1,
          input: testcase.input || [],
          expected_output: expectedOutput,
          actual_output: null,
          passed: false,
          error:
            compileResult.stderr ||
            compileResult.error.message ||
            "Compile error",
        });

        continue;
      }

      const runResult = await runCommand("java", ["Main"], {
        cwd: tempDir,
        timeout: limit,
      });

      if (runResult.error) {
        results.push({
          index: index + 1,
          input: testcase.input || [],
          expected_output: expectedOutput,
          actual_output: null,
          passed: false,
          error: runResult.stderr || runResult.error.message || "Runtime error",
        });

        continue;
      }

      const actualOutput = String(runResult.stdout || "").trim();
      const expectedText = normalizeExpected(expectedOutput).trim();

      results.push({
        index: index + 1,
        input: testcase.input || [],
        expected_output: expectedOutput,
        actual_output: actualOutput,
        passed: actualOutput === expectedText,
        error: null,
      });
    }

    const allPassed = results.every((result) => result.passed);

    return {
      success: allPassed,
      message: allPassed
        ? "Semua testcase Java berhasil."
        : "Masih ada testcase Java yang gagal.",
      results,
    };
  } finally {
    fs.rmSync(tempDir, {
      recursive: true,
      force: true,
    });
  }
};

const runCode = async (req, res) => {
  try {
    const {
      language,
      code,
      function_name,
      getter_name,
      constructor_input_count,
      testcases,
      time_limit_ms,
    } = req.body;

    if (!language || !code || !function_name) {
      return res.status(400).json({
        success: false,
        message: "language, code, dan function_name wajib diisi",
      });
    }

    if (!Array.isArray(testcases) || testcases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "testcases wajib berupa array dan tidak boleh kosong",
      });
    }

    const normalizedLanguage = String(language || "").toLowerCase();

    if (normalizedLanguage !== "java") {
      return res.status(400).json({
        success: false,
        message: "Backend runner ini hanya mendukung Java.",
      });
    }

    const result = await runJavaTestcases({
      code,
      function_name,
      getter_name,
      constructor_input_count,
      testcases,
      time_limit_ms,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  runCode,
};
