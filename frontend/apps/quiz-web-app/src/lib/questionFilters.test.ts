import { describe, it, expect } from "vitest";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/tools--quiz-export/contract";
import {
  filterBrowseQuestions,
  getCardStateLabel,
  type QuestionBrowseFilters,
} from "./questionFilters";
import type { CardState } from "@/store/types";
import { createCardState } from "@/store/types";

const baseQuestion = (overrides: Partial<ExportedQuestion> = {}): ExportedQuestion => ({
  slug: "post--q1",
  postSlug: "post",
  answerFormat: "multiple_choice",
  cognitiveStyle: "factual_recall",
  difficulty: "intermediate",
  gradingMode: "auto",
  stem: "What is Big O?",
  explanation: "Complexity measure",
  payload: null,
  options: [],
  answer: null,
  tags: ["algorithms", "complexity"],
  ...overrides,
});

describe("filterBrowseQuestions", () => {
  const questions = [
    baseQuestion(),
    baseQuestion({
      slug: "post--q2",
      stem: "React hooks",
      answerFormat: "free_text",
      difficulty: "advanced",
      tags: ["react"],
    }),
  ];

  const cardStates: Record<string, CardState> = {
    "post--q1": { ...createCardState("post--q1", "post"), cardType: "new" },
    "post--q2": {
      ...createCardState("post--q2", "post"),
      cardType: "review",
      dueDate: "2000-01-01",
    },
  };

  const emptyFilters: QuestionBrowseFilters = {
    query: "",
    format: "",
    difficulty: "",
    tag: "",
    state: "all",
  };

  it("filters by query across stem and tags", () => {
    const out = filterBrowseQuestions(
      questions,
      cardStates,
      {},
      {
        ...emptyFilters,
        query: "react",
      },
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.slug).toBe("post--q2");
  });

  it("filters by format and difficulty", () => {
    const out = filterBrowseQuestions(
      questions,
      cardStates,
      {},
      {
        ...emptyFilters,
        format: "free_text",
        difficulty: "advanced",
      },
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.slug).toBe("post--q2");
  });

  it("filters by tag and card state", () => {
    const out = filterBrowseQuestions(
      questions,
      cardStates,
      {},
      {
        ...emptyFilters,
        tag: "algorithms",
        state: "new",
      },
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.slug).toBe("post--q1");
  });

  it("filters ignored questions", () => {
    const out = filterBrowseQuestions(
      questions,
      cardStates,
      { "post--q1": true },
      { ...emptyFilters, state: "ignored" },
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.slug).toBe("post--q1");
  });
});

describe("getCardStateLabel", () => {
  it("returns ignored, due, and card type labels", () => {
    const card = createCardState("x", "p");
    expect(getCardStateLabel(card, true, "2020-01-01")).toBe("ignored");
    expect(
      getCardStateLabel(
        { ...card, cardType: "review", dueDate: "2000-01-01" },
        false,
        "2020-01-01",
      ),
    ).toBe("due");
    expect(getCardStateLabel({ ...card, cardType: "new" }, false)).toBe("new");
  });
});
