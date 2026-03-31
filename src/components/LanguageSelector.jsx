import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector">
      <Globe size={18} />
      <select 
        value={i18n.language} 
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-dropdown"
      >
        <option value="en">{t('language.english')}</option>
        <option value="fr">{t('language.french')}</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
