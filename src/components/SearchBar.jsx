import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Search, Filter, X } from 'lucide-react';
import { setFilter, clearFilters } from '../features/documents/documentsSlice';
import './SearchBar.css';

const SearchBar = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    sortBy: 'date',
  });

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilter({ searchQuery }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    dispatch(setFilter(newFilters));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({ type: 'all', sortBy: 'date' });
    dispatch(clearFilters());
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search documents by title, type, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button type="button" className="clear-search" onClick={() => setSearchQuery('')}>
            <X size={18} />
          </button>
        )}
        <button type="button" className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={20} />
          Filters
        </button>
      </form>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Document Type</label>
            <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
              <option value="all">All Types</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">Word Document</option>
              <option value="XLSX">Excel</option>
              <option value="PPTX">PowerPoint</option>
              <option value="IMAGE">Image</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
              <option value="date">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="name">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size">Size (Largest First)</option>
              <option value="size-asc">Size (Smallest First)</option>
            </select>
          </div>

          <button className="btn-secondary" onClick={handleClearFilters}>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
