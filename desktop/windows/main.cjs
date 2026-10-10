const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const net = require('net');
const { randomBytes } = require('crypto');
const { pathToFileURL } = require('url');

app.commandLine.removeSwitch('remote-debugging-port');
app.commandLine.removeSwitch('remote-debugging-pipe');

const AI_MODEL = 'Claude2 Alpaca 7B Q4_K_M';
const AI_MODEL_FILE = 'claude2-alpaca-7b.Q4_K_M.gguf';
const AI_STARTUP_TIMEOUT_MS = 10 * 60 * 1000;
const AI_HOST = '127.0.0.1';
let aiProcess = null;
let aiServerUrl = null;
let aiApiKey = null;
let aiStartupError = null;
let aiModelReady = false;
let aiStartupPromise = null;
let aiIpcRegistered = false;
let startupIpcRegistered = false;
let startupWindow = null;
let appWindow = null;
let startupWindowShownAt = 0;
let startupChoiceMade = false;
let aiLogPath = null;
let aiLogStream = null;
let aiRequestSequence = 0;
let aiStartupStartedAt = 0;
let aiProgress = {
  phase: 'starting',
  message: 'Iniciando o runtime local...',
};

function initializeAiLogging() {
  const candidateLogPath = path.join(app.getPath('userData'), 'logs', 'local-ai.log');
  try {
    fs.mkdirSync(path.dirname(candidateLogPath), { recursive: true });
    aiLogPath = candidateLogPath;
    aiLogStream = fs.createWriteStream(aiLogPath, { flags: 'a' });
  } catch (error) {
    console.error('[LOCAL-AI] Não foi possível inicializar o arquivo de log:', error);
  }
  if (aiLogStream) {
    aiLogStream.on('error', error => {
      console.error(`[LOCAL-AI] Não foi possível gravar o arquivo de log ${aiLogPath}:`, error);
    });
  }
  logAi('application.start', {
    version: app.getVersion(),
    packaged: app.isPackaged,
    platform: process.platform,
    architecture: process.arch,
    logPath: aiLogPath || 'Indisponível; consulte o terminal do app.',
  });
}

function logAi(event, details = {}) {
  let serializedDetails;
  try {
    serializedDetails = JSON.stringify(details, (_key, value) => (
      typeof value === 'string' && aiApiKey
        ? value.replaceAll(aiApiKey, '[REDACTED]')
        : value
    ));
  } catch (error) {
    serializedDetails = JSON.stringify({
      loggingError: error instanceof Error ? error.message : 'Não foi possível serializar os detalhes.',
    });
  }
  const line = `[LOCAL-AI] ${new Date().toISOString()} ${event} ${serializedDetails || '{}'}`;
  console.info(line);
  if (aiLogStream && !aiLogStream.destroyed) {
    aiLogStream.write(`${line}\n`);
  }
}

function logRuntimeOutput(streamName, text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const message = line.trim();
    if (message) logAi(`runtime.${streamName}`, { message: message.slice(0, 4000) });
  }
}

function logRendererAiDiagnostic(eventName, details) {
  const allowedEvents = new Set([
    'ui.submit_received',
    'ui.submit_blocked',
    'ui.generate_started',
    'ui.generate_succeeded',
    'ui.generate_failed',
    'ui.context_prepare_failed',
  ]);
  if (typeof eventName !== 'string' || !allowedEvents.has(eventName)) {
    logAi('ui.diagnostic_rejected', { reason: 'unknown_event' });
    return;
  }

  const safeDetails = {};
  if (details && typeof details === 'object') {
    for (const key of [
      'reason',
      'requestId',
      'promptLength',
      'responseLength',
      'elapsedMs',
      'errorName',
      'errorMessage',
      'hasQuestion',
      'yearAvailable',
      'modelReady',
      'dataReady',
    ]) {
      const value = details[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        safeDetails[key] = value;
      } else if (typeof value === 'string') {
        safeDetails[key] = value.slice(0, 500);
      } else if (typeof value === 'boolean') {
        safeDetails[key] = value;
      }
    }
  }
  logAi(eventName, safeDetails);
}

function updateAiProgress(phase, message) {
  aiProgress = { phase, message };
  logAi('startup.progress', { phase, message });
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send('ai:progress', aiProgress);
    }
  }
  if (startupWindow && !startupWindow.isDestroyed()) {
    startupWindow.webContents.send('startup:progress', getAiStatus());
  }
}

