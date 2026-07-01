import * as React from 'react';
import { Person } from './AddPersonModal';
export interface RecipientPickerProps {
  open: boolean;
  onClose?: () => void;
  people?: Person[];
  /** 'self' | personId */
  value?: string;
  onChange?: (value: string) => void;
  /** Persist a newly-added person (also auto-selected). */
  onAddPerson?: (person: Person) => void;
  allowSelf?: boolean;
  selfName?: string;
  selfSubtitle?: string;
  title?: string;
  subtitle?: string;
  relationships?: string[];
}
/** Modal to pick the booking recipient — "Para mí", saved people, or add new. */
export declare const RecipientPicker: React.FC<RecipientPickerProps>;
export default RecipientPicker;
