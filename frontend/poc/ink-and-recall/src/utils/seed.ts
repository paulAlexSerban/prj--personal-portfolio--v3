import type { Card, Deck } from "../store/types";
import { DEFAULT_CONFIG } from "../store/types";
import { todayISO, uid } from "./dates";

const now = () => new Date().toISOString();

function makeDeck(name: string, description: string): Deck {
  return {
    id: uid(),
    name,
    description,
    createdAt: now(),
    updatedAt: now(),
    config: { ...DEFAULT_CONFIG },
  };
}

function makeCards(deckId: string, pairs: [string, string][]): Card[] {
  return pairs.map(([front, back], i) => {
    const type: Card["cardType"] = i < 6 ? "new" : i < 10 ? "learning" : "review";
    const interval = type === "review" ? Math.floor(Math.random() * 20) + 1 : 0;
    const dueOffset = type === "review" ? Math.floor(Math.random() * 6) - 3 : 0;
    return {
      id: uid(),
      deckId,
      front,
      back,
      tags: [],
      interval,
      repetitions: type === "review" ? Math.floor(Math.random() * 5) + 1 : 0,
      easeFactor: 2.5,
      dueDate: todayISO(dueOffset),
      lapses: 0,
      cardType: type,
      learningStep: 0,
      learningDueAt: type === "learning" ? Date.now() - 1000 : undefined,
      createdAt: now(),
      updatedAt: now(),
    };
  });
}

export function buildSeed(): { decks: Deck[]; cards: Card[] } {
  const lit = makeDeck("Classic Literature", "Quotes, authors & dates from the canon.");
  const cs = makeDeck("Computer Science Fundamentals", "Algorithms, data structures, complexity.");
  const hist = makeDeck("World History", "Dates and events that shaped civilizations.");

  const litCards = makeCards(lit.id, [
    ["Who wrote {{c1::Moby-Dick}}?", "Herman Melville (1851)"],
    ['"It was the best of times…" — opens which novel?', "A Tale of Two Cities — Dickens"],
    ["Author of <i>Pride and Prejudice</i>", "Jane Austen (1813)"],
    ["Who wrote <b>Crime and Punishment</b>?", "Fyodor Dostoevsky"],
    ["The Iliad was composed by", "Homer (8th c. BCE)"],
    ["Year of publication of <i>Ulysses</i>", "1922"],
    ["Author of <i>One Hundred Years of Solitude</i>", "Gabriel García Márquez"],
    ['"Call me Ishmael." — opens', "Moby-Dick"],
    ["Who wrote <i>The Brothers Karamazov</i>?", "Dostoevsky (1880)"],
    ["Author of <i>To the Lighthouse</i>", "Virginia Woolf"],
    ["<i>The Sound and the Fury</i> author", "William Faulkner"],
    ["Author of <i>Beloved</i>", "Toni Morrison (1987)"],
    ["Who wrote <i>Don Quixote</i>?", "Miguel de Cervantes (1605)"],
    ["<i>Madame Bovary</i> author", "Gustave Flaubert"],
    ["<i>Anna Karenina</i> author", "Leo Tolstoy"],
    ["<i>The Great Gatsby</i> published in", "1925"],
    ["Author of <i>Things Fall Apart</i>", "Chinua Achebe (1958)"],
    ["<i>Invisible Man</i> author", "Ralph Ellison"],
    ["<i>Mrs Dalloway</i> author", "Virginia Woolf (1925)"],
    ["Author of <i>The Trial</i>", "Franz Kafka"],
  ]);

  const csCards = makeCards(cs.id, [
    ["Time complexity of binary search", "O(log n)"],
    ["Worst-case time of quicksort", "O(n²)"],
    ["Average time of hash table lookup", "O(1)"],
    ["What does {{c1::DFS}} stand for?", "Depth-First Search"],
    ["Heap insertion time complexity", "O(log n)"],
    ["A stack is {{c1::LIFO}}", "Last In, First Out"],
    ["A queue is FIFO — meaning?", "First In, First Out"],
    ["Time complexity of merge sort", "O(n log n)"],
    ["Dijkstra's algorithm finds", "Shortest paths from a source"],
    ["Big-O of bubble sort", "O(n²)"],
    ["Hash collision resolution methods", "Chaining, open addressing"],
    ["A B-tree is used in", "Databases & filesystems"],
    ["What is a red-black tree?", "Self-balancing BST"],
    ["TCP vs UDP — TCP is", "Connection-oriented, reliable"],
    ["Definition of a pure function", "Same input → same output, no side effects"],
    ["What does ACID stand for?", "Atomicity, Consistency, Isolation, Durability"],
    ["Time of accessing array by index", "O(1)"],
    ["BFS uses which data structure?", "Queue"],
    ["DFS uses which data structure?", "Stack (or recursion)"],
    ["What is a deadlock?", "Two+ processes waiting on each other indefinitely"],
  ]);

  const histCards = makeCards(hist.id, [
    ["Year the Berlin Wall fell", "1989"],
    ["French Revolution began in", "1789"],
    ["WWI began in", "1914"],
    ["WWII ended in", "1945"],
    ["The Magna Carta was signed in", "1215"],
    ["Year of the Moon landing", "1969"],
    ["The Roman Empire (West) fell in", "476 CE"],
    ["The printing press was invented by", "Johannes Gutenberg (c. 1440)"],
    ["Columbus reached the Americas in", "1492"],
    ["U.S. Declaration of Independence", "1776"],
    ["The Russian Revolution occurred in", "1917"],
    ["The Battle of Hastings was in", "1066"],
    ["The Treaty of Versailles was signed in", "1919"],
    ["The Black Death peaked in Europe in", "1347–1351"],
    ["The Renaissance began in", "14th-century Italy"],
    ["The Meiji Restoration began in", "1868"],
    ["The Cuban Missile Crisis was in", "1962"],
    ["The Suez Canal opened in", "1869"],
    ["Apartheid in South Africa ended in", "1994"],
    ["The Industrial Revolution began in", "late 18th-century Britain"],
  ]);

  return { decks: [lit, cs, hist], cards: [...litCards, ...csCards, ...histCards] };
}
