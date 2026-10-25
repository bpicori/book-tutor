import type { ChapterPreview } from "../types";

/**
 * Pre-written guide responses for the sample book.
 *
 * They are not generated at request time and never touch the network: the
 * point is that a visitor can open the app, load the sample, and see what the
 * guide does before deciding to configure a model. Every entry was written
 * against the actual chapter text and stays inside that chapter, exactly like
 * a live preview would.
 */

interface DemoChapter {
  /** Lowercase fragments used to match the table-of-contents label. */
  keywords: string[];
  preview: Omit<
    ChapterPreview,
    "chapterHref" | "chapterLabel" | "generatedAt"
  > & {
    fullSummary: string;
  };
  answers: Array<{ match: RegExp; answer: string }>;
}

const CHAPTERS: DemoChapter[] = [
  {
    keywords: ["introduction"],
    preview: {
      fullSummary:
        "After dinner, the Time Traveller argues that time is a fourth dimension and that our bodies simply move along it. He begins with mathematics rather than with a machine, conceding each small point until the room has agreed to something it never expected to. Filby resists, the Psychologist follows, and the chapter ends with the promise of a demonstration.",
      themes: [
        "Time as a fourth dimension, not a mystery",
        "Why common sense resists new geometry",
        "Agreement won step by step rather than argued at once",
        "The room as a study in how people assent",
      ],
      keyConcepts: [
        "A mathematical line has no real existence — abstractions are useful, not real",
        "Solid bodies extend in duration as well as in space",
        "Consciousness moves along time in one direction, which is why we mistake it for separate",
      ],
      toneAndStyle:
        "A drawing-room argument reported after the fact: witty, patient and relentless. Wells lets the narrator describe the room — the fire, the candles, the patent chairs — so the metaphysics arrives inside a comfortable evening.",
      characters: [
        "The Time Traveller — animated, enjoying his own argument",
        "Filby — red-haired, argumentative, the voice of common sense",
        "The Psychologist — quick to concede, quick to be convinced",
        "The Medical Man, the Provincial Mayor, the Very Young Man — a spectrum of attention",
      ],
      definitions: [
        {
          term: "recondite",
          definition:
            "Difficult and obscure; understood only by a few. The narrator uses it to signal that the subject is out of the ordinary before a word of it is explained.",
        },
        {
          term: "fecundity",
          definition:
            "Productiveness; here, the abundance of ideas a person generates. The Time Traveller's fecundity is what the guests admire before they believe him.",
        },
        {
          term: "controvert",
          definition:
            "To argue against; to deny or oppose something in argument.",
        },
        {
          term: "abstraction",
          definition:
            "An idea separated from any particular thing. The Time Traveller's first move is to show that lines and planes are abstractions, then to ask why time should be treated as more real than they are.",
        },
        {
          term: "spasmodic",
          definition:
            "Happening in sudden, irregular bursts. The Very Young Man makes spasmodic efforts with his cigar — Wells's way of showing someone trying to look intelligent.",
        },
      ],
      guidingQuestions: [
        "Why does the Time Traveller begin with geometry instead of with a machine?",
        "What does Filby's resistance tell us about how new ideas are received?",
        "Where does the argument stop being a thought experiment and become a pitch?",
      ],
    },
    answers: [
      {
        match: /geometry|fourth dimension|begin with/i,
        answer:
          "Because the machine is only credible if the fourth dimension is. If time is a dimension like length or breadth, then moving along it is a problem of engineering rather than of magic.\n\nHe starts from the weakest-looking claim — that a mathematical line has no real existence — so that each step is one his guests have already conceded. By the time he says there are really four dimensions, the room has run out of objections, and the machine can arrive as a consequence instead of a miracle.",
      },
      {
        match: /filby|resistance|sceptic|skeptic/i,
        answer:
          "Filby is not stupid — he is invested. He argues in the idiom of common sense, defending solids and cubes as the obviously real things.\n\nWells uses him to show that resistance to a new idea is rarely about evidence; it is about the cost of rearranging what you already believe. Notice that the others are quieter: the Psychologist concedes quickly, the Provincial Mayor nods without following, and the Very Young Man is polite and lost. The dinner table is a taxonomy of assent.",
      },
      {
        match: /pitch|persuad|convinc/i,
        answer:
          'Around the moment he explains that we overlook duration through "a natural infirmity of the flesh". Up to then he has been doing geometry; after that he is explaining why his audience cannot see what he sees — which is the move of every visionary and every salesperson.\n\nThe rest of the chapter converts a conceded argument into an appointment to demonstrate. He is not asking to be believed on the evening of the argument; he is asking for a second evening.',
      },
    ],
  },
  {
    keywords: ["the machine"],
    preview: {
      fullSummary:
        "The following week the Time Traveller produces a miniature machine and asks the room to watch closely. After a long pause he has the Psychologist press the lever, and the model turns, blurs and vanishes. The chapter is a proof by staging: witnesses, positions, candles, and no way to account for what everyone saw.",
      themes: [
        "Proof by demonstration rather than argument",
        "Doubt that survives evidence",
        "The model as the argument made physical",
      ],
      keyConcepts: [
        "A working miniature is harder to dismiss than a theory",
        "The narrator inventories the room so no trick can hide in it",
        "The second lever reverses the motion — the experiment is repeatable in principle",
      ],
      toneAndStyle:
        "A conjuring scene written by someone determined to remove every escape route. Careful staging, a pause, one small movement, then a detail — the blown-out candle — that makes the room feel colder.",
      characters: [
        "The Time Traveller — patient, staging his own proof",
        "The Psychologist — made to press the lever, so the doubt lands on his hand",
        "Filby — profane, finally out of arguments",
        "The Medical Man — examines the machine as an object, not an idea",
      ],
      definitions: [
        {
          term: "askew",
          definition:
            'Not straight; at an angle. The model "looks singularly askew", which is exactly the wrongness you would expect from something slightly outside ordinary time.',
        },
        {
          term: "quack",
          definition:
            "A person who pretends to have skills or knowledge they do not have. He asks the room to check for trickery first, so he cannot be called one afterwards.",
        },
        {
          term: "stupor",
          definition:
            "A state of near-unconsciousness or dazed astonishment. The Psychologist recovers from his and immediately looks under the table.",
        },
        {
          term: "interminable",
          definition:
            'Endless; seemingly without limit. The model leaves on an "interminable voyage" — the joke is that the voyage has no end to run out of.',
        },
      ],
      guidingQuestions: [
        "Why does the Time Traveller make the Psychologist press the lever?",
        "Which details does the narrator give to rule out a trick, and why those?",
        "What would it take to convince you that the model disappeared?",
      ],
    },
    answers: [
      {
        match: /psychologist press|his hand|press the lever/i,
        answer:
          "To remove himself as the explanation. If the host presses the lever, guests can still suspect a trick; if one of them does it, the doubt lands on their own hand.\n\nWells is careful about witnesses — who sat where, which candle blew out, how bright the light was — because the chapter is staging a proof and every detail closes an exit. The demonstration works as theatre: everyone saw it, nobody can say how.",
      },
      {
        match: /details|trick|convince you/i,
        answer:
          "The list is deliberate: the table's legs on the hearthrug, a dozen candles, the lamp, the positions of five witnesses, the two years of work.\n\nEach detail rules out a specific account — bad light, a hidden mechanism, a confederate. Then Wells removes the last exit by having the Psychologist's own finger do the work. What is left is not proof but an absence of explanation, which is exactly what the narrator reports.",
      },
    ],
  },
  {
    keywords: ["returns"],
    preview: {
      fullSummary:
        "A week later the narrator arrives late to dinner to find the host missing. The Time Traveller appears in the doorway ruined — dusty, cut, limping, greyer — drinks a glass of champagne, asks for meat, and still says nothing about where he has been. The chapter ends before the story begins.",
      themes: [
        "Reputation as an obstacle to belief",
        "The body as evidence",
        "Withholding as technique",
      ],
      keyConcepts: [
        "A man too clever to be believed is distrusted before he speaks",
        "Physical damage is more persuasive than testimony",
        "The delay before explanation is the chapter's real engine",
      ],
      toneAndStyle:
        "Polite horror in a lit dining room. The energy comes from what nobody says: the guests eat, speculate and joke while the evidence stands in the doorway.",
      characters: [
        "The narrator — guest, observer, the reader's proxy",
        "The Time Traveller — haggard, footsore, wordless",
        "The Medical Man — reads the body clinically",
        "The Editor — speaks for the room's appetite for a story",
      ],
      definitions: [
        {
          term: "deportment",
          definition:
            "The way a person carries and conducts themselves. The serious people never felt sure of his deportment — his manner undercuts his argument.",
        },
        {
          term: "anachronism",
          definition:
            'Something placed in the wrong period of time. The narrator wonders about the "curious possibilities of anachronism" a working time machine would create.',
        },
        {
          term: "haggard",
          definition:
            "Looking exhausted and unwell, especially from worry or suffering. It is the first word the narrator reaches for when the Time Traveller appears.",
        },
        {
          term: "footsore",
          definition:
            "Having sore feet from walking. He limps like a footsore tramp — an odd, physical detail for a man who has not been walking anywhere on this earth.",
        },
      ],
      guidingQuestions: [
        "Why do the guests doubt him before he says a word?",
        "What does the chapter gain by delaying his explanation?",
        "How does Wells make the return feel physical?",
      ],
    },
    answers: [
      {
        match: /doubt|before he says/i,
        answer:
          "Because of his character, not his claim. The narrator says it plainly: he was too clever to be believed. A man who does things too easily leaves no room for other people's judgement, and his guests protect their own reputations by withholding belief.\n\nWells makes the social obstacle the real subject of the chapter. The machine has already been demonstrated, and it makes no difference at all.",
      },
      {
        match: /delay|withhold|explanation/i,
        answer:
          "Everything the chapter has. The guests eat without him, speculate and laugh; then he arrives ruined — dusty, cut, limping, greyer — and still says nothing until he has had champagne and meat.\n\nThe delay forces you to read his body as evidence before you hear any story. It is the same technique the book uses throughout: give the reader the phenomenon first and the explanation later.",
      },
    ],
  },
];

