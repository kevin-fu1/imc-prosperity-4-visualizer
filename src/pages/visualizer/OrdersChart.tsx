import Highcharts from 'highcharts';
import { SegmentedControl } from '@mantine/core';
import { ReactNode, useState } from 'react';
import { ProsperitySymbol } from '../../models.ts';
import { useStore } from '../../store.ts';
import { getAskColor, getBidColor } from '../../utils/colors.ts';
import { Chart } from './Chart.tsx';

export interface OrdersChartProps {
  symbol: ProsperitySymbol;
}

export function OrdersChart({ symbol }: OrdersChartProps): ReactNode {
  const algorithm = useStore(state => state.algorithm)!;
  const [priceMode, setPriceMode] = useState<'mid' | 'bidask'>('mid');

  const midPriceData: [number, number][] = [];
  const bid1Data: [number, number][] = [];
  const bid2Data: [number, number][] = [];
  const bid3Data: [number, number][] = [];
  const ask1Data: [number, number][] = [];
  const ask2Data: [number, number][] = [];
  const ask3Data: [number, number][] = [];

  for (const row of algorithm.activityLogs) {
    if (row.product !== symbol) continue;

    midPriceData.push([row.timestamp, row.midPrice]);

    if (row.bidPrices.length >= 1) bid1Data.push([row.timestamp, row.bidPrices[0]]);
    if (row.bidPrices.length >= 2) bid2Data.push([row.timestamp, row.bidPrices[1]]);
    if (row.bidPrices.length >= 3) bid3Data.push([row.timestamp, row.bidPrices[2]]);
    if (row.askPrices.length >= 1) ask1Data.push([row.timestamp, row.askPrices[0]]);
    if (row.askPrices.length >= 2) ask2Data.push([row.timestamp, row.askPrices[1]]);
    if (row.askPrices.length >= 3) ask3Data.push([row.timestamp, row.askPrices[2]]);
  }

  const filledBuyData: Highcharts.PointOptionsObject[] = [];
  const unfilledBuyData: Highcharts.PointOptionsObject[] = [];
  const filledSellData: Highcharts.PointOptionsObject[] = [];
  const unfilledSellData: Highcharts.PointOptionsObject[] = [];

  // Orders placed at timestamp T appear in ownTrades at timestamp T+100 (next row),
  // with trade.timestamp == T. Check fills per-row using the immediately next row's
  // ownTrades to avoid cross-day timestamp collisions in multi-day rounds.
  for (let i = 0; i < algorithm.data.length; i++) {
    const row = algorithm.data[i];
    const orders = row.orders[symbol];
    if (!orders) continue;

    const nextOwnTrades = algorithm.data[i + 1]?.state.ownTrades[symbol] ?? [];
    const filledBuyPrices = new Set<number>();
    const filledSellPrices = new Set<number>();

    for (const trade of nextOwnTrades) {
      if (trade.timestamp !== row.state.timestamp) continue;
      if (trade.buyer === 'SUBMISSION') filledBuyPrices.add(trade.price);
      if (trade.seller === 'SUBMISSION') filledSellPrices.add(trade.price);
    }

    for (const order of orders) {
      const point: Highcharts.PointOptionsObject = {
        x: row.state.timestamp,
        y: order.price,
        custom: { quantity: Math.abs(order.quantity) },
      };

      if (order.quantity > 0) {
        (filledBuyPrices.has(order.price) ? filledBuyData : unfilledBuyData).push(point);
      } else if (order.quantity < 0) {
        (filledSellPrices.has(order.price) ? filledSellData : unfilledSellData).push(point);
      }
    }
  }

  const buyTooltip: Highcharts.SeriesTooltipOptionsObject = {
    pointFormatter(this: Highcharts.Point) {
      const qty = (this as any).custom?.quantity;
      return `<span style="color:${this.color}">▲</span> Buy: <b>${this.y}</b> (qty: ${qty})<br/>`;
    },
  };

  const sellTooltip: Highcharts.SeriesTooltipOptionsObject = {
    pointFormatter(this: Highcharts.Point) {
      const qty = (this as any).custom?.quantity;
      return `<span style="color:${this.color}">▼</span> Sell: <b>${this.y}</b> (qty: ${qty})<br/>`;
    },
  };

  const priceSeries: Highcharts.SeriesOptionsType[] =
    priceMode === 'mid'
      ? [
          {
            type: 'line',
            name: 'Mid price',
            color: 'gray',
            dashStyle: 'Dash',
            data: midPriceData,
            marker: { enabled: false },
            enableMouseTracking: false,
          },
        ]
      : [
          {
            type: 'line',
            name: 'Bid 3',
            color: getBidColor(0.5),
            data: bid3Data,
            marker: { enabled: false },
            enableMouseTracking: false,
          },
          {
            type: 'line',
            name: 'Bid 2',
            color: getBidColor(0.75),
            data: bid2Data,
            marker: { enabled: false },
            enableMouseTracking: false,
          },
          {
            type: 'line',
            name: 'Bid 1',
            color: getBidColor(1.0),
            data: bid1Data,
            marker: { enabled: false },
            enableMouseTracking: false,
          },
          {
            type: 'line',
            name: 'Ask 1',
            color: getAskColor(1.0),
            data: ask1Data,
            marker: { enabled: false },
            enableMouseTracking: false,
          },
          {
            type: 'line',
            name: 'Ask 2',
            color: getAskColor(0.75),
            data: ask2Data,
            marker: { enabled: false },
            enableMouseTracking: false,
          },
          {
            type: 'line',
            name: 'Ask 3',
            color: getAskColor(0.5),
            data: ask3Data,
            marker: { enabled: false },
            enableMouseTracking: false,
          },
        ];

  const series: Highcharts.SeriesOptionsType[] = [
    ...priceSeries,
    {
      type: 'scatter',
      name: 'Buy (filled)',
      color: getBidColor(1.0),
      data: filledBuyData,
      marker: { symbol: 'triangle', radius: 6 },
      tooltip: buyTooltip,
    },
    {
      type: 'scatter',
      name: 'Buy (unfilled)',
      color: getBidColor(0.3),
      data: unfilledBuyData,
      marker: { symbol: 'triangle', radius: 4 },
      tooltip: buyTooltip,
    },
    {
      type: 'scatter',
      name: 'Sell (filled)',
      color: getAskColor(1.0),
      data: filledSellData,
      marker: { symbol: 'triangle-down', radius: 6 },
      tooltip: sellTooltip,
    },
    {
      type: 'scatter',
      name: 'Sell (unfilled)',
      color: getAskColor(0.3),
      data: unfilledSellData,
      marker: { symbol: 'triangle-down', radius: 4 },
      tooltip: sellTooltip,
    },
  ];

  const controls = (
    <SegmentedControl
      size="xs"
      value={priceMode}
      onChange={value => setPriceMode(value as 'mid' | 'bidask')}
      data={[
        { label: 'Mid Price', value: 'mid' },
        { label: 'Bid/Ask', value: 'bidask' },
      ]}
    />
  );

  return <Chart title={`${symbol} - Order Book`} series={series} controls={controls} />;
}
