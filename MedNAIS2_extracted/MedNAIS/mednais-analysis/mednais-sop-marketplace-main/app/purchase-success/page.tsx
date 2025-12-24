
'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setIsLoading(false);
      return;
    }

    // Poll payment status (as per Stripe playbook)
    const pollPaymentStatus = async () => {
      const maxAttempts = 5;
      const pollInterval = 2000; // 2 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await fetch(`/api/stripe/checkout-status/${sessionId}`);

          if (!response.ok) {
            throw new Error('Failed to check payment status');
          }

          const data = await response.json();

          if (data.payment_status === 'paid') {
            // Payment successful - get purchase details
            setPurchaseData({
              amount: data.amount_total,
              paymentIntentId: sessionId,
              sop: data.metadata ? {
                id: data.metadata.sop_id,
                title: data.metadata.sop_title,
              } : null,
            });
            setIsLoading(false);
            return;
          } else if (data.status === 'expired') {
            setError('Payment session expired. Please try again.');
            setIsLoading(false);
            return;
          }

          // If payment is still pending, wait and retry
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          if (attempt === maxAttempts - 1) {
            setError('Error checking payment status. Please check your email for confirmation.');
            setIsLoading(false);
          }
        }
      }

      // If we've exhausted attempts and still no success
      if (isLoading) {
        setError('Payment status check timed out. Please check your email for confirmation.');
        setIsLoading(false);
      }
    };

    pollPaymentStatus();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-8 text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verifying your purchase...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your transaction.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">Purchase Verification Failed</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
                <Button asChild>
                  <Link href="/marketplace">
                    Return to Marketplace
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="text-green-600 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            <CardTitle className="text-2xl text-green-800">Purchase Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <p className="text-green-700 text-lg mb-2">
                Thank you for your purchase!
              </p>
              <p className="text-green-600">
                You now have access to this SOP and can execute it anytime.
              </p>
            </div>

            {purchaseData && (
              <div className="bg-background rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-foreground mb-2">Purchase Details</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">SOP:</span> {purchaseData.sop?.title}</p>
                  <p><span className="font-medium">Amount:</span> ${(purchaseData.amount / 100).toFixed(2)}</p>
                  <p><span className="font-medium">Transaction ID:</span> {purchaseData.paymentIntentId}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href={purchaseData?.sop ? `/sops/${purchaseData.sop.id}` : "/sops"}>
                  View SOP
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground border-t pt-4">
              <p>
                A confirmation email has been sent to your email address with the purchase details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
