
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { ServerHeader } from "@/components/layout/server-header";
import { Footer } from "@/components/layout/footer";
import { SOPRatingsSection } from "@/components/sop-ratings-section";
import { SOPRatingBadge } from "@/components/sop-rating-badge";
import { SOPPurchaseSection } from "@/components/sop-purchase-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Clock, 
  User, 
  Users,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  Youtube,
  Timer as TimerIcon,
  Edit,
  Trash2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { formatTime } from "@/lib/timer";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";

interface SOPPageProps {
  params: {
    id: string;
  };
}

async function getSOPDetails(sopId: string, userId?: string) {
  const sop = await prisma.sOP.findUnique({
    where: { id: sopId },
    include: {
      creator: true,
      group: true,
      steps: {
        orderBy: { order: 'asc' }
      },
      _count: {
        select: {
          executions: true,
          purchases: true
        }
      }
    }
  });

  if (!sop) return null;

  // Check access permissions
  let hasAccess = false;
  let isOwner = false;

  if (userId) {
    isOwner = sop.creatorId === userId;
    
    if (isOwner) {
      hasAccess = true;
    } else if (sop.type === 'PERSONAL') {
      hasAccess = false; // Only owner can access personal SOPs
    } else if (sop.type === 'GROUP' && sop.groupId) {
      // Check group membership
      const membership = await prisma.groupMembership.findFirst({
        where: {
          groupId: sop.groupId,
          userId,
          status: 'APPROVED'
        }
      });
      hasAccess = !!membership;
    } else if (sop.type === 'MARKETPLACE') {
      // Check if user has purchased this SOP
      const purchase = await prisma.purchase.findFirst({
        where: {
          sopId,
          buyerId: userId
        }
      });
      hasAccess = !!purchase || isOwner;
    }
  }

  return {
    sop,
    hasAccess,
    isOwner
  };
}

export default async function SOPDetailsPage({ params }: SOPPageProps) {
  const user = await getCurrentUser();
  const result = await getSOPDetails(params.id, user?.id);

  if (!result) {
    notFound();
  }

  const { sop, hasAccess, isOwner } = result;

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

  const totalEstimatedTime = sop.steps.reduce((total, step) => {
    return total + (step.timerSeconds || 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ServerHeader />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-background rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{sop.title}</h1>
                <Badge className={getTypeColor(sop.type)} variant="secondary">
                  {sop.type === 'PERSONAL' && 'Personal'}
                  {sop.type === 'GROUP' && 'Group'}
                  {sop.type === 'MARKETPLACE' && 'Marketplace'}
                </Badge>
              </div>
              
              <p className="text-muted-foreground text-lg mb-4">{sop.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDistanceToNow(new Date(sop.createdAt), { addSuffix: true })}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{sop.steps.length} steps</span>
                </div>

                {totalEstimatedTime > 0 && (
                  <div className="flex items-center gap-1">
                    <TimerIcon className="h-4 w-4" />
                    <span>~{formatTime(totalEstimatedTime)} estimated</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  <span>{sop._count.executions} executions</span>
                </div>

                <SOPRatingBadge sopId={sop.id} className="flex items-center" />

                {sop.type === 'MARKETPLACE' && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{sop._count.purchases} purchases</span>
                  </div>
                )}
              </div>
            </div>

            {sop.type === 'MARKETPLACE' && sop.price && (
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {formatPrice(sop.price)}
                </div>
              </div>
            )}
          </div>

          {/* Creator Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={sop.creator?.image || undefined} />
                <AvatarFallback>
                  {sop.creator?.name?.charAt(0)?.toUpperCase() || sop.creator?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sop.creator?.name || sop.creator?.email}</span>
                </div>
                {sop.group && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <Users className="h-3 w-3" />
                    <span>{sop.group.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isOwner && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/sops/${sop.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                </>
              )}
              
              {hasAccess && (
                <Button asChild>
                  <Link href={`/sops/${sop.id}/execute`}>
                    <Play className="h-4 w-4 mr-2" />
                    Execute SOP
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Access Control Message / Purchase Button */}
        <SOPPurchaseSection
          sopId={sop.id}
          sopPrice={sop.price}
          sopTitle={sop.title}
          sopType={sop.type}
          hasAccess={hasAccess}
        />

        {/* Steps */}
        {(hasAccess || sop.type === 'MARKETPLACE') && (
          <Card className="relative">
            <CardHeader>
              <CardTitle>Steps ({sop.steps.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sop.steps.map((step, index) => {
                  // Show only first 2 steps for non-purchased marketplace SOPs
                  const isPreviewStep = !hasAccess && sop.type === 'MARKETPLACE' && index < 2;
                  const isLockedStep = !hasAccess && sop.type === 'MARKETPLACE' && index >= 2;
                  
                  return (
                    <div key={step.id} className={isLockedStep ? "relative" : ""}>
                      <div className={`flex items-start gap-4 ${isLockedStep ? "blur-sm select-none pointer-events-none" : ""}`}>
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {step.order}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              {step.title}
                              {step.timerSeconds && (
                                <Badge variant="outline" className="ml-2">
                                  <TimerIcon className="h-3 w-3 mr-1" />
                                  {formatTime(step.timerSeconds)}
                                </Badge>
                              )}
                            </h3>
                            <p className="text-gray-700 leading-relaxed">{step.description}</p>
                          </div>

                          {hasAccess && (
                            <>
                              {step.imageId && (
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-md">
                                  <Image
                                    src={`/api/assets/${ encodeURIComponent(step.imageId) }`}
                                    alt={`Step ${step.order} image`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}

                              {step.youtubeUrl && (
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-md">
                                  <iframe
                                    src={getYouTubeEmbedUrl(step.youtubeUrl) || undefined}
                                    title={`Step ${step.order} video`}
                                    className="w-full h-full"
                                    allowFullScreen
                                  />
                                </div>
                              )}
                            </>
                          )}

                          {isPreviewStep && (step.imageId || step.youtubeUrl) && (
                            <div className="bg-gray-100 rounded-lg p-4 text-center text-muted-foreground">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                {step.imageId && <ImageIcon className="h-5 w-5" />}
                                {step.youtubeUrl && <Youtube className="h-5 w-5" />}
                              </div>
                              <p className="text-sm">Media content available after purchase</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {index < sop.steps.length - 1 && (
                        <Separator className="my-6" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Locked Content Overlay */}
              {!hasAccess && sop.type === 'MARKETPLACE' && sop.steps.length > 2 && (
                <div className="mt-8 border-t pt-8">
                  <div className="bg-gradient-to-b from-white via-white/95 to-white rounded-lg p-8 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-2">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Unlock {sop.steps.length - 2} More Steps
                      </h3>
                      <p className="text-gray-600">
                        Purchase this SOP to access all {sop.steps.length} steps and start executing it.
                      </p>
                      {sop.price && (
                        <div className="text-3xl font-bold text-green-600">
                          ${(sop.price / 100).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ratings & Reviews */}
        <SOPRatingsSection 
          sopId={sop.id}
          canRate={hasAccess}
          isPurchased={hasAccess && !isOwner}
          isOwner={isOwner}
        />
        </div>
      </main>
      <Footer />
    </div>
  );
}
