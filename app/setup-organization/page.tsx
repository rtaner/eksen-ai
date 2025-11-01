import OrganizationSetupForm from '@/components/organization/OrganizationSetupForm';

export default function SetupOrganizationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Organizasyonunuzu Özelleştirin
          </h1>
          <p className="text-gray-600">
            Organizasyon adınızı ve davet kodunuzu özelleştirin
          </p>
        </div>
        <OrganizationSetupForm />
      </div>
    </div>
  );
}
