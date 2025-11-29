import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showCount?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 16, showCount = false }) => {
  return (
    <div className="flex items-center gap-1">
      {/* Prompt suggests using Red or Purple for stars. Let's use Red (#E3170D) as 'Destaque' for Rating stars per prompt section 2 */}
      <Star 
        fill="#E3170D" 
        color="#E3170D" 
        size={size} 
      />
      <span className={`font-semibold ${showCount ? 'text-lg' : 'text-sm'} text-white`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default StarRating;