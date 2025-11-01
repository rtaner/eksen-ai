'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import StarRating from '@/components/ui/StarRating';

export default function TestComponentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          UI Components Test
        </h1>

        {/* Buttons */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Card>

        {/* Inputs */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Inputs</h2>
          <div className="space-y-4">
            <Input
              label="Normal Input"
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Input with Error"
              placeholder="Enter text..."
              error="This field is required"
            />
            <Input
              label="Input with Helper Text"
              placeholder="Enter text..."
              helperText="This is a helper text"
            />
            <Input
              label="Disabled Input"
              placeholder="Disabled..."
              disabled
            />
          </div>
        </Card>

        {/* Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding="sm">
              <p className="text-sm">Small Padding</p>
            </Card>
            <Card padding="md">
              <p className="text-sm">Medium Padding (Default)</p>
            </Card>
            <Card padding="lg">
              <p className="text-sm">Large Padding</p>
            </Card>
          </div>
          <Card hover onClick={() => alert('Card clicked!')}>
            <p className="text-sm">Clickable Card with Hover Effect</p>
          </Card>
        </div>

        {/* Star Rating */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Star Rating</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Interactive (Small)</p>
              <StarRating
                value={rating}
                onChange={setRating}
                size="sm"
                showValue
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Interactive (Medium)</p>
              <StarRating
                value={rating}
                onChange={setRating}
                size="md"
                showValue
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Interactive (Large)</p>
              <StarRating
                value={rating}
                onChange={setRating}
                size="lg"
                showValue
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Read-only (3 stars)</p>
              <StarRating value={3} readonly size="md" showValue />
            </div>
          </div>
        </Card>

        {/* Modal */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Modal</h2>
          <div className="flex gap-4">
            <Button onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
          </div>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Test Modal"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              This is a test modal. You can close it by clicking the X button,
              clicking outside, or pressing Escape.
            </p>
            <Input
              label="Test Input in Modal"
              placeholder="Type something..."
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
