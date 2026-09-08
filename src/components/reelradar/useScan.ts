"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReelSource } from "@/lib/reelRadarTypes";

export interface ScanProgress {
  phase: "idle" | "collecting" | "analyzing" | "done";
  done: number;
  total: number;
  failed: number;
}

const IDLE: ScanProgress = { phase: "idle", done: 0, total: 0, failed: 0 };

// Drives the resumable scan pipeline (start -> poll /status while collecting ->
// loop /continue while analyzing) from the client, and resumes automatically on
// mount if a scan of this type was already running (e.g. left over from before the
// tab was closed). See src/app/api/reel-radar/scan/ for the server side of this.
export function useScan(type: ReelSource, onFinished: () => void) {
  const [progress, setProgress] = useState<ScanProgress>(IDLE);
  const [error, setError] = useState<string | null>(null);
  const runIdRef = useRef<string | null>(null);
  const stoppedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const drive = useCallback(async (runId: string) => {
    runIdRef.current = runId;
    stoppedRef.current = false;

    while (!stoppedRef.current) {
      const res = await fetch(`/api/reel-radar/scan/${runId}/status`).then((r) => r.json());
      if (res.error) {
        setError(res.error);
        setProgress(IDLE);
        return;
      }
      setProgress({ phase: res.phase, done: res.done, total: res.total, failed: res.failed });
      if (res.finished) {
        onFinishedRef.current();
        setProgress(IDLE);
        return;
      }
      if (res.phase === "analyzing") break;
      await new Promise((r) => setTimeout(r, 2500));
    }

    while (!stoppedRef.current) {
      const res = await fetch(`/api/reel-radar/scan/${runId}/continue`, { method: "POST" }).then((r) => r.json());
      setProgress((p) => ({ ...p, phase: "analyzing", done: res.done, total: res.total, failed: res.failed }));
      if (res.finished) {
        onFinishedRef.current();
        setProgress(IDLE);
        return;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setProgress({ phase: "collecting", done: 0, total: 0, failed: 0 });
    const res = await fetch("/api/reel-radar/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    }).then((r) => r.json());
    if (res.error) {
      setError(res.error);
      setProgress(IDLE);
      return;
    }
    drive(res.runId);
  }, [type, drive]);

  const cancel = useCallback(async () => {
    stoppedRef.current = true;
    const runId = runIdRef.current;
    if (runId) {
      await fetch("/api/reel-radar/scan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
    }
    setProgress(IDLE);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reel-radar/scan/active?type=${type}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res.runId) drive(res.runId);
      });
    return () => {
      cancelled = true;
      stoppedRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return { progress, error, start, cancel, scanning: progress.phase !== "idle" };
}
