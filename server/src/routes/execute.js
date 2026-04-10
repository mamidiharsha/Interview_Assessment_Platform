const express = require('express');
const { authenticate } = require('../middleware/auth');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const router = express.Router();

const LANGUAGE_CONFIG = {
    javascript: {
        extension: '.js',
        command: (file) => `node "${file}"`,
        timeout: 10000
    },
    python: {
        extension: '.py',
        command: (file) => `python "${file}"`,
        timeout: 10000
    },
    cpp: {
        extension: '.cpp',
        compile: (file, output) => `g++ -o "${output}" "${file}"`,
        command: (file, output) => `"${output}"`,
        timeout: 15000
    },
    java: {
        extension: '.java',
        compile: (file) => `javac "${file}"`,
        command: (file, _, dir) => `java -cp "${dir}" Main`,
        timeout: 15000,
        className: 'Main'
    }
};

// Execute code against test cases
router.post('/run', authenticate, async (req, res) => {
    try {
        const { code, language, testCases, customInput } = req.body;
        const config = LANGUAGE_CONFIG[language];
        if (!config) return res.status(400).json({ error: 'Unsupported language' });

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-'));
        const fileName = language === 'java' ? 'Main' : 'solution';
        const filePath = path.join(tmpDir, fileName + config.extension);
        fs.writeFileSync(filePath, code);

        const results = [];
        let outputPath = path.join(tmpDir, 'solution');

        // Compile if needed
        if (config.compile) {
            try {
                execSync(config.compile(filePath, outputPath), { timeout: config.timeout, cwd: tmpDir });
            } catch (compileErr) {
                // Cleanup
                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }
                return res.json({
                    error: 'Compilation Error',
                    errorLog: compileErr.stderr?.toString() || compileErr.message,
                    results: [],
                    passed: 0,
                    failed: testCases ? testCases.length : 0,
                    total: testCases ? testCases.length : 0
                });
            }
        }

        // If custom input, just run once with that input
        if (customInput !== undefined && customInput !== null) {
            try {
                const startTime = Date.now();
                const output = execSync(config.command(filePath, outputPath, tmpDir), {
                    input: customInput,
                    timeout: config.timeout,
                    cwd: tmpDir,
                    maxBuffer: 1024 * 1024
                });
                const executionTime = Date.now() - startTime;

                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }
                return res.json({
                    output: output.toString().trim(),
                    executionTime,
                    results: [],
                    passed: 0,
                    failed: 0,
                    total: 0
                });
            } catch (runErr) {
                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }
                return res.json({
                    error: runErr.killed ? 'Time Limit Exceeded' : 'Runtime Error',
                    errorLog: runErr.stderr?.toString() || runErr.message,
                    output: '',
                    results: [],
                    passed: 0,
                    failed: 0,
                    total: 0
                });
            }
        }

        // Run against test cases
        let passed = 0;
        let failed = 0;
        let totalTime = 0;

        for (const tc of (testCases || [])) {
            try {
                const startTime = Date.now();
                const output = execSync(config.command(filePath, outputPath, tmpDir), {
                    input: tc.input,
                    timeout: config.timeout,
                    cwd: tmpDir,
                    maxBuffer: 1024 * 1024
                });
                const executionTime = Date.now() - startTime;
                totalTime += executionTime;

                const actual = output.toString().trim();
                const expected = tc.expectedOutput.trim();
                const isPassed = actual === expected;

                if (isPassed) passed++;
                else failed++;

                results.push({
                    input: tc.isHidden ? 'Hidden' : tc.input,
                    expected: tc.isHidden ? 'Hidden' : expected,
                    actual: tc.isHidden ? 'Hidden' : actual,
                    passed: isPassed,
                    executionTime,
                    isHidden: tc.isHidden
                });
            } catch (runErr) {
                failed++;
                results.push({
                    input: tc.isHidden ? 'Hidden' : tc.input,
                    expected: tc.isHidden ? 'Hidden' : tc.expectedOutput.trim(),
                    actual: tc.isHidden ? 'Hidden' : (runErr.killed ? 'Time Limit Exceeded' : 'Runtime Error'),
                    passed: false,
                    error: runErr.stderr?.toString() || runErr.message,
                    isHidden: tc.isHidden
                });
            }
        }

        // Cleanup
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }

        res.json({
            results,
            passed,
            failed,
            total: passed + failed,
            executionTime: totalTime
        });
    } catch (err) {
        res.status(500).json({ error: 'Execution failed', errorLog: err.message });
    }
});

module.exports = router;
