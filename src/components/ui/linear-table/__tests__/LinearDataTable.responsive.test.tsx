import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinearDataTable } from '../LinearDataTable';
import { LinearColumn } from '../types';

interface TestItem {
  id: string;
  codigo: string;
  cliente: string;
  total: number;
}

const mockColumns: LinearColumn<TestItem>[] = [
  { id: 'codigo', header: 'Código', accessorKey: 'codigo' },
  { id: 'cliente', header: 'Cliente', accessorKey: 'cliente' },
  { 
    id: 'total', 
    header: 'Total', 
    align: 'right', 
    render: (item) => `$${item.total.toLocaleString()}` 
  },
];

const mockData: TestItem[] = [
  { id: '1', codigo: 'ALQ-001', cliente: 'Constructora Bolívar', total: 1500000 },
  { id: '2', codigo: 'ALQ-002', cliente: 'Marval SA', total: 2800000 },
];

describe('LinearDataTable - TDD Responsive Liquid Cards', () => {
  it('aplica la clase "hidden md:table" en el elemento <table> para evitar desbordamiento horizontal en móviles', () => {
    const { container } = render(
      <LinearDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    const tableElement = container.querySelector('table');
    expect(tableElement).toBeInTheDocument();
    expect(tableElement?.className).toMatch(/hidden\s+md:table/);
  });

  it('renderiza un contenedor de tarjetas líquidas con clase "block md:hidden" (o "md:hidden")', () => {
    const { container } = render(
      <LinearDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    const mobileContainer = container.querySelector('[data-testid="linear-mobile-cards"]');
    expect(mobileContainer).toBeInTheDocument();
    expect(mobileContainer?.className).toMatch(/md:hidden/);
  });

  it('renderiza el contenido personalizado cuando se provee renderMobileCard', () => {
    const customRenderer = vi.fn((item: TestItem) => (
      <div data-testid={`custom-card-${item.id}`}>
        <span>Contrato: {item.codigo}</span>
        <span>Cliente VIP: {item.cliente}</span>
      </div>
    ));

    render(
      <LinearDataTable
        data={mockData}
        columns={mockColumns}
        renderMobileCard={customRenderer}
      />
    );

    expect(customRenderer).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('custom-card-1')).toHaveTextContent('Contrato: ALQ-001');
    expect(screen.getByTestId('custom-card-2')).toHaveTextContent('Cliente VIP: Marval SA');
  });

  it('renderiza una tarjeta fallback automática cuando no se suministra renderMobileCard', () => {
    render(
      <LinearDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    // Debe mostrar los datos tanto en la tabla desktop como en el fallback móvil
    const clientElements = screen.getAllByText('Constructora Bolívar');
    // Al menos 2 elementos: uno en la tabla md:table y otro en la tarjeta móvil md:hidden
    expect(clientElements.length).toBeGreaterThanOrEqual(2);
  });
});
