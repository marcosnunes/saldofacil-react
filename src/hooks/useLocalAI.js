import { useCallback, useEffect, useRef, useState } from "react";

const MODEL_NAME = "Llama 3.2 3B Instruct Q4_K_M";
const MAX_PROMPT_LENGTH = 50000;
let generationSequence = 0;

function logLocalAI(event, details = {}) {
  console.info(`[LOCAL-AI][renderer] ${event}`, details);
  window.desktop?.localAILog?.(event, details);
}

async function requestLocalAIStatus() {
  if (!window.desktop?.localAIStatus) {
    return {
      available: false,
      modelAvailable: false,
      model: MODEL_NAME,
      message: "A IA local está disponível somente no aplicativo desktop para Windows.",
    };
  }

  try {
    return await window.desktop.localAIStatus();
  } catch (statusError) {
    return {
      available: false,
      modelAvailable: false,
      model: MODEL_NAME,
      message: statusError instanceof Error ? statusError.message : "Não foi possível consultar a IA local no desktop.",
    };
  }
}

async function generateWithLocalAI(prompt, requestId) {
  if (!window.desktop?.localAIChat) {
    throw new Error("A IA local está disponível somente no aplicativo desktop para Windows.");
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error("O contexto financeiro excede o limite aceito pela IA local.");
  }

  return window.desktop.localAIChat(prompt, requestId);
}

export function useLocalAI() {
  const [status, setStatus] = useState({
    available: false,
    modelAvailable: false,
    model: MODEL_NAME,
    message: "Iniciando o modelo local...",
  });
  const [isChecking, setIsChecking] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState(null);
  const activeRequestId = useRef(null);

  const cancel = useCallback(() => {
    if (activeRequestId.current === null) return;
    logLocalAI("ui.generate_cancel_requested", { requestId: activeRequestId.current });
    window.desktop?.localAICancel?.(activeRequestId.current);
  }, []);

  const requestStatus = useCallback(async () => requestLocalAIStatus(), []);

  const loadModel = useCallback(async () => {
    setIsChecking(true);
    try {
      const nextStatus = window.desktop?.localAIWarmup
        ? await window.desktop.localAIWarmup()
        : await requestStatus();
      setStatus(nextStatus);
    } catch (warmupError) {
      const latestStatus = await requestStatus();
      setStatus({
        ...latestStatus,
        message: warmupError instanceof Error ? warmupError.message : latestStatus.message,
      });
    } finally {
      setIsChecking(false);
    }
  }, [requestStatus]);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      const nextStatus = await requestStatus();
      if (isMounted) {
        setStatus(nextStatus);
        setIsChecking(false);
      }
    };

    checkStatus();
    const intervalId = window.setInterval(() => {
      if (!status.available || !status.modelAvailable || status.modelLoading) {
        checkStatus();
      }
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [requestStatus, status.available, status.modelAvailable, status.modelLoading]);

  const generate = useCallback(async (prompt) => {
    const requestId = ++generationSequence;
    const startedAt = Date.now();
    logLocalAI("ui.generate_started", {
      requestId,
      promptLength: typeof prompt === "string" ? prompt.length : null,
    });
    setIsGenerating(true);
    activeRequestId.current = requestId;
    setResponse("");
    setError(null);
    try {
      const result = await generateWithLocalAI(prompt, requestId);
      if (!result.trim()) {
        throw new Error("O modelo terminou sem gerar uma resposta. Tente novamente com uma pergunta mais curta.");
      }
      logLocalAI("ui.generate_succeeded", {
        requestId,
        responseLength: result.length,
        elapsedMs: Date.now() - startedAt,
      });
      setResponse(result);
    } catch (generationError) {
      if (generationError instanceof Error && generationError.message.includes("AI_CANCELLED")) {
        logLocalAI("ui.generate_cancelled", { requestId, elapsedMs: Date.now() - startedAt });
        return;
      }
      const errorMessage = generationError instanceof Error
        ? generationError.message
        : "Falha ao gerar resposta com a IA local.";
      logLocalAI("ui.generate_failed", {
        errorName: generationError instanceof Error ? generationError.name : typeof generationError,
        errorMessage,
        elapsedMs: Date.now() - startedAt,
        requestId,
      });
      setError(errorMessage);
    } finally {
      if (activeRequestId.current === requestId) activeRequestId.current = null;
      setIsGenerating(false);
    }
  }, []);

  const prewarm = useCallback(prefix => {
    window.desktop?.localAIPrefill?.(prefix)?.catch?.(() => {});
  }, []);

  const isLoaded = status.available && status.modelAvailable && status.modelReady;
  return {
    isLoaded,
    prewarm,
    isLoading: isChecking || status.modelLoading,
    isGenerating,
    response,
    error,
    statusMessage: status.message,
    model: status.model,
    loadModel,
    generate,
    cancel,
    canUseLocal: isLoaded,
  };
}
