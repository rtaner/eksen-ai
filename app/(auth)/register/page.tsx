import Link from 'next/link';
import Image from 'next/image';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src="/icon-192x192.png"
              alt="Eksen AI Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <h1 className="text-3xl font-bold" style={{ color: '#0B2A4C' }}>
              Eksen AI
            </h1>
          </div>
          <p className="text-gray-600">
            Hesap oluşturun
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <RegisterForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Zaten hesabınız var mı?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
