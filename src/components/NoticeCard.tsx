import React from 'react';
import { Notice, getCategoryColor, NOTICE_CATEGORIES } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Pin, 
  Calendar, 
  User, 
  Download, 
  FileText, 
  Image as ImageIcon,
  Trash2,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';

interface NoticeCardProps {
  notice: Notice;
  onEdit?: (notice: Notice) => void;
  onDelete?: (notice: Notice) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const NoticeCard: React.FC<NoticeCardProps> = ({
  notice,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  const categoryInfo = NOTICE_CATEGORIES.find(c => c.value === notice.category);
  const categoryColorClass = getCategoryColor(notice.category);

  return (
    <Card className={`notice-card ${notice.isPinned ? 'notice-card-pinned' : ''} animate-fade-in`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {notice.isPinned && (
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              <Badge className={`category-badge border ${categoryColorClass}`}>
                {categoryInfo?.label || notice.category}
              </Badge>
              {notice.department && (
                <Badge variant="outline" className="text-xs">
                  {notice.department}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg text-foreground leading-tight">
              {notice.title}
            </h3>
          </div>
          {(canEdit || canDelete) && (
            <div className="flex items-center gap-1">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => onEdit?.(notice)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete?.(notice)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
          {notice.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{notice.createdByName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(notice.createdAt, 'MMM d, yyyy')}</span>
          </div>
          {notice.expiryDate && (
            <div className="flex items-center gap-1 text-warning">
              <span>Expires: {format(notice.expiryDate, 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {notice.attachmentUrl && (
          <div className="mt-4 pt-4 border-t border-border">
            <a
              href={notice.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {notice.attachmentType === 'pdf' ? (
                <FileText className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              <span className="truncate max-w-[200px]">{notice.attachmentName}</span>
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoticeCard;
