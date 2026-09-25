import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface ComboboxSelectProps {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const ComboboxSelect: React.FC<ComboboxSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecciona o escribe...',
  required = false,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Filter options intelligently
  const filteredOptions = useMemo(() => {
    if (!value || !value.trim()) return options;

    const query = value.toLowerCase().trim();
    // If the value matches an option completely, show all options so user can switch
    const exactMatch = options.some(opt => opt.toLowerCase() === query);
    if (exactMatch) {
      return options;
    }

    const matches = options.filter(opt => opt.toLowerCase().includes(query));
    return matches;
  }, [options, value]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="block text-xs font-semibold text-[#6b645c] mb-1">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full border border-[#e0d6c8] bg-white rounded-lg pl-3 pr-16 py-2.5 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-medium transition-all"
        />

        {/* Action icons on the right */}
        <div className="absolute right-1 flex items-center space-x-0.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-[#9e9689] hover:text-[#3e3a35] hover:bg-[#f4ebd8] rounded-md transition-colors"
              title="Borrar"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsOpen(prev => !prev);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="p-1.5 text-[#8b7355] hover:text-[#3e3a35] hover:bg-[#f4ebd8] rounded-md transition-colors"
            title="Desplegar opciones"
          >
            <ChevronDown 
              size={18} 
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e0d6c8] rounded-xl shadow-xl max-h-56 overflow-y-auto overscroll-contain py-1 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            <div className="px-3.5 py-3 text-xs text-[#8b7355] bg-[#faf9f6] text-center">
              <span>No se encontraron coincidencias exactas.</span>
              <p className="font-bold text-[#3e3a35] mt-0.5">Se guardará como: "{value}"</p>
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.toLowerCase() === (value || '').toLowerCase().trim();
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input blur before click registers
                    handleSelect(opt);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors ${
                    isSelected 
                      ? 'bg-[#f4ebd8] font-bold text-[#2d2a26]' 
                      : 'text-[#4a443c] hover:bg-[#faf9f6] active:bg-[#f4ebd8]'
                  }`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  {isSelected && <Check size={16} className="text-[#8b7355] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ComboboxSelect;
