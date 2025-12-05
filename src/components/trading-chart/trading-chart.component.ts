import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  input,
  effect,
  AfterViewInit,
} from '@angular/core';
import { Timeframe } from '../../types';

// Declares the TradingView global variable to TypeScript
declare const TradingView: any;

@Component({
  selector: 'app-trading-chart',
  templateUrl: './trading-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class TradingChartComponent implements AfterViewInit {
  chartContainer = viewChild.required<ElementRef>('chartContainer');

  // Inputs to receive state from the parent component
  asset = input.required<string>();
  timeframe = input.required<Timeframe>();

  constructor() {
    // Effect to re-create the widget whenever the asset or timeframe changes.
    effect(() => {
      // Check if the view has been initialized before trying to create the widget
      if (this.chartContainer()?.nativeElement.id) {
        this.createWidget();
      }
    });
  }

  ngAfterViewInit(): void {
    // Initial widget creation
    this.createWidget();
  }

  private createWidget(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container || typeof TradingView === 'undefined') {
      return;
    }

    // Clear the container before creating a new widget to prevent duplicates
    container.innerHTML = '';

    new TradingView.widget({
      autosize: true,
      symbol: this.formatSymbol(this.asset()),
      interval: this.formatTimeframe(this.timeframe()),
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "es",
      toolbar_bg: "#1f2937", // Corresponds to gray-800
      enable_publishing: false,
      allow_symbol_change: false, // Symbol changes are controlled by our search input
      container_id: container.id,
      hide_side_toolbar: false,
    });
  }

  /**
   * Converts our app's timeframe format to TradingView's interval format.
   */
  private formatTimeframe(tf: Timeframe): string {
    switch (tf) {
      case '5m': return '5';
      case '15m': return '15';
      case '1h': return '60';
      case '4h': return '240';
      case '1D': return 'D';
      case '1W': return 'W';
      default: return 'D';
    }
  }

  /**
   * Converts asset tickers to a format that TradingView understands.
   * e.g., 'I:SPX' -> 'SP:SPX', 'BTC-USD' -> 'COINBASE:BTCUSD'
   */
  private formatSymbol(asset: string): string {
    const upperAsset = asset.toUpperCase();

    // Handle common indices
    if (upperAsset === 'SPX' || upperAsset === '^GSPC') {
      return 'SP:SPX';
    }

    if (upperAsset.startsWith('I:')) {
      return `SP:${upperAsset.substring(2)}`; // e.g., I:SPX -> SP:SPX
    }
    
    if (upperAsset.startsWith('X:')) {
      const cleanAsset = upperAsset.substring(2).replace('-', '');
      return `COINBASE:${cleanAsset}`; // e.g., X:BTC-USD -> COINBASE:BTCUSD
    }

    if (upperAsset.includes('-')) {
      return `COINBASE:${upperAsset.replace('-', '')}`;
    }

    const commonCryptoSuffixes = ['USDT', 'USD', 'BTC', 'ETH'];
    if (commonCryptoSuffixes.some(s => upperAsset.endsWith(s) && upperAsset.length > s.length)) {
      if (upperAsset.endsWith('USDT')) {
        return `BINANCE:${upperAsset}`;
      }
      return `COINBASE:${upperAsset}`;
    }
    
    // For stocks like 'NVDA', TradingView can often resolve them without a prefix.
    return upperAsset;
  }
}