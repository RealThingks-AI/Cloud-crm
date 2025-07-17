import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import DealsColumnCustomizer, { type DealColumn } from './DealsColumnCustomizer';
import type { Deal } from '@/hooks/useDeals';
import { isFieldVisibleForDeal } from '@/hooks/useDeals';
import { useStageBasedVisibility } from '@/hooks/useStageBasedVisibility';

interface DealsListViewProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
  selectedDealIds?: string[];
  onDealSelection?: (dealId: string, selected: boolean) => void;
}

const DEFAULT_COLUMNS: DealColumn[] = [
  // Basic fields - core deal information
  { key: 'deal_name', label: 'Deal Title', required: true, visible: true },
  { key: 'stage', label: 'Stage', required: false, visible: true },
  { key: 'amount', label: 'Value', required: false, visible: true },
  { key: 'probability', label: 'Probability', required: false, visible: true },
  { key: 'modified_at', label: 'Last Updated', required: false, visible: true },
  
  // Lead-related fields - visible by default when available
  { key: 'company_name', label: 'Company Name', required: false, visible: true },
  { key: 'lead_name', label: 'Lead Name', required: false, visible: true },
  { key: 'lead_owner', label: 'Lead Owner', required: false, visible: true },
  { key: 'phone_no', label: 'Phone', required: false, visible: false },
  
  // Secondary fields - available but hidden by default
  { key: 'closing_date', label: 'Close Date', required: false, visible: false },
  { key: 'currency', label: 'Currency', required: false, visible: false },
  { key: 'description', label: 'Description', required: false, visible: false },
  
  // Stage-specific fields - shown only when deals have data in these fields
  { key: 'customer_need_identified', label: 'Customer Need Identified', required: false, visible: false },
  { key: 'need_summary', label: 'Need Summary', required: false, visible: false },
  { key: 'decision_maker_present', label: 'Decision Maker Present', required: false, visible: false },
  { key: 'customer_agreed_on_need', label: 'Customer Agreed on Need', required: false, visible: false },
  
  // Qualified stage fields
  { key: 'nda_signed', label: 'NDA Signed', required: false, visible: false },
  { key: 'budget_confirmed', label: 'Budget Confirmed', required: false, visible: false },
  { key: 'supplier_portal_access', label: 'Supplier Portal Access', required: false, visible: false },
  { key: 'supplier_portal_required', label: 'Supplier Portal Required', required: false, visible: false },
  { key: 'expected_deal_timeline_start', label: 'Timeline Start', required: false, visible: false },
  { key: 'expected_deal_timeline_end', label: 'Timeline End', required: false, visible: false },
  { key: 'budget_holder', label: 'Budget Holder', required: false, visible: false },
  { key: 'decision_makers', label: 'Decision Makers', required: false, visible: false },
  { key: 'timeline', label: 'Timeline Notes', required: false, visible: false },
  
  // RFQ stage fields
  { key: 'rfq_value', label: 'RFQ Value', required: false, visible: false },
  { key: 'rfq_document_url', label: 'RFQ Document URL', required: false, visible: false },
  { key: 'product_service_scope', label: 'Product/Service Scope', required: false, visible: false },
  { key: 'rfq_confirmation_note', label: 'RFQ Confirmation Note', required: false, visible: false },
  
  // Offered stage fields
  { key: 'proposal_sent_date', label: 'Proposal Sent Date', required: false, visible: false },
  { key: 'negotiation_status', label: 'Negotiation Status', required: false, visible: false },
  { key: 'decision_expected_date', label: 'Decision Expected Date', required: false, visible: false },
  { key: 'negotiation_notes', label: 'Negotiation Notes', required: false, visible: false },
  
  // Final stage fields
  { key: 'win_reason', label: 'Win Reason', required: false, visible: false },
  { key: 'loss_reason', label: 'Loss Reason', required: false, visible: false },
  { key: 'drop_reason', label: 'Drop Reason', required: false, visible: false },
  
  // Execution fields
  { key: 'execution_started', label: 'Execution Started', required: false, visible: false },
  { key: 'begin_execution_date', label: 'Begin Execution Date', required: false, visible: false },
  
  // General fields
  { key: 'internal_notes', label: 'Internal Notes', required: false, visible: false },
  { key: 'related_lead_id', label: 'Related Lead ID', required: false, visible: false },
  { key: 'related_meeting_id', label: 'Related Meeting ID', required: false, visible: false },
  { key: 'created_at', label: 'Created At', required: false, visible: false },
  { key: 'created_by', label: 'Created By', required: false, visible: false },
  { key: 'modified_by', label: 'Modified By', required: false, visible: false },
];

