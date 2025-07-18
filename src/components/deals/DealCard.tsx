
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, User, Building, CheckCircle, AlertCircle, XCircle, DollarSign, Percent } from 'lucide-react';
import { Deal, getStageCompletionStatus } from '@/hooks/useDeals';

interface DealCardProps {
  deal: Deal;
  onRefresh: () => void;
  onEdit?: (deal: Deal) => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const DealCard = ({ deal, onRefresh, onEdit, isSelected = false, onSelect }: DealCardProps) => {
  // Remove StagePanelDialog state since we're using the edit modal from parent
  const [linkedLead, setLinkedLead] = useState<any>(null);
  const [linkedLeadOwner, setLinkedLeadOwner] = useState<any>(null);
  const completionStatus = getStageCompletionStatus(deal);
  // Enable dragging for all cards - only validation happens on drop
  const isDraggingDisabled = false;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: deal.id,
    disabled: true, // Temporarily disable drag to fix click
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Fetch linked lead data when component mounts
  React.useEffect(() => {
    const fetchLeadData = async () => {
      if (!deal.related_lead_id) return;

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('lead_name, company_name, contact_owner')
          .eq('id', deal.related_lead_id)
          .single();

        if (leadError) {
          console.error('Error fetching lead:', leadError);
          return;
        }

        setLinkedLead(lead);

        // Fetch lead owner profile and auth user data if contact_owner exists
        if (lead.contact_owner) {
          try {
            let displayName = '';
            
            // First try to get display name via edge function
            const { data: userDisplayData, error: displayError } = await supabase.functions.invoke('get-user-display-names', {
              body: { userIds: [lead.contact_owner] }
            });

            if (!displayError && userDisplayData?.userDisplayNames?.[lead.contact_owner]) {
              displayName = userDisplayData.userDisplayNames[lead.contact_owner];
            } else {
              // Fallback to direct profile query
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, "Email ID"')
                .eq('id', lead.contact_owner)
                .single();

              if (!profileError && profile) {
                // Create a proper display name
                if (profile.full_name && profile.full_name !== profile["Email ID"]) {
                  displayName = profile.full_name;
                } else if (profile["Email ID"]) {
                  // Extract name from email (part before @)
                  displayName = profile["Email ID"].split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
              }
            }
            
            setLinkedLeadOwner({ 
              display_name: displayName || 'Unknown Owner'
            });
          } catch (error) {
            console.error('Error fetching lead owner:', error);
            setLinkedLeadOwner({ 
              display_name: 'Unknown Owner'
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchLeadData:', error);
      }
    };

    fetchLeadData();
  }, [deal.related_lead_id]);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Discussions': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-yellow-100 text-yellow-800',
      'RFQ': 'bg-orange-100 text-orange-800',
      'Offered': 'bg-purple-100 text-purple-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Dropped': 'bg-gray-100 text-gray-600'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getCompletionIcon = () => {
    switch (completionStatus) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'incomplete':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD'
    }).format(amount);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only handle click if it's not a drag operation
    if (isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    console.log('Deal card clicked, opening edit modal for:', deal.deal_name);
    onEdit?.(deal);
  };

  const handleSelectionChange = (checked: boolean | string) => {
    onSelect?.(!!checked);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`w-full max-w-72 bg-white border transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-400'
      } ${isDragging ? 'opacity-50 scale-105 shadow-lg' : 'hover:shadow-md'} cursor-pointer`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Selection checkbox */}
        {onSelect && (
          <div className="flex justify-end mb-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelectionChange}
              onClick={handleCheckboxClick}
            />
          </div>
        )}
        {/* Deal Title */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 break-words">
            {deal.deal_name}
          </h3>
        </div>
        
        {/* Company, Lead, and Owner Info */}
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-700">Company:</span>
            <div className="ml-1 truncate">
              {linkedLead?.company_name || 'No Company'}
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-700">Lead:</span>
            <div className="ml-1 truncate">
              {linkedLead?.lead_name || 'No Lead Name'}
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-700">Owner:</span>
            <div className="ml-1 truncate">
              {linkedLeadOwner?.display_name || 'No Owner'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealCard;
