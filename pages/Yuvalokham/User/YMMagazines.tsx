import React from 'react';
import { Lock, BookOpen, Download, ExternalLink, Calendar } from 'lucide-react';
import { Card, Skeleton, Badge, EmptyState } from '../../../components/ui';
import { useYMMagazines } from '../../../hooks/queries';
import { YMMagazine } from '../../../types';

export const YMMagazines: React.FC = () => {
  const { data: magazines, isLoading, isError } = useYMMagazines();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-textDark font-medium">Failed to load magazines</p>
          <p className="text-textMuted text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  const items: YMMagazine[] = magazines ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Magazines</h1>
        <p className="text-textMuted mt-1">Browse and read Yuvalokham magazine issues.</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="w-7 h-7 text-textMuted" />}
            title="No magazines available"
            description="Published issues will appear here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((mag) => (
            <MagazineCard key={mag.id} magazine={mag} />
          ))}
        </div>
      )}
    </div>
  );
};

const MagazineCard: React.FC<{ magazine: YMMagazine }> = ({ magazine }) => {
  const hasAccess = !!magazine.pdf_file_url;

  const handleCardClick = () => {
    if (hasAccess && magazine.pdf_file_url) {
      window.open(magazine.pdf_file_url, '_blank');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-white rounded-lg border border-borderColor shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col ${
        hasAccess ? 'cursor-pointer' : ''
      }`}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] bg-bgLight overflow-hidden">
        {magazine.cover_image_url ? (
          <img
            src={magazine.cover_image_url}
            alt={magazine.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {!hasAccess && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
            <Lock className="w-8 h-8 text-white" />
            <span className="text-white text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
              Subscribe to read
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-textDark text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {magazine.title}
        </h3>
        {magazine.issue_number && (
          <p className="text-xs text-textMuted mt-1">{magazine.issue_number}</p>
        )}
        {magazine.published_date && (
          <p className="text-xs text-textMuted mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(magazine.published_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        )}

        <div className="mt-auto pt-3">
          {hasAccess ? (
            <div className="flex gap-2">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(magazine.pdf_file_url!, '_blank');
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Read
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  const a = document.createElement('a');
                  a.href = magazine.pdf_file_url!;
                  a.download = '';
                  a.click();
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-textMuted hover:text-textDark cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </span>
            </div>
          ) : (
            <Badge variant="light">
              <Lock className="w-3 h-3 mr-1" /> Locked
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
