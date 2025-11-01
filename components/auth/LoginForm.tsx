'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { LoginFormData } from '@/lib/types';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LoginFormData, string>> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Kullanıcı adı gereklidir';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Convert username to email format
      const email = `${formData.username}@vector.app`;

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Kullanıcı adı veya şifre hatalı');
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('Giriş başarısız');
      }

      // Redirect to personnel page
      router.push('/personnel');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      setGeneralError(
        error instanceof Error ? error.message : 'Giriş sırasında bir hata oluştu'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {generalError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{generalError}</p>
        </div>
      )}

      <Input
        label="Kullanıcı Adı"
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        error={errors.username}
        disabled={isLoading}
        autoComplete="username"
      />

      <Input
        label="Şifre"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        disabled={isLoading}
        autoComplete="current-password"
      />

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
      >
        Giriş Yap
      </Button>
    </form>
  );
}