function isTrustedRenderer(url, devServerOrigin, appHtmlUrl) {
  try {
    const candidate = new URL(url);
    if (devServerOrigin) return candidate.origin === devServerOrigin;
    return candidate.protocol === 'file:' && candidate.pathname === appHtmlUrl.pathname;
  } catch {
    return false;
  }
}

function getAiResourceDirectory() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'ai-runtime')
    : path.resolve(__dirname, '..', '..', 'runtime-ai');
}

function getAppIconPath() {
  return app.isPackaged
    ? path.join(app.getAppPath(), 'dist', 'icon-512x512.png')
    : path.resolve(__dirname, '..', '..', 'public', 'icon-512x512.png');
}

function getAiStatus() {
  const resourceDirectory = getAiResourceDirectory();
  const modelPath = path.join(resourceDirectory, 'models', AI_MODEL_FILE);
  const modelAvailable = fs.existsSync(modelPath);
  const available = Boolean(aiProcess && aiProcess.exitCode === null && aiModelReady);
  return {
    available,
    modelAvailable,
    modelReady: aiModelReady,
    modelLoading: Boolean(aiStartupPromise) && !aiModelReady,
    model: AI_MODEL,
    progress: aiProgress,
    message: aiStartupError
      || (!modelAvailable
        ? 'Modelo local ausente. Confira runtime-ai/models e prepare novamente o pacote desktop.'
        : aiModelReady
          ? 'IA local pronta.'
          : 'Carregando o modelo local (4,08 GB). A primeira inicialização pode levar alguns minutos.'),
  };
}

function reserveLoopbackPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, AI_HOST, () => {
      const address = server.address();
      server.close(error => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

async function waitForAiServer() {
  const deadline = Date.now() + AI_STARTUP_TIMEOUT_MS;
  let lastError = null;
  let lastDiagnosticAt = 0;
  while (Date.now() < deadline) {
    if (aiStartupError || !aiProcess || aiProcess.exitCode !== null) {
      logAi('health.process_unavailable', {
        startupError: aiStartupError,
        exitCode: aiProcess?.exitCode ?? null,
      });
      throw new Error(aiStartupError || 'O servidor llama.cpp encerrou antes de carregar o modelo.');
    }
    try {
      const response = await fetch(`${aiServerUrl}/health`, {
        headers: { Authorization: `Bearer ${aiApiKey}` },
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        aiModelReady = true;
        aiStartupError = null;
        logAi('health.ready', {
          status: response.status,
          elapsedMs: Date.now() - aiStartupStartedAt,
        });
        updateAiProgress('ready', 'IA local pronta. Abrindo o aplicativo...');
        return;
      }
      lastError = `llama.cpp respondeu com HTTP ${response.status} ao carregar o modelo.`;
      if (Date.now() - lastDiagnosticAt >= 15000) {
        logAi('health.waiting', { status: response.status, detail: lastError });
        lastDiagnosticAt = Date.now();
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Aguardando o servidor llama.cpp.';
      if (Date.now() - lastDiagnosticAt >= 15000) {
        logAi('health.waiting', { detail: lastError });
        lastDiagnosticAt = Date.now();
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`O modelo local não ficou pronto em até 10 minutos${lastError ? `: ${lastError}` : '.'}`);
}

async function startLocalAi() {
  aiStartupStartedAt = Date.now();
  updateAiProgress('starting', 'Verificando os arquivos do modelo local...');
  const resourceDirectory = getAiResourceDirectory();
  const binaryDirectory = path.join(resourceDirectory, 'bin');
  const executablePath = path.join(binaryDirectory, 'llama-server.exe');
  const modelPath = path.join(resourceDirectory, 'models', AI_MODEL_FILE);
  const runtimeExists = fs.existsSync(executablePath);
  const modelExists = fs.existsSync(modelPath);
  logAi('startup.resources', {
    resourceDirectory,
    executablePath,
    modelPath,
    runtimeExists,
    modelExists,
    modelBytes: modelExists ? fs.statSync(modelPath).size : null,
  });
  if (!runtimeExists || !modelExists) {
    throw new Error(
      `Runtime llama.cpp ou modelo GGUF ausente em ${resourceDirectory}. Execute npm run desktop:ai:prepare.`,
    );
  }

  const port = await reserveLoopbackPort();
  aiServerUrl = `http://${AI_HOST}:${port}`;
  aiApiKey = randomBytes(32).toString('hex');
  const cpuCount = typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
  const threads = Math.max(1, Math.min(12, cpuCount - 1));
  logAi('runtime.spawn', {
    executablePath,
    modelPath,
    host: AI_HOST,
    port,
    threads,
    availableMemoryBytes: os.freemem(),
    totalMemoryBytes: os.totalmem(),
    cpuCount,
    contextSize: 4096,
    batchSize: 256,
    parallel: 1,
  });
  aiProcess = spawn(executablePath, [
    '--model', modelPath,
    '--host', AI_HOST,
    '--port', String(port),
    '--api-key', aiApiKey,
    '--alias', 'claude2-alpaca-7b',
    '--ctx-size', '4096',
    '--batch-size', '256',
    '--ubatch-size', '128',
    '--parallel', '1',
    '--threads', String(threads),
    '--no-webui',
  ], {
    cwd: binaryDirectory,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const currentProcess = aiProcess;
  updateAiProgress('loading-model', 'Carregando os pesos do modelo (4,08 GB). Isso pode levar alguns minutos...');

  let stderr = '';
  let stdout = '';
  currentProcess.stdout.setEncoding('utf8');
  currentProcess.stdout.on('data', chunk => {
    stdout = `${stdout}${chunk}`.slice(-8000);
    logRuntimeOutput('stdout', chunk);
  });
  currentProcess.stderr.setEncoding('utf8');
  currentProcess.stderr.on('data', chunk => {
    stderr = `${stderr}${chunk}`.slice(-8000);
    logRuntimeOutput('stderr', chunk);
    if (/load[_ ]tensors|loading model|model loader/i.test(chunk)) {
      updateAiProgress('loading-model', 'Lendo os pesos e preparando o modelo para uso...');
    }
    if (/context|kv cache|memory required/i.test(chunk)) {
      updateAiProgress('initializing', 'Inicializando o contexto de conversação...');
    }
  });
  currentProcess.once('spawn', () => {
    logAi('runtime.spawned', { pid: currentProcess.pid });
  });
  currentProcess.once('error', error => {
    aiStartupError = `Não foi possível iniciar o runtime llama.cpp: ${error.message}`;
    aiModelReady = false;
    logAi('runtime.spawn_error', {
      code: error.code,
      message: error.message,
      executablePath,
      cwd: binaryDirectory,
    });
    updateAiProgress('error', aiStartupError);
    console.error(aiStartupError);
  });
  currentProcess.once('exit', (code, signal) => {
    aiModelReady = false;
    logAi('runtime.exit', {
      code,
      signal,
      pid: currentProcess.pid,
      stderrTail: stderr.slice(-4000),
      stdoutTail: stdout.slice(-2000),
    });
    if (code !== 0 && code !== null) {
      aiStartupError = `O servidor llama.cpp encerrou com código ${code}.${stderr ? ` ${stderr.trim()}` : ''}`;
      updateAiProgress('error', aiStartupError);
      console.error(aiStartupError);
    } else if (signal) {
      console.info(`Servidor llama.cpp encerrado pelo sinal ${signal}.`);
    }
    aiProcess = null;
  });

  await waitForAiServer();
}

function beginLocalAiStartup() {
  if (aiModelReady) {
    logAi('startup.already_ready');
    return Promise.resolve();
  }
  if (aiStartupPromise) {
    logAi('startup.join_existing');
    return aiStartupPromise;
  }

  aiStartupError = null;
  logAi('startup.begin', { model: AI_MODEL });
  updateAiProgress('starting', 'Iniciando o modelo local...');
  aiStartupPromise = startLocalAi()
    .catch(error => {
      aiStartupError = error instanceof Error ? error.message : 'Falha ao iniciar o modelo local.';
      logAi('startup.failed', {
        elapsedMs: Date.now() - aiStartupStartedAt,
        message: aiStartupError,
        stack: error instanceof Error ? error.stack : undefined,
      });
      updateAiProgress('error', aiStartupError);
      console.error(aiStartupError);
      if (aiProcess && !aiProcess.killed) aiProcess.kill();
      aiProcess = null;
      throw error;
    })
    .finally(() => {
      aiStartupPromise = null;
      logAi('startup.finished', {
        elapsedMs: Date.now() - aiStartupStartedAt,
        ready: aiModelReady,
      });
    });
  return aiStartupPromise;
}

function registerStartupIpc() {
  if (startupIpcRegistered) return;

  const isStartupSender = event => (
    startupWindow
    && !startupWindow.isDestroyed()
    && event.sender === startupWindow.webContents
  );

  ipcMain.handle('startup:status', event => {
    if (!isStartupSender(event)) {
      throw new Error('Origem não autorizada para consultar o início do aplicativo.');
    }
    return getAiStatus();
  });
  ipcMain.handle('startup:retry', async event => {
    if (!isStartupSender(event)) {
      throw new Error('Origem não autorizada para reiniciar o modelo local.');
    }
    logAi('startup.retry_requested');
    try {
      await beginLocalAiStartup();
      completeStartup();
    } catch {
      return getAiStatus();
    }
    return getAiStatus();
  });
  ipcMain.on('startup:continue', event => {
    if (!isStartupSender(event)) {
      console.error('Origem não autorizada tentou continuar sem a IA local.');
      return;
    }
    logAi('startup.continue_without_ai');
    openAppWindow('continue_without_ai');
  });

  startupIpcRegistered = true;
}

function createStartupWindow() {
  if (startupWindow && !startupWindow.isDestroyed()) {
    startupWindow.focus();
    return;
  }

  registerStartupIpc();
  startupWindowShownAt = 0;
  const startupHtmlPath = path.join(__dirname, 'startup.html');
  const win = new BrowserWindow({
    width: 560,
    height: 560,
    resizable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    frame: false,
    center: true,
    icon: getAppIconPath(),
    backgroundColor: '#f4f6fb',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'startup-preload.cjs'),
    },
  });
  startupWindow = win;

  win.once('ready-to-show', () => {
    if (win.isDestroyed()) return;
    startupWindowShownAt = Date.now();
    logAi('startup.window_visible');
    win.show();
    if (aiModelReady) completeStartup();
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== pathToFileURL(startupHtmlPath).href) event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    logAi('startup.window_load_failed', { errorCode, errorDescription, url: validatedURL });
  });
  win.webContents.on('console-message', (_event, details) => {
    if (details.level >= 2) {
      logAi('startup.renderer_console_error', {
        level: details.level,
        message: details.message,
        line: details.lineNumber,
        source: details.sourceId,
      });
    }
  });
  win.on('closed', () => {
    if (startupWindow === win) startupWindow = null;
  });
  win.loadFile(startupHtmlPath);
}

async function completeStartup() {
  if (!aiModelReady || startupChoiceMade) return;
  const currentStartupWindow = startupWindow;
  if (currentStartupWindow && !currentStartupWindow.isDestroyed() && !currentStartupWindow.isVisible()) {
    await new Promise(resolve => currentStartupWindow.once('ready-to-show', resolve));
  }
  if (startupChoiceMade || !aiModelReady) return;

  const visibleDuration = Date.now() - startupWindowShownAt;
  await new Promise(resolve => setTimeout(resolve, Math.max(0, 900 - visibleDuration)));
  if (startupChoiceMade || !aiModelReady) return;
  logAi('startup.ui_completed', { visibleDurationMs: Date.now() - startupWindowShownAt });
  openAppWindow('model_ready');
}

function openAppWindow(reason) {
  if (startupChoiceMade) return;
  startupChoiceMade = true;
  logAi('application.window_requested', { reason });
  createWindow();
}

function createWindow() {
  if (appWindow && !appWindow.isDestroyed()) {
    appWindow.focus();
    return appWindow;
  }

  const appHtmlPath = path.resolve(__dirname, '..', '..', 'dist', 'index.html');
  const appHtmlUrl = new URL(pathToFileURL(appHtmlPath));
  const devServerUrl = !app.isPackaged && process.env.VITE_DEV_SERVER_URL;
  const devServerOrigin = devServerUrl ? new URL(devServerUrl).origin : null;
  const isAllowedAppUrl = url => isTrustedRenderer(url, devServerOrigin, appHtmlUrl);

  if (!aiIpcRegistered) {
    ipcMain.handle('ai:status', async event => {
      if (!isAllowedAppUrl(event.senderFrame.url)) {
        logAi('ipc.rejected', { channel: 'ai:status' });
        throw new Error('Origem não autorizada para acessar a IA local.');
      }
      return getAiStatus();
    });
    ipcMain.handle('ai:warmup', async event => {
      if (!isAllowedAppUrl(event.senderFrame.url)) {
        logAi('ipc.rejected', { channel: 'ai:warmup' });
        throw new Error('Origem não autorizada para acessar a IA local.');
      }
      logAi('ipc.warmup_requested');
      await beginLocalAiStartup();
      return getAiStatus();
    });
    ipcMain.handle('ai:chat', async (event, prompt, requestId) => {
      if (!isAllowedAppUrl(event.senderFrame.url)) {
        logAi('ipc.rejected', { channel: 'ai:chat' });
        throw new Error('Origem não autorizada para acessar a IA local.');
      }
      if (typeof prompt !== 'string' || prompt.length === 0 || prompt.length > 50000) {
        logAi('chat.invalid_request', {
          promptType: typeof prompt,
          promptLength: typeof prompt === 'string' ? prompt.length : null,
        });
        throw new Error('A pergunta enviada para a IA local é inválida.');
      }

      const internalRequestId = ++aiRequestSequence;
      const diagnosticRequestId = Number.isSafeInteger(requestId) ? requestId : internalRequestId;
      const requestStartedAt = Date.now();
      logAi('chat.request_started', { requestId: diagnosticRequestId, promptLength: prompt.length });
      try {
        await beginLocalAiStartup();
        const alpacaPrompt = [
        'Below is an instruction that describes a task. Write a response that appropriately completes the request.',
        '',
        '### Instruction:',
        'Você é um assistente de finanças pessoais. Responda em português do Brasil, de forma clara e concisa, usando somente os dados fornecidos. Não invente valores; quando os dados não forem suficientes, diga isso explicitamente. Suas respostas são informativas e não substituem aconselhamento financeiro profissional.',
        '',
        prompt,
        '',
        '### Response:',
        ].join('\n');
        const FIRST_TOKEN_TIMEOUT_MS = 15 * 60 * 1000;
        const IDLE_TIMEOUT_MS = 2 * 60 * 1000;
        const controller = new AbortController();
        let idleTimer = null;
        let timedOut = false;
        const armIdleTimer = ms => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            timedOut = true;
            controller.abort();
          }, ms);
        };
        armIdleTimer(FIRST_TOKEN_TIMEOUT_MS);
        let answer = '';
        let timings = null;
        try {
        const response = await fetch(`${aiServerUrl}/completion`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: alpacaPrompt,
          stream: true,
          n_predict: 256,
          temperature: 0.3,
          stop: ['### Instruction:', '### Response:'],
          cache_prompt: true,
        }),
        signal: controller.signal,
        });
        logAi('chat.http_response', {
          requestId: diagnosticRequestId,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          elapsedMs: Date.now() - requestStartedAt,
        });
        if (!response.ok) {
          throw new Error(`llama.cpp respondeu com HTTP ${response.status} (${response.statusText}).`);
        }

        const appendChunk = content => {
          if (!content) return;
          answer += content;
          if (answer.length === content.length) {
            logAi('chat.first_chunk', {
              requestId: diagnosticRequestId,
              firstTokenDelayMs: Date.now() - requestStartedAt,
            });
          }
        };
        const processLine = line => {
          if (!line.startsWith('data:')) return;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') return;

          let chunk;
          try {
            chunk = JSON.parse(data);
          } catch (error) {
            logAi('chat.invalid_stream_event', {
              requestId: diagnosticRequestId,
              message: error instanceof Error ? error.message : 'JSON inválido',
            });
            return;
          }
          if (chunk.error) {
            throw new Error(chunk.error.message || 'llama.cpp retornou um erro durante a geração.');
          }
          if (typeof chunk.content === 'string' && chunk.content) {
            appendChunk(chunk.content);
          }
          if (chunk.timings) timings = chunk.timings;
        };

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream')) {
          if (!response.body) {
            throw new Error('llama.cpp não disponibilizou o fluxo da resposta.');
          }
          logAi('chat.stream_started', { requestId: diagnosticRequestId });
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let pending = '';
          while (true) {
            const { done, value } = await reader.read();
            armIdleTimer(IDLE_TIMEOUT_MS);
            pending += decoder.decode(value, { stream: !done });
            const lines = pending.split(/\r?\n/);
            pending = lines.pop() || '';
            for (const line of lines) processLine(line);
            if (done) {
              if (pending) processLine(pending);
              break;
            }
          }
        } else {
          const result = await response.json();
          if (typeof result.content !== 'string') {
            throw new Error('llama.cpp retornou um formato de resposta inválido.');
          }
          timings = result.timings ?? null;
          appendChunk(result.content);
        }
        } catch (error) {
          if (timedOut) {
            throw new Error('A IA local demorou demais para responder. Tente uma pergunta mais curta ou aguarde o computador ficar menos ocupado.');
          }
          throw error;
        } finally {
          clearTimeout(idleTimer);
        }

        answer = answer.trim();
        if (!answer) {
          logAi('chat.empty_response', {
            requestId: diagnosticRequestId,
            elapsedMs: Date.now() - requestStartedAt,
          });
          throw new Error('O modelo terminou sem gerar uma resposta. Tente novamente com uma pergunta mais curta.');
        }
        logAi('chat.request_succeeded', {
          requestId: diagnosticRequestId,
          responseLength: answer.length,
          elapsedMs: Date.now() - requestStartedAt,
          timings,
        });
        return answer;
      } catch (error) {
        logAi('chat.request_failed', {
          requestId: diagnosticRequestId,
          elapsedMs: Date.now() - requestStartedAt,
          name: error instanceof Error ? error.name : typeof error,
          message: error instanceof Error ? error.message : 'Falha desconhecida na geração local.',
        });
        throw error;
      }
    });
    ipcMain.on('ai:diagnostic', (event, payload) => {
      if (!isAllowedAppUrl(event.senderFrame.url)) {
        logAi('ipc.rejected', { channel: 'ai:diagnostic' });
        return;
      }
      logRendererAiDiagnostic(payload?.event, payload?.details);
    });
    aiIpcRegistered = true;
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    show: false,
    icon: getAppIconPath(),
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: Boolean(devServerUrl),
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  appWindow = win;

  win.removeMenu();
  win.once('ready-to-show', () => {
    if (win.isDestroyed()) return;
    logAi('application.window_visible');
    win.show();
    if (startupWindow && !startupWindow.isDestroyed()) {
      const currentStartupWindow = startupWindow;
      startupWindow = null;
      currentStartupWindow.close();
    }
  });
  win.on('closed', () => {
    if (appWindow === win) appWindow = null;
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedAppUrl(url)) event.preventDefault();
  });
  win.webContents.on('will-redirect', (event, url) => {
    if (!isAllowedAppUrl(url)) event.preventDefault();
  });
  win.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const toggleDevTools = (input.control || input.meta) && input.shift && key === 'i';
    const devToolsShortcut = key === 'f12'
      || ((input.control || input.meta) && (input.shift || input.alt) && ['i', 'j', 'c'].includes(key));

    if (devServerUrl && toggleDevTools) {
      event.preventDefault();
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools({ mode: 'detach' });
      }
      return;
    }

    if (!devServerUrl && devToolsShortcut) {
      event.preventDefault();
    }
  });

  if (devServerUrl) {
    logAi('application.renderer_load_started', { url: devServerUrl });
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      logAi('application.renderer_load_failed', { errorCode, errorDescription, url: validatedURL });
    });
    win.loadURL(devServerUrl);
  } else {
    logAi('application.renderer_load_started', { url: appHtmlPath });
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      logAi('application.renderer_load_failed', { errorCode, errorDescription, url: validatedURL });
    });
    win.loadFile(appHtmlPath);
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (new URL(url).protocol === 'https:') {
        shell.openExternal(url).catch(() => {});
      }
    } catch {
      // Ignore malformed or unsupported external URLs.
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  initializeAiLogging();
  createStartupWindow();
  beginLocalAiStartup().then(completeStartup).catch(() => {});

  app.on('activate', () => {
    if (appWindow && !appWindow.isDestroyed()) {
      appWindow.focus();
    } else if (startupWindow && !startupWindow.isDestroyed()) {
      startupWindow.focus();
    } else if (startupChoiceMade) {
      createWindow();
    } else {
      createStartupWindow();
      beginLocalAiStartup().then(completeStartup).catch(() => {});
    }
  });
});

app.on('before-quit', () => {
  logAi('application.quit');
  if (aiProcess && !aiProcess.killed) {
    aiProcess.kill();
  }
  if (aiLogStream && !aiLogStream.destroyed) {
    aiLogStream.end();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
