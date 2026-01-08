import React from 'react';
import { NoticeCategory, NOTICE_CATEGORIES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface NoticeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: NoticeCategory | 'all';
  onCategoryChange: (category: NoticeCategory | 'all') => void;
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  departments: string[];
}

const NoticeFilters: React.FC<NoticeFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
}) => {
  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onDepartmentChange('all');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedDepartment !== 'all';

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 input-focus"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={(value) => onCategoryChange(value as NoticeCategory | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px] input-focus">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {NOTICE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-full sm:w-[180px] input-focus">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default NoticeFilters;
