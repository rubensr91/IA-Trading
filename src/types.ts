export interface Source {
  uri: string;
  title: string;
}

export interface LiveSentiment {
  summary: string;
  sources: Source[];
}

export interface AnalysisResult {
  recommendation: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  summary: string;
  keyFactors: {
    sentiment: string;
    technical: string;
  };
  liveSentiment?: LiveSentiment;
}

export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1D' | '1W';