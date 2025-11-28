import { createContext, useContext, useState, useEffect } from 'react';

const YearContext = createContext(null);

export function YearProvider({ children }) {
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('selectedYear');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });

  useEffect(() => {
    localStorage.setItem('selectedYear', selectedYear.toString());
  }, [selectedYear]);

  const value = {
    selectedYear,
    setSelectedYear,
  };

  return (
    <YearContext.Provider value={value}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (context === null) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
}

export default YearContext;
