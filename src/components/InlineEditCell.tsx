import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Check, X, Edit3 } from "lucide-react";
import { Deal, DealStage, DEAL_STAGES } from "@/types/deal";

interface InlineEditCellProps {
  value: any;
  field: string;
  dealId: string;
  onSave: (dealId: string, field: string, value: any) => void;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'stage' | 'priority' | 'currency';
  options?: string[];
}

export const InlineEditCell = ({ 
  value, 
  field, 
  dealId, 
  onSave, 
  type = 'text',
  options = []
}: InlineEditCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    let processedValue = editValue;
    
    // Process value based on type
    if (type === 'number') {
      processedValue = parseFloat(editValue) || 0;
    } else if (type === 'boolean') {
      processedValue = Boolean(editValue);
    }
    
    onSave(dealId, field, processedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const formatDisplayValue = () => {
    if (value === null || value === undefined || value === '') return '-';
    
    if (type === 'currency') {
      const symbols = { USD: '$', EUR: '€', INR: '₹' };
      return `${symbols[value.currency_type as keyof typeof symbols] || '€'}${value.toLocaleString()}`;
    }
    
    if (type === 'date' && value) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    
    if (type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };

  if (!isEditing) {
    return (
      <div 
        className="group flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
        onClick={() => setIsEditing(true)}
      >
        <span className="truncate flex-1">{formatDisplayValue()}</span>
        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      </div>
    );
  }

  const renderEditControl = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full min-h-[60px]"
            autoFocus
          />
        );
        
      case 'number':
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full"
            autoFocus
          />
        );
        
      case 'date':
        return (
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full"
            autoFocus
          />
        );
        
      case 'boolean':
        return (
          <Switch
            checked={Boolean(editValue)}
            onCheckedChange={setEditValue}
          />
        );
        
      case 'stage':
        return (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEAL_STAGES.map(stage => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'priority':
        return (
          <Select value={editValue?.toString()} onValueChange={(val) => setEditValue(parseInt(val))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  Priority {num} {num === 1 ? '(Highest)' : num === 2 ? '(High)' : num === 3 ? '(Medium)' : num === 4 ? '(Low)' : '(Lowest)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'select':
        return (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      default:
        return (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full"
            autoFocus
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-1 animate-fade-in">
      <div className="flex-1">
        {renderEditControl()}
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-6 w-6 p-0 hover:bg-green-100"
        >
          <Check className="w-3 h-3 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-6 w-6 p-0 hover:bg-red-100"
        >
          <X className="w-3 h-3 text-red-600" />
        </Button>
      </div>
    </div>
  );
};