const DealsListView = ({ deals, onEdit, onDelete, selectedDealIds = [], onDealSelection }: DealsListViewProps) => {
  const [columns, setColumns] = useState<DealColumn[]>(DEFAULT_COLUMNS);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null
  });

  const visibleColumns = useMemo(() => {
    const baseVisibleColumns = columns.filter(col => col.visible);
    
    // Show a column if any deal has data in that field or if it's a basic field
    const filteredColumns = baseVisibleColumns.filter(col => 
      deals.some(deal => {
        // Core fields are always visible when enabled
        const isCoreField = ['deal_name', 'stage', 'amount', 'probability', 'modified_at', 'created_at', 'internal_notes', 'created_by', 'modified_by', 'related_lead_id', 'related_meeting_id', 'company_name', 'lead_name', 'lead_owner', 'phone_no'].includes(col.key);
        
        if (isCoreField) return true;
        
        // Show field if the deal has data in this field (not null/undefined/empty)
        const fieldValue = deal[col.key as keyof Deal];
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      })
    );
    
    return filteredColumns;
  }, [columns, deals]);

  const sortedDeals = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return deals;

    return [...deals].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Deal];
      const bValue = b[sortConfig.key as keyof Deal];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [deals, sortConfig]);

  const handleSort = (columnKey: string) => {
    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const formatCellValue = (deal: Deal, columnKey: string) => {
    const value = deal[columnKey as keyof Deal];

    switch (columnKey) {
      case 'stage':
        return (
          <Badge variant="outline" className="text-xs">
            {value as string}
          </Badge>
        );
      case 'probability':
        return value ? `${value}%` : '0%';
      case 'amount':
      case 'rfq_value':
        return value ? `$${Number(value).toLocaleString()}` : '-';
      case 'closing_date':
      case 'expected_deal_timeline_start':
      case 'expected_deal_timeline_end':
      case 'proposal_sent_date':
      case 'decision_expected_date':
      case 'offer_sent_date':
      case 'begin_execution_date':
        return value ? format(new Date(value as string), 'MMM d, yyyy') : '-';
      case 'modified_at':
      case 'created_at':
        return value ? format(new Date(value as string), 'MMM d, yyyy HH:mm') : '-';
      case 'customer_need_identified':
      case 'decision_maker_present':
      case 'nda_signed':
      case 'execution_started':
      case 'supplier_portal_required':
        return value === true ? 'Yes' : value === false ? 'No' : '-';
      case 'customer_agreed_on_need':
      case 'budget_confirmed':
      case 'supplier_portal_access':
      case 'negotiation_status':
      case 'loss_reason':
        return value || '-';
      case 'rfq_document_url':
        return value ? (
          <a 
            href={value as string} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            View Document
          </a>
        ) : '-';
      case 'description':
      case 'need_summary':
      case 'rfq_confirmation_note':
      case 'negotiation_notes':
      case 'internal_notes':
      case 'product_service_scope':
        return value ? (
          <div className="max-w-xs truncate" title={value as string}>
            {value as string}
          </div>
        ) : '-';
      default:
        return value as string || '-';
    }
  };

  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
        <p className="text-gray-600">Create your first deal to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Column Customizer */}
      <div className="flex justify-end">
        <DealsColumnCustomizer 
          columns={columns}
          onColumnsChange={setColumns}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onDealSelection && (
                <TableHead className="w-10">
                  <span className="sr-only">Select</span>
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key}
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDeals.map((deal) => (
              <TableRow key={deal.id} className={selectedDealIds.includes(deal.id) ? 'bg-blue-50' : ''}>
                {onDealSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedDealIds.includes(deal.id)}
                      onCheckedChange={(checked) => onDealSelection(deal.id, !!checked)}
                    />
                  </TableCell>
                )}
                  {visibleColumns.map((column) => {
                    // Show field if it has data or if it's a core field
                    const isCoreField = ['deal_name', 'stage', 'amount', 'probability', 'modified_at', 'created_at', 'internal_notes', 'created_by', 'modified_by', 'related_lead_id', 'related_meeting_id', 'company_name', 'lead_name', 'lead_owner', 'phone_no'].includes(column.key);
                    const fieldValue = deal[column.key as keyof Deal];
                    const shouldShowField = isCoreField || (fieldValue !== null && fieldValue !== undefined && fieldValue !== '');
                   
                   return (
                     <TableCell key={column.key}>
                       {shouldShowField 
                         ? formatCellValue(deal, column.key) 
                         : '-'
                       }
                     </TableCell>
                   );
                 })}
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(deal);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(deal.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DealsListView;