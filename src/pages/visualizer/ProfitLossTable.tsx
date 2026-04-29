import { Table } from '@mantine/core';
import { ReactNode } from 'react';
import { useStore } from '../../store.ts';
import { getAskColor, getBidColor } from '../../utils/colors.ts';
import { formatNumber } from '../../utils/format.ts';
import { SimpleTable } from './SimpleTable.tsx';

export interface ProfitLossTableProps {
  timestamp: number;
  products?: string[];
}

export function ProfitLossTable({ timestamp, products }: ProfitLossTableProps): ReactNode {
  const algorithm = useStore(state => state.algorithm)!;

  const productSet = products ? new Set(products) : null;
  const rows: ReactNode[] = algorithm.activityLogs
    .filter(row => row.timestamp === timestamp && (!productSet || productSet.has(row.product)))
    .sort((a, b) => a.product.localeCompare(b.product))
    .map(row => {
      let colorFunc: (alpha: number) => string = () => 'transparent';
      if (row.profitLoss > 0) {
        colorFunc = getBidColor;
      } else if (row.profitLoss < 0) {
        colorFunc = getAskColor;
      }

      return (
        <Table.Tr key={row.product} style={{ backgroundColor: colorFunc(0.1) }}>
          <Table.Td>{row.product}</Table.Td>
          <Table.Td>{formatNumber(row.profitLoss)}</Table.Td>
        </Table.Tr>
      );
    });

  return <SimpleTable label="profit / loss" columns={['Product', 'Profit / Loss']} rows={rows} />;
}
