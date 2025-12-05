import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { AnalysisResult } from '../../types';
import { inject } from '@angular/core';

@Component({
  selector: 'app-ai-analysis',
  templateUrl: './ai-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class AiAnalysisComponent {
  asset = input.required<string>();
  timeframe = input.required<string>();

  analysis = signal<AnalysisResult | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  private geminiService = inject(GeminiService);

  readonly recommendationTranslations: { [key in 'LONG' | 'SHORT' | 'NEUTRAL']: string } = {
    LONG: 'COMPRA (LARGO)',
    SHORT: 'VENTA (CORTO)',
    NEUTRAL: 'NEUTRAL',
  };
  
  readonly recommendationStyles = {
    LONG: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      iconPath: 'M12 6l6 6H6l6-6z',
    },
    SHORT: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      iconPath: 'M12 18l-6-6h12l-6 6z',
    },
    NEUTRAL: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      iconPath: 'M18 12H6',
    },
  };

  async getAnalysis() {
    this.isLoading.set(true);
    this.error.set(null);
    this.analysis.set(null);

    try {
      const result = await this.geminiService.getTradeAnalysis(this.asset(), this.timeframe());
      this.analysis.set(result);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      this.isLoading.set(false);
    }
  }

  getRecommendationClasses(reco: 'LONG' | 'SHORT' | 'NEUTRAL') {
    return this.recommendationStyles[reco];
  }
}