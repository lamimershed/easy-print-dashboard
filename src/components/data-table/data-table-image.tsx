import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';

type DataTableImageProps = {
  imageUrl: string | null | undefined;
};

export const DataTableImage = ({ imageUrl }: DataTableImageProps) => {
  return (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          className="z-10 h-8 w-8 rounded-sm object-cover transition-transform duration-300 hover:scale-300"
        />
      ) : (
        <div className="flex min-h-8 min-w-8 items-center justify-center rounded-sm bg-gray-200">
          x
        </div>
      )}
    </>
  );
};

type DataTableMultipleImageProps = {
  imageUrls: string[] | null | undefined;
};

export const DataTableMultipleImage = ({ imageUrls }: DataTableMultipleImageProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="flex min-h-8 min-w-8 items-center justify-center rounded-sm bg-gray-200">
        x
      </div>
    );
  }

  if (imageUrls.length === 1) {
    return (
      <img
        src={imageUrls[0]}
        className="z-10 h-8 w-8 rounded-sm object-cover transition-transform duration-300 hover:scale-300"
        alt="Single image"
      />
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="relative cursor-pointer">
          {/* Stack effect with multiple images */}
          <div className="relative h-8 w-8">
            {imageUrls.slice(0, 2).map((url, index) => (
              <img
                key={index}
                src={url}
                className={`absolute h-8 w-8 rounded-sm object-cover transition-all duration-300 hover:scale-105 ${
                  index === 0
                    ? 'z-30'
                    : index === 1
                      ? 'z-20 translate-x-1 translate-y-1'
                      : 'z-10 translate-x-2 translate-y-2'
                }`}
                style={{
                  filter: index > 0 ? 'brightness(0.8)' : 'none',
                }}
                alt={`Image ${index + 1}`}
              />
            ))}
          </div>

          {/* Counter badge */}
          {imageUrls.length > 1 && (
            <div className="absolute -right-1 -bottom-1 z-40 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {imageUrls.length}
            </div>
          )}
        </div>
      </HoverCardTrigger>

      <HoverCardContent className="w-80 p-2">
        <div className="relative">
          {/* Main image display */}
          <div className="relative mb-2">
            <img
              src={imageUrls[currentIndex]}
              className="h-48 w-full rounded-md object-contain"
              alt={`Image ${currentIndex + 1}`}
            />

            {/* Navigation buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-2 h-8 w-8 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Image counter */}
          <div className="flex justify-center">
            <span className="text-sm text-gray-600">
              {currentIndex + 1} of {imageUrls.length}
            </span>
          </div>

          {/* Thumbnail indicators */}
          <div className="mt-2 flex justify-center space-x-1">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
