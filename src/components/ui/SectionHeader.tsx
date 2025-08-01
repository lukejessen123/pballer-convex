// src/components/ui/SectionHeader.tsx

import React from 'react';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-12">
      {title}
    </h2>
  );
};

export default SectionHeader;
