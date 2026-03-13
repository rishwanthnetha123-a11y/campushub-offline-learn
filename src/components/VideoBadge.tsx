import { Trophy, AlertTriangle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VideoBadgeProps {
  completionPercentage: number;
  attentionScore: number;
  skipCount: number;
}

export function VideoBadge({ completionPercentage, attentionScore, skipCount }: VideoBadgeProps) {
  // Determine badge type
  if (completionPercentage >= 90 && attentionScore >= 70) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1">
            <Trophy className="h-3 w-3" />Gold
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Completed with high attention! Score: {attentionScore.toFixed(0)}%</TooltipContent>
      </Tooltip>
    );
  }

  if (completionPercentage >= 90 && attentionScore >= 40) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge className="bg-gray-300/20 text-gray-500 border-gray-400/30 gap-1">
            <Trophy className="h-3 w-3" />Silver
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Completed with moderate attention. Score: {attentionScore.toFixed(0)}%</TooltipContent>
      </Tooltip>
    );
  }

  if (completionPercentage >= 90) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge className="bg-amber-700/20 text-amber-700 border-amber-700/30 gap-1">
            <Trophy className="h-3 w-3" />Bronze
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Completed but low attention. Score: {attentionScore.toFixed(0)}%</TooltipContent>
      </Tooltip>
    );
  }

  if (skipCount > 5 && completionPercentage < 50) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />Skipped
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Video was mostly skipped. {completionPercentage.toFixed(0)}% watched</TooltipContent>
      </Tooltip>
    );
  }

  if (completionPercentage > 0) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="gap-1">
            <Eye className="h-3 w-3" />{completionPercentage.toFixed(0)}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent>In progress</TooltipContent>
      </Tooltip>
    );
  }

  return null;
}
