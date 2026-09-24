import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('quesos@zampa.com');
  const [password, setPassword] = useState('zampa123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-[#fdfdfc]">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-1/3 z-10 bg-white shadow-2xl">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <img src="/logo negro.png" alt="ZAMPA" className="h-24 mx-auto mb-4" />
            <h2 className="text-2xl font-bold tracking-tight text-[#3e3a35]">Bienvenido a ZAMPA</h2>
            <p className="text-sm text-[#6b645c] mt-2">Plataforma de gestión administrativa y productiva</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                Credenciales incorrectas o error de conexión.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#3e3a35]">Correo electrónico</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[#f4ebd8]/30 border border-[#e0d6c8] rounded-xl focus:ring-2 focus:ring-[#8b7355] focus:border-transparent outline-none text-[#3e3a35] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3e3a35]">Contraseña</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[#f4ebd8]/30 border border-[#e0d6c8] rounded-xl focus:ring-2 focus:ring-[#8b7355] focus:border-transparent outline-none text-[#3e3a35] transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#8b7355] hover:bg-[#7a6448] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8b7355] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image Background */}
      <div className="hidden lg:block relative flex-1">
        <div className="absolute inset-0 bg-[#1E1B4B]/30 mix-blend-multiply z-10" />
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/e0ffeca3-13fb-4a5c-b801-d6acc486deb8.jpg"
          alt="Zampa Tambo Ovino"
        />
      </div>
    </div>
  );
};

export default Login;
