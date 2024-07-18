export interface Card {
  title: string;
  description: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface Config {
  repository: string;
  card: Card[];
  faq: Faq[];
}
