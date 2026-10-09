import { ReactNode } from 'react';

export interface TableColumn<T> {
  field: Extract<keyof T, string>;
  headerName: string;
  width?: number;
  flex?: number;
  sortable?: boolean;
  renderCell?: (params: { row: T; value: unknown }) => ReactNode;
}