const FALLBACK_ANSWER =
  "This sample book ships with a handful of hand-written answers, so I will not invent one here.\n\nTry one of the questions under **Questions to hold** in the Preview tab — they all have answers. Or connect a model in Settings (there are free options) and ask anything, about this book or any EPUB you own. Answers stay scoped to the chapter you are reading, so they cannot spoil what comes next.";

const FALLBACK_DEFINITION =
  "The sample defines a few words from the first three chapters. Connect a model in Settings to define any word, in any book.";

function normalize(label: string): string {
  return label
    .toLowerCase()
    .replace(/^[ivxlcdm]+[.)]\s*/, "")
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findChapter(label: string): DemoChapter | null {
  const normalized = normalize(label);
  return (
    CHAPTERS.find((chapter) =>
      chapter.keywords.some((keyword) => normalized.includes(keyword))
    ) ?? null
  );
}

/** True when the sample can guide this chapter. */
export function hasDemoPreview(label: string): boolean {
  return findChapter(label) !== null;
}

/** Preview for a sample-book chapter, or null when it is not one of the three. */
export function getDemoPreview(
  label: string,
  chapterHref: string
): ChapterPreview | null {
  const chapter = findChapter(label);
  if (!chapter) return null;

  return {
    ...chapter.preview,
    chapterHref,
    chapterLabel: label,
    generatedAt: Date.now(),
    chunkingApplied: false,
  };
}

