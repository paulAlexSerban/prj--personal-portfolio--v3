import { useEffect, useMemo, useState } from "react";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { CardRenderer } from "@/components/card/CardRenderer";
import { Stamp } from "@prj--personal-portfolio--v3/shared--ui";

export interface QuestionRendererProps {
  question: ExportedQuestion;
  revealed: boolean;
  onReveal: () => void;
  /** Reported once on reveal: true/false for auto-graded, null for self-graded. */
  onGraded?: (correct: boolean | null) => void;
  /** Offer a retry (un-reveal) — shown for wrong auto-graded answers. */
  onRetry?: () => void;
}

/**
 * Renders a single question, branching on `answerFormat`.
 * - free_text: stem → reveal explanation → self-grade
 * - multiple_choice / true_false: pick answer → submit (auto-grade) → reveal
 * - multiple_select: all-or-nothing auto-grade
 *
 * Mount with `key={question.slug}` so internal answer state resets per card.
 */
export function QuestionRenderer({
  question,
  revealed,
  onReveal,
  onGraded,
  onRetry,
}: QuestionRendererProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [tfChoice, setTfChoice] = useState<boolean | null>(null);

  const correctKeys = useMemo(
    () => new Set(question.options.filter((o) => o.isCorrect).map((o) => o.key)),
    [question.options],
  );

  const canSubmit = (() => {
    switch (question.answerFormat) {
      case "free_text":
        return true;
      case "multiple_choice":
        return selectedKey !== null;
      case "true_false":
        return tfChoice !== null;
      case "multiple_select":
        return selectedKeys.size > 0;
      default:
        return true;
    }
  })();

  const isCorrect = (() => {
    if (question.gradingMode !== "auto") return null;
    switch (question.answerFormat) {
      case "multiple_choice":
        return selectedKey !== null && correctKeys.has(selectedKey);
      case "true_false":
        return tfChoice !== null && tfChoice === question.answer;
      case "multiple_select": {
        if (selectedKeys.size !== correctKeys.size) return false;
        for (const k of selectedKeys) if (!correctKeys.has(k)) return false;
        return true;
      }
      default:
        return null;
    }
  })();

  // Report correctness once revealed — covers both button-submit and the
  // keyboard reveal path owned by StudySession.
  useEffect(() => {
    if (revealed) onGraded?.(isCorrect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  function toggleMulti(key: string) {
    if (revealed) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function retry() {
    setSelectedKey(null);
    setSelectedKeys(new Set());
    setTfChoice(null);
    onRetry?.();
  }

  const showRetry = revealed && onRetry && question.gradingMode === "auto" && isCorrect === false;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="smallcaps text-[10px] text-[var(--slate)] mb-2">
          {question.answerFormat.replace(/_/g, " ")} · {question.difficulty} ·{" "}
          {question.gradingMode === "auto" ? "auto-graded" : "self-graded"}
        </p>
        <CardRenderer
          html={question.stem}
          compiledHtml={question.stemHtml}
          reveal={revealed}
          dropcap
          className="text-2xl md:text-3xl leading-snug"
        />
      </div>

      {/* ── Answer controls ──────────────────────────────────────────── */}
      {question.answerFormat === "true_false" && (
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((val) => {
            const chosen = tfChoice === val;
            const showCorrect = revealed && question.answer === val;
            const showWrong = revealed && chosen && question.answer !== val;
            return (
              <button
                key={String(val)}
                type="button"
                disabled={revealed}
                onClick={() => setTfChoice(val)}
                className={optionClass(chosen, showCorrect, showWrong)}
              >
                {val ? "True" : "False"}
              </button>
            );
          })}
        </div>
      )}

      {(question.answerFormat === "multiple_choice" ||
        question.answerFormat === "multiple_select") && (
        <div className="flex flex-col gap-2">
          {question.answerFormat === "multiple_select" && !revealed && (
            <p className="smallcaps text-[10px] text-[var(--slate)]">Select all that apply</p>
          )}
          {question.options.map((opt) => {
            const chosen =
              question.answerFormat === "multiple_choice"
                ? selectedKey === opt.key
                : selectedKeys.has(opt.key);
            const showCorrect = revealed && opt.isCorrect;
            const showWrong = revealed && chosen && !opt.isCorrect;
            const result = optionResult(revealed, opt.isCorrect, chosen);
            return (
              <button
                key={opt.key}
                type="button"
                disabled={revealed}
                onClick={() =>
                  question.answerFormat === "multiple_choice"
                    ? setSelectedKey(opt.key)
                    : toggleMulti(opt.key)
                }
                className={`text-left flex items-center gap-2 ${optionClass(chosen, showCorrect, showWrong)}`}
              >
                <span className="smallcaps text-[10px] text-[var(--slate)]">{opt.key}</span>
                <span className="flex-1">
                  <CardRenderer html={opt.label} compiledHtml={opt.labelHtml} inline />
                </span>
                {result && (
                  <span className="smallcaps text-[9px] border border-current px-1 py-0.5 shrink-0">
                    {result}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Reveal / submit ──────────────────────────────────────────── */}
      {!revealed ? (
        <div className="text-center">
          <Stamp size="lg" disabled={!canSubmit} onClick={onReveal}>
            {question.answerFormat === "free_text" ? "Show Answer" : "Submit"}
          </Stamp>
          <p className="smallcaps text-[10px] text-[var(--slate)] mt-3">
            {question.answerFormat === "free_text"
              ? "Press Space"
              : canSubmit
                ? "Press Space to submit"
                : "Choose an answer"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {isCorrect !== null && (
            <div
              role="status"
              className={`border-2 p-3 text-center smallcaps text-base ${
                isCorrect
                  ? "border-[var(--ink-black)] bg-[var(--highlight)]"
                  : "border-[var(--ink-black)]"
              }`}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </div>
          )}
          {showRetry && (
            <div className="text-center">
              <Stamp variant="ghost" onClick={retry}>
                Try Again
              </Stamp>
            </div>
          )}
          {question.explanation && (
            <>
              <div className="rule" />
              <div
                className="inkbleed text-lg md:text-xl"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <CardRenderer
                  html={question.explanation}
                  compiledHtml={question.explanationHtml}
                  reveal
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Per-option result tag after reveal: got it / missed / wrong. */
function optionResult(
  revealed: boolean,
  isCorrect: boolean,
  chosen: boolean,
): "got it" | "missed" | "wrong" | null {
  if (!revealed) return null;
  if (isCorrect && chosen) return "got it";
  if (isCorrect && !chosen) return "missed";
  if (!isCorrect && chosen) return "wrong";
  return null;
}

function optionClass(chosen: boolean, showCorrect: boolean, showWrong: boolean): string {
  const base = "border-2 px-4 py-3 transition-colors";
  if (showCorrect) return `${base} border-[var(--ink-black)] bg-[var(--highlight)] font-bold`;
  if (showWrong) return `${base} border-[var(--ink-black)] line-through opacity-70`;
  if (chosen) return `${base} border-[var(--ink-black)] bg-[var(--highlight)]`;
  return `${base} border-[var(--column-rule)] hover:border-[var(--ink-black)]`;
}
