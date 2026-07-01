import * as React from 'react';
export interface Person {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  notes?: string;
}
export interface AddPersonModalProps {
  open: boolean;
  onClose?: () => void;
  /** Receives the built Person (new id generated when adding). */
  onSave: (person: Person) => void;
  /** Pass to edit an existing person (prefills the form). */
  person?: Person | null;
  /** Relationship options for the Select. */
  relationships?: string[];
  /** Override the modal title. */
  title?: string;
}
/** Add / edit a family member or friend you book for. */
export declare const AddPersonModal: React.FC<AddPersonModalProps>;
export declare const RELATIONSHIPS: string[];
export default AddPersonModal;
