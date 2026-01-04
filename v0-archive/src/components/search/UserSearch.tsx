'use client';

import React, { useState } from 'react';

interface UserSearchProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 w-full max-w-md mx-auto">
      <div className="flex items-center border-b-2 border-sky-500 py-2">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search by username or furry name..."
          className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
          aria-label="Search users"
        />
        <button
          type="submit"
          className="flex-shrink-0 bg-sky-500 hover:bg-sky-700 border-sky-500 hover:border-sky-700 text-sm border-4 text-white py-1 px-2 rounded"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default UserSearch;
