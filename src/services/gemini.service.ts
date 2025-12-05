import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, LiveSentiment, Source } from '../types';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: The API key is sourced from environment variables.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async getLiveSentiment(asset: string): Promise<LiveSentiment> {
    const prompt = `As a financial market analyst, what is the current market sentiment for the asset ${asset} based on the latest web search results? Provide a brief, one-paragraph summary. Your response should be in Spanish.`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
      });

      const summary = response.text.trim();
      
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources: Source[] = groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter((web: any) => web?.uri && web?.title) ?? [];

      return { summary, sources };

    } catch (error) {
       console.error('Gemini Sentiment API error:', error);
       throw new Error('Failed to fetch real-time market sentiment.');
    }
  }

  async getTradeAnalysis(asset: string, timeframe: string): Promise<AnalysisResult> {
    
    // Step 1: Get live market sentiment from the web.
    const liveSentiment = await this.getLiveSentiment(asset);

    // Step 2: Use sentiment as context for technical analysis.
    const prompt = `
      You are an expert financial analyst.
      A user is viewing the chart for ${asset} on a ${timeframe} timeframe.
      The current market sentiment, based on real-time web data, is: "${liveSentiment.summary}".

      Considering this sentiment, perform a detailed technical analysis based on the known, recent price action for this asset.
      Identify key patterns, support/resistance levels, trendlines, and candlestick formations.
      Provide a trade recommendation (LONG, SHORT, or NEUTRAL), a confidence score, a summary, and key technical/sentiment factors.
      The 'sentiment' key factor should be your interpretation of how the provided sentiment impacts the technical outlook.
      
      **IMPORTANT**: Your response must be in JSON format. All descriptive text fields (summary, keyFactors.sentiment, keyFactors.technical) MUST be written in Spanish.
      Your analysis must be specific and relevant to the asset's recent, publicly known behavior. Do not give generic advice.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        recommendation: {
          type: Type.STRING,
          enum: ['LONG', 'SHORT', 'NEUTRAL'],
          description: 'The trade recommendation.',
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence level for the recommendation, from 0 to 100.',
        },
        summary: {
          type: Type.STRING,
          description: 'A brief explanation of the reasoning behind the recommendation, in Spanish.',
        },
        keyFactors: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              description: 'Analysis of market sentiment and its impact on technicals, in Spanish.',
            },
            technical: {
              type: Type.STRING,
              description: 'Analysis of technical indicators and chart patterns based on recent price action, in Spanish.',
            },
          },
          required: ['sentiment', 'technical'],
        },
      },
      required: ['recommendation', 'confidence', 'summary', 'keyFactors'],
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });

      const jsonString = response.text.trim();
      const technicalResult: Omit<AnalysisResult, 'liveSentiment'> = JSON.parse(jsonString);

      // Combine technical analysis with live sentiment data
      return {
        ...technicalResult,
        liveSentiment
      };

    } catch (error) {
      console.error('Gemini Technical Analysis API error:', error);
      let errorMessage = 'Failed to get analysis from AI.';
      if (error?.toString().includes('API key not valid')) {
        errorMessage = 'Authentication error: The provided API key is not valid.';
      } else if (error?.toString().includes('rate limit')) {
        errorMessage = 'API rate limit exceeded. Please wait and try again later.';
      }
      throw new Error(errorMessage);
    }
  }
}