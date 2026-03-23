import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Filter, X } from 'lucide-react';
import { setFilter, clearFilters } from '../features/documents/documentsSlice';
import './SearchBar.css';

const SearchBar = () => {
  const dispatch = useDispatch();
  const reduxFilters = useSelector((state) => state.documents.filters);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    sortBy: 'date',
  });

  useEffect(() => {
    setSearchQuery(reduxFilters.searchQuery || '');
    setFilters({
      type: reduxFilters.type || 'all',
      sortBy: reduxFilters.sortBy || 'date',
    });
  }, [reduxFilters]);

  useEffect(() => {
    const currentSearch = reduxFilters.searchQuery || '';
    if (searchQuery === currentSearch) {
      setIsDebouncing(false);
      return undefined;
    }

    setIsDebouncing(true);

    const debounceId = setTimeout(() => {
      dispatch(setFilter({ searchQuery: searchQuery.trim() }));
      setIsDebouncing(false);
    }, 300);

    return () => clearTimeout(debounceId);
  }, [searchQuery, reduxFilters.searchQuery, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsDebouncing(false);
    dispatch(setFilter({ searchQuery: searchQuery.trim() }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    dispatch(setFilter(newFilters));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({ type: 'all', sortBy: 'date' });
    setIsDebouncing(false);
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
          <button
            type="button"
            className="clear-search"
            onClick={() => {
              setSearchQuery('');
              dispatch(setFilter({ searchQuery: '' }));
            }}
          >
            <X size={18} />
          </button>
        )}
        <button type="button" className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={20} />
          Filters
        </button>
      </form>

      {isDebouncing && <div className="search-status">Searching...</div>}

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Document Type</label>
            <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
              <option value="all">All Types</option>
              <option value="General">General</option>
              <option value="Contract">Contract</option>
              <option value="Legal">Legal</option>
              <option value="Academic">Academic</option>
              <option value="Financial">Financial</option>
              <option value="Personal">Personal</option>
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
