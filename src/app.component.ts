import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TradingChartComponent } from './components/trading-chart/trading-chart.component';
import { AiAnalysisComponent } from './components/ai-analysis/ai-analysis.component';
import { Timeframe } from './types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TradingChartComponent, AiAnalysisComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // State Signals
  readonly timeframes: Timeframe[] = ['5m', '15m', '1h', '4h', '1D', '1W'];
  selectedTimeframe = signal<Timeframe>('1D');
  
  searchTerm = signal('BTC-USD');
  selectedAsset = signal('BTC-USD');

  readonly popularAssets = ['BTC-USD', 'ETH-USD', 'NVDA', 'AAPL', 'SPX'];

  searchAsset(): void {
    const term = this.searchTerm().trim();
    if (term) {
      this.selectedAsset.set(term);
    }
  }

  selectTimeframe(tf: Timeframe): void {
    this.selectedTimeframe.set(tf);
  }

  selectPopularAsset(asset: string): void {
    this.searchTerm.set(asset);
    this.searchAsset();
  }
}