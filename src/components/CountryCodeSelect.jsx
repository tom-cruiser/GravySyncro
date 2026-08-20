import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import './CountryCodeSelect.css';

// Converts an ISO 3166-1 alpha-2 code ("BI") into its flag emoji by mapping
// each letter onto a Regional Indicator Symbol — no image assets needed.
const flagEmoji = (iso2) => {
  if (!iso2 || iso2.length !== 2) return '';
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/**
 * A searchable phone country-code picker, à la WhatsApp: the trigger shows
 * just the selected flag + dial code, and opening it reveals a search box
 * that filters the (long) country list live instead of forcing people to
 * scroll a native <select> to find their country.
 */
const CountryCodeSelect = ({ countries, value, onChange, disabled, label = 'Country code' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selected = useMemo(
    () => countries.find((country) => country.dial === value) || countries[0],
    [countries, value]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return countries;
    return countries.filter((country) => (
      country.name.toLowerCase().includes(normalized)
      || country.dial.includes(normalized)
      || country.iso2.toLowerCase().includes(normalized)
    ));
  }, [countries, query]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    const focusFrame = requestAnimationFrame(() => searchRef.current?.focus());

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(focusFrame);
    };
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prevOpen) => !prevOpen);
    setQuery('');
  };

  const handleSelect = (country) => {
    onChange(country.dial);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={`country-select ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="country-select-trigger"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="country-select-flag">{flagEmoji(selected?.iso2)}</span>
        <span className="country-select-dial">{selected?.dial}</span>
        <ChevronDown size={14} className="country-select-caret" />
      </button>

      {open && (
        <div className="country-select-panel" role="listbox" aria-label={label}>
          <div className="country-select-search">
            <Search size={14} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country or code"
            />
          </div>
          <div className="country-select-list">
            {filtered.length === 0 ? (
              <p className="country-select-empty">No matches</p>
            ) : (
              filtered.map((country) => (
                <button
                  type="button"
                  key={country.iso2}
                  className={`country-select-option ${country.dial === selected?.dial ? 'active' : ''}`}
                  onClick={() => handleSelect(country)}
                  role="option"
                  aria-selected={country.dial === selected?.dial}
                >
                  <span className="country-select-flag">{flagEmoji(country.iso2)}</span>
                  <span className="country-select-name">{country.name}</span>
                  <span className="country-select-dial">{country.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
