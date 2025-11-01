import Card from './Card';
import Button from './Button';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  title = 'Bir Hata Oluştu',
  message = 'Veriler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <Card>
      <div className="text-center py-8">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} size="sm">
            Tekrar Dene
          </Button>
        )}
      </div>
    </Card>
  );
}
