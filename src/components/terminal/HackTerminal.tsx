"use client";

import { useEffect, useRef, useState } from "react";
import { createTerminalState, runLocalCommand, type TerminalState } from "@/lib/terminal/engine";

export function HackTerminal({ challengeSlug }: { challengeSlug?: string }) {
  const [state, setState] = useState<TerminalState>(() => createTerminalState());
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [state.lines]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const command = value;
    setValue("");
    if (!command.trim()) return;
    const next: TerminalState = {
      ...state,
      history: [...state.history, command],
      histIndex: -1,
      lines: [...state.lines, `${state.user}@lab:${state.cwd}$ ${command}`],
    };
    const result = runLocalCommand(next, command);
    if (result.clear) {
      setState({ ...next, lines: [] });
      return;
    }
    if (result.cwd) next.cwd = result.cwd;
    if (result.output.length) next.lines.push(...result.output);

    if (result.remoteCat || result.remoteLs || result.remoteNet) {
      setBusy(true);
      try {
        const response = await fetch("/api/terminal/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeSlug,
            cat: result.remoteCat,
            ls: result.remoteLs,
            net: result.remoteNet,
          }),
        });
        const payload = await response.json();
        if (Array.isArray(payload.lines)) next.lines.push(...payload.lines);
        else next.lines.push(payload.error ?? "terminal gateway error");
      } catch {
        next.lines.push("terminal gateway unreachable");
      }
      setBusy(false);
    }
    setState({ ...next });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const index = state.histIndex < 0 ? state.history.length - 1 : state.histIndex - 1;
      if (index >= 0) {
        setState({ ...state, histIndex: index });
        setValue(state.history[index] ?? "");
      }
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (state.histIndex < 0) return;
      const index = state.histIndex + 1;
      if (index >= state.history.length) {
        setState({ ...state, histIndex: -1 });
        setValue("");
      } else {
        setState({ ...state, histIndex: index });
        setValue(state.history[index] ?? "");
      }
    }
  }

  return (
    <div
      className="scanline glow-border overflow-hidden rounded-lg border border-neon/40 bg-black font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center justify-between border-b border-neon/20 px-3 py-2 text-xs text-neon">
        <span>hla-term · simulated · {challengeSlug ?? "sandbox"}</span>
        <span>{busy ? "sync" : "idle"}</span>
      </div>
      <div className="h-80 overflow-y-auto p-3 text-neon">
        {state.lines.map((line, index) => (
          <pre key={`${index}-${line.slice(0, 12)}`} className="whitespace-pre-wrap">
            {line}
          </pre>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-neon/20 px-3 py-2">
        <label className="sr-only" htmlFor="term-input">
          Terminal command
        </label>
        <span className="text-neon-dim">{state.user}@lab:{state.cwd}$</span>
        <input
          id="term-input"
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-neon outline-none"
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
        />
      </form>
    </div>
  );
}
