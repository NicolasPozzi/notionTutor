import type { GenerateQuestionsInput, GenerateQuestionsResult, QuestionGenerator } from "./types";

const MOCK_QUESTIONS = [
  {
    question: "Quel est le concept principal abordé dans cette page ?",
    answerExcerpt: "Le concept principal est présenté dans l'introduction.",
  },
  {
    question: "Quels sont les avantages mentionnés ?",
    answerExcerpt: "Les avantages incluent une meilleure compréhension.",
  },
  {
    question: "Comment ce concept s'applique-t-il en pratique ?",
    answerExcerpt: "En pratique, il s'applique par des exercices réguliers.",
  },
  {
    question: "Quelle est la différence avec l'approche traditionnelle ?",
    answerExcerpt: "La différence réside dans la méthode d'apprentissage active.",
  },
  {
    question: "Quels sont les prérequis nécessaires ?",
    answerExcerpt: "Les prérequis sont une connaissance de base du sujet.",
  },
];

export class MockQuestionGenerator implements QuestionGenerator {
  async generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsResult> {
    // Simulate realistic API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const questions = MOCK_QUESTIONS.slice(0, input.count);

    return {
      questions,
      model: "mock",
      durationMs: 500,
    };
  }
}