/** Answer for a sample-book question. Always returns something readable. */
export function getDemoAnswer(question: string, label: string): string {
  const chapter = findChapter(label);
  const normalized = question.toLowerCase();

  if (chapter) {
    if (
      /\b(summar|recap|what happens|what is this chapter about|about this chapter)\b/.test(
        normalized
      )
    ) {
      return chapter.preview.fullSummary;
    }
    if (/\btheme|motif|about\b/.test(normalized)) {
      return `Themes in this chapter:\n\n${chapter.preview.themes
        .map((theme) => `- ${theme}`)
        .join("\n")}`;
    }
    if (/\bwho\b|character|characters/i.test(normalized)) {
      return `People to watch in this chapter:\n\n${(
        chapter.preview.characters ?? []
      )
        .map((character) => `- ${character}`)
        .join("\n")}`;
    }

    const matched = chapter.answers.find((entry) => entry.match.test(question));
    if (matched) return matched.answer;
  }

  return FALLBACK_ANSWER;
}

/** Definition for a word the sample covers, or null. */
export function getDemoDefinition(word: string): string | null {
  const lookup = word.trim().toLowerCase();
  if (!lookup) return null;

  for (const chapter of CHAPTERS) {
    const match = chapter.preview.definitions?.find(
      (entry) => entry.term.toLowerCase() === lookup
    );
    if (match) return match.definition;
  }

  return null;
}

/** Shown when a word is not in the sample's small glossary. */
export const DEMO_DEFINITION_FALLBACK = FALLBACK_DEFINITION;

/** Suggested prompts for the Ask tab while the sample is open. */
export const DEMO_QUESTIONS = [
  "What happens in this chapter?",
  "What themes should I watch for?",
  "Who are the characters in this chapter?",
];
