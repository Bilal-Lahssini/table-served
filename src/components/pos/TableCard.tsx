import { Table } from '@/types/pos';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TableCardProps {
  table: Table;
  onClick: (table: Table) => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'bg-success text-success-foreground';
      case 'occupied':
        return 'bg-warning text-warning-foreground';
      case 'reserved':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return '✓';
      case 'occupied':
        return '🍽️';
      case 'reserved':
        return '📅';
      default:
        return '';
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-2",
        table.status === 'available' && "hover:border-success",
        table.status === 'occupied' && "border-warning"
      )}
      onClick={() => onClick(table)}
    >
      <CardContent className="p-6 text-center">
        <div className="text-4xl mb-2">🪑</div>
        <h3 className="font-semibold text-lg mb-2">{table.name}</h3>
        <Badge className={getStatusColor(table.status)}>
          <span className="mr-1">{getStatusIcon(table.status)}</span>
          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        </Badge>
        {table.currentOrder && (
          <div className="mt-3 text-sm text-muted-foreground">
            <div>{table.currentOrder.items.length} items</div>
            <div className="font-medium">${table.currentOrder.total.toFixed(2)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}