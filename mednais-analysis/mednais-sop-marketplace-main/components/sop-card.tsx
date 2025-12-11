
'use client';

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SOPRatingBadge } from "@/components/sop-rating-badge";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Clock, User, Play, DollarSign, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SOPCardProps {
  sop: {
    id: string;
    title: string;
    description: string;
    type: 'PERSONAL' | 'GROUP' | 'MARKETPLACE';
    price?: number | null;
    createdAt: Date;
    creator: {
      id: string;
      name: string | null;
      email: string;
      image?: string | null;
    };
    steps: Array<{ id: string }>;
    group?: {
      id: string;
      name: string;
    } | null;
    _count?: {
      executions: number;
    };
  };
  showCreator?: boolean;
  showExecuteButton?: boolean;
  showPrice?: boolean;
  onExecute?: (sopId: string) => void;
  onPurchase?: (sopId: string) => void;
}

export function SOPCard({ 
  sop, 
  showCreator = true, 
  showExecuteButton = true, 
  showPrice = true,
  onExecute,
  onPurchase 
}: SOPCardProps) {
  const stepCount = sop.steps?.length || 0;
  const executionCount = sop._count?.executions || 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PERSONAL':
        return 'bg-gray-100 text-foreground';
      case 'GROUP':
        return 'bg-blue-100 text-blue-800';
      case 'MARKETPLACE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-foreground';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-6 truncate">{sop.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{sop.description}</p>
          </div>
          <Badge className={getTypeColor(sop.type)} variant="secondary">
            {sop.type === 'PERSONAL' && 'Personal'}
            {sop.type === 'GROUP' && 'Group'}
            {sop.type === 'MARKETPLACE' && 'Marketplace'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{stepCount} steps</span>
            </div>
            {executionCount > 0 && (
              <div className="flex items-center gap-1">
                <Play className="h-4 w-4" />
                <span>{executionCount} executions</span>
              </div>
            )}
            <SOPRatingBadge sopId={sop.id} />
          </div>

          {/* Group info */}
          {sop.group && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 font-medium">{sop.group.name}</span>
            </div>
          )}

          {/* Price */}
          {showPrice && sop.type === 'MARKETPLACE' && sop.price && (
            <div className="flex items-center gap-1 text-lg font-bold text-green-600">
              <DollarSign className="h-5 w-5" />
              <span>{formatPrice(sop.price)}</span>
            </div>
          )}

          {/* Creator */}
          {showCreator && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={sop.creator?.image || undefined} />
                <AvatarFallback className="text-xs">
                  {sop.creator?.name?.charAt(0)?.toUpperCase() || sop.creator?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  {sop.creator?.name || sop.creator?.email}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(sop.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {sop.type === 'MARKETPLACE' ? (
          <>
            <AddToCartButton sopId={sop.id} variant="default" size="sm" />
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/sops/${sop.id}`}>
                View Details
              </Link>
            </Button>
          </>
        ) : (
          <>
            {showExecuteButton && (
              <Button 
                className="flex-1" 
                onClick={() => onExecute?.(sop.id)}
                asChild={!onExecute}
              >
                {onExecute ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </>
                ) : (
                  <Link href={`/sops/${sop.id}/execute`} className="flex items-center justify-center w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </Link>
                )}
              </Button>
            )}

            <Button variant="outline" size="sm" asChild>
              <Link href={`/sops/${sop.id}`}>
                View Details
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
