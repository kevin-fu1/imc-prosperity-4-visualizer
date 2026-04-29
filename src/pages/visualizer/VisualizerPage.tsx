import { Container, Grid, Group, Select, Title } from '@mantine/core';
import { ReactNode, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LazyMount } from '../../components/LazyMount.tsx';
import { useStore } from '../../store.ts';
import { formatNumber } from '../../utils/format.ts';
import { getProductGroup, getProductGroups } from '../../utils/product-groups.ts';
import { AlgorithmSummaryCard } from './AlgorithmSummaryCard.tsx';
import { CandlestickChart } from './CandlestickChart.tsx';
import { ConversionPriceChart } from './ConversionPriceChart.tsx';
import { EnvironmentChart } from './EnvironmentChart.tsx';
import { OrdersChart } from './OrdersChart.tsx';
import { PlainValueObservationChart } from './PlainValueObservationChart.tsx';
import { PositionChart } from './PositionChart.tsx';
import { ProfitLossChart } from './ProfitLossChart.tsx';
import { TimestampsCard } from './TimestampsCard.tsx';
import { TransportChart } from './TransportChart.tsx';
import { VisualizerCard } from './VisualizerCard.tsx';

export function VisualizerPage(): ReactNode {
  const algorithm = useStore(state => state.algorithm);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { search } = useLocation();

  if (algorithm === null) {
    return <Navigate to={`/${search}`} />;
  }

  const conversionProducts = new Set();
  for (const row of algorithm.data) {
    for (const product of Object.keys(row.state.observations.conversionObservations)) {
      conversionProducts.add(product);
    }
  }

  let profitLoss = 0;
  const lastTimestamp = algorithm.activityLogs[algorithm.activityLogs.length - 1].timestamp;
  for (let i = algorithm.activityLogs.length - 1; i >= 0 && algorithm.activityLogs[i].timestamp == lastTimestamp; i--) {
    profitLoss += algorithm.activityLogs[i].profitLoss;
  }

  const symbols = new Set<string>();
  const plainValueObservationSymbols = new Set<string>();

  for (let i = 0; i < algorithm.data.length; i += 1000) {
    const row = algorithm.data[i];

    for (const key of Object.keys(row.state.listings)) {
      symbols.add(key);
    }

    for (const key of Object.keys(row.state.observations.plainValueObservations)) {
      plainValueObservationSymbols.add(key);
    }
  }

  const sortedSymbols = [...symbols].sort((a, b) => a.localeCompare(b));
  const sortedPlainValueObservationSymbols = [...plainValueObservationSymbols].sort((a, b) => a.localeCompare(b));

  const allKnownProducts = [...new Set([...sortedSymbols, ...sortedPlainValueObservationSymbols])];
  const productGroups = getProductGroups(allKnownProducts);
  const effectiveGroup = selectedGroup ?? productGroups[0] ?? 'all';
  const isGroupVisible = (symbol: string): boolean =>
    effectiveGroup === 'all' || getProductGroup(symbol, allKnownProducts) === effectiveGroup;

  const visibleSymbols = sortedSymbols.filter(isGroupVisible);
  const visiblePlainValueObservationSymbols = sortedPlainValueObservationSymbols.filter(isGroupVisible);

  const chartMinHeight = 440;

  const symbolColumns: ReactNode[] = [];
  visibleSymbols.forEach(symbol => {
    symbolColumns.push(
      <Grid.Col key={`${symbol} - candlestick`} span={{ xs: 12, sm: 6 }}>
        <LazyMount minHeight={chartMinHeight}>
          <CandlestickChart symbol={symbol} />
        </LazyMount>
      </Grid.Col>,
    );

    symbolColumns.push(
      <Grid.Col key={`${symbol} - orders`} span={{ xs: 12, sm: 6 }}>
        <LazyMount minHeight={chartMinHeight}>
          <OrdersChart symbol={symbol} />
        </LazyMount>
      </Grid.Col>,
    );

    if (!conversionProducts.has(symbol)) {
      return;
    }

    symbolColumns.push(
      <Grid.Col key={`${symbol} - conversion price`} span={{ xs: 12, sm: 6 }}>
        <LazyMount minHeight={chartMinHeight}>
          <ConversionPriceChart symbol={symbol} />
        </LazyMount>
      </Grid.Col>,
    );

    symbolColumns.push(
      <Grid.Col key={`${symbol} - transport`} span={{ xs: 12, sm: 6 }}>
        <LazyMount minHeight={chartMinHeight}>
          <TransportChart symbol={symbol} />
        </LazyMount>
      </Grid.Col>,
    );

    symbolColumns.push(
      <Grid.Col key={`${symbol} - environment`} span={{ xs: 12, sm: 6 }}>
        <LazyMount minHeight={chartMinHeight}>
          <EnvironmentChart symbol={symbol} />
        </LazyMount>
      </Grid.Col>,
    );

    symbolColumns.push(<Grid.Col key={`${symbol} - environment-spacer`} span={{ xs: 12, sm: 6 }} />);
  });

  visiblePlainValueObservationSymbols.forEach(symbol => {
    symbolColumns.push(
      <Grid.Col key={`${symbol} - plain value observation`} span={{ xs: 12, sm: 6 }}>
        <LazyMount minHeight={chartMinHeight}>
          <PlainValueObservationChart symbol={symbol} />
        </LazyMount>
      </Grid.Col>,
    );
  });

  return (
    <Container fluid>
      <Grid>
        <Grid.Col span={12}>
          <VisualizerCard>
            <Group justify="space-between" align="center" wrap="wrap">
              <Title order={2}>Final Profit / Loss: {formatNumber(profitLoss)}</Title>
              <Select
                label="Product group"
                value={effectiveGroup}
                onChange={value => setSelectedGroup(value ?? 'all')}
                data={[
                  { value: 'all', label: 'All groups' },
                  ...productGroups.map(g => ({ value: g, label: g })),
                ]}
                style={{ width: 240 }}
              />
            </Group>
          </VisualizerCard>
        </Grid.Col>
        <Grid.Col span={{ xs: 12, sm: 6 }}>
          <LazyMount minHeight={chartMinHeight}>
            <ProfitLossChart symbols={visibleSymbols} />
          </LazyMount>
        </Grid.Col>
        <Grid.Col span={{ xs: 12, sm: 6 }}>
          <LazyMount minHeight={chartMinHeight}>
            <PositionChart symbols={visibleSymbols} />
          </LazyMount>
        </Grid.Col>
        {symbolColumns}
        <Grid.Col span={12}>
          <TimestampsCard />
        </Grid.Col>
        {algorithm.summary && (
          <Grid.Col span={12}>
            <AlgorithmSummaryCard />
          </Grid.Col>
        )}
      </Grid>
    </Container>
  );
}
