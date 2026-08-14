/**
 * tailwind.config.cjs — konfigurasi tema Kemenkes.
 * Sumber: blok `tailwind.config = {...}` yang dulu ada di Script.html (JIT browser),
 * sekarang dikompilasi statis oleh Tailwind CLI.
 */

module.exports = {
  content: ['../Index.html', '../Display.html', '../Script.html', '../Style.html'],
  safelist: [
    // Class yang nilainya disuntik runtime (STATUS_META.cls, kartu statistik, dsb).
    'bg-slate-100', 'text-slate-600', 'border-slate-200',
    'bg-blue-50', 'text-blue-700', 'border-blue-200',
    'bg-green-100', 'text-green-700', 'border-green-300', 'animate-pulse-soft',
    'bg-amber-50', 'text-amber-700', 'border-amber-200',
    'bg-emerald-600', 'text-white', 'border-emerald-700',
    'bg-red-50', 'text-red-600', 'border-red-200',
    'bg-emerald-50', 'text-emerald-600',
    'text-blue-600', 'text-amber-600',
    'bg-secondary-light', 'text-secondary-dark'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A9A5',
          dark: '#008F8B',
          deeper: '#00716E',
          light: '#E0F5F4',
          soft: '#F0FAFA'
        },
        secondary: {
          DEFAULT: '#6FBE44',
          dark: '#4F9430',
          light: '#EAF6E1'
        },
        ink: {
          DEFAULT: '#1A1A1A',
          soft: '#2D2D2D',
          muted: '#5C6F6E',
          faint: '#8AA2A1'
        },
        mist: '#F7FAFA',
        line: {
          DEFAULT: '#DCEFEE',
          dark: '#C5E2E0'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,169,165,0.05), 0 4px 16px -2px rgba(0,169,165,0.10)'
      }
    }
  }
};
