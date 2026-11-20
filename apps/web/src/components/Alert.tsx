interface AlertProps {
  message: string;
  onClose: () => void;
}

export function Alert({ message, onClose }: AlertProps) {
  return (
    <div className="alert" role="alert">
      <span>{message}</span>
      <button
        type="button"
        className="action-btn"
        aria-label="Fechar aviso"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
