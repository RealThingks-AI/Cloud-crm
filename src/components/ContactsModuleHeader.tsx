
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ContactColumnCustomizer, { ContactColumn } from './ContactColumnCustomizer';

interface ContactsModuleHeaderProps {
  onAddContact: () => void;
  columns: ContactColumn[];
  onColumnsChange: (columns: ContactColumn[]) => void;
}

const ContactsModuleHeader = ({ onAddContact, columns, onColumnsChange }: ContactsModuleHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
      </div>
      <div className="flex items-center space-x-3">
        <ContactColumnCustomizer 
          columns={columns} 
          onColumnsChange={onColumnsChange} 
        />
        <Button onClick={onAddContact} size="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>
    </div>
  );
};

export default ContactsModuleHeader;
