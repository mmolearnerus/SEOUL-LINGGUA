export interface VocabularyItem {
  word: string;
  partOfSpeech: string;
  ipa: string;
  englishDefinition: string;
  vietnameseDefinition: string;
  exampleSentence: string;
  exampleTranslation: string;
}

export interface AnalysisResult {
  titleEnglish: string;
  titleVietnamese: string;
  originalText: string;
  vietnameseTranslation: string;
  vocabulary: VocabularyItem[];
  isOfflineMode?: boolean;
  message?: string;
}

export interface SavedWord extends VocabularyItem {
  id: string;
  savedAt: string;
  notes?: string;
  isMemorized?: boolean;
}

export interface DemoTopic {
  titleEnglish: string;
  titleVietnamese: string;
  originalText: string;
  vietnameseTranslation: string;
  vocabulary: VocabularyItem[];
}
