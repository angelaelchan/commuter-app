import { Button } from './Button';
import { Icon } from './Icon';

interface Props {
  message: string;
  onUndo: () => void;
  onClose: () => void;
}

export function Toast({ message, onUndo, onClose }: Props) {
  return (
    <div className="toast" role="status">
      <button type="button" className="toast__close" aria-label="Dismiss" onClick={onClose}>
        <Icon name="x" />
      </button>
      <p className="body-s emphasis">{message}</p>
      <Button onClick={onUndo}>Undo</Button>
    </div>
  );
}
