"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink, Loader } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface BalanceData {
  totalEarnings: number;
  platformFees: number;
  netEarnings: number;
  pendingBalance: number;
  availableBalance: number;
  paidOut: number;
  earningsBySop: Array<{
    sopId: string;
    sopTitle: string;
    earnings: number;
    salesCount: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    platformFee: number;
    status: string;
    sopTitle: string;
    buyerName: string;
    createdAt: string;
  }>;
}

interface ConnectStatus {
  connected: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export function BalanceClient() {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchBalance();
    fetchConnectStatus();
    
    // Handle return from Stripe Connect onboarding
    const success = searchParams?.get("success");
    const refresh = searchParams?.get("refresh");
    
    if (success === "true") {
      toast.success("Payout account connected successfully!");
      // Clean URL
      router.replace("/dashboard/balance");
      fetchConnectStatus();
    } else if (refresh === "true") {
      toast.info("Please complete the account setup to enable payouts");
      router.replace("/dashboard/balance");
    }
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/balance/earnings");
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      const data = await response.json();
      setBalanceData(data);
    } catch (error) {
      console.error("Balance fetch error:", error);
      toast.error("Failed to load balance");
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectStatus = async () => {
    try {
      const response = await fetch("/api/connect/status");
      if (response.ok) {
        const data = await response.json();
        setConnectStatus(data);
      }
    } catch (error) {
      console.error("Connect status error:", error);
    }
  };

  const handleConnectAccount = async () => {
    try {
      setConnectLoading(true);
      const response = await fetch("/api/connect/onboard", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create onboarding link");
      }

      const data = await response.json();
      
      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Connect onboarding error:", error);
      toast.error(error.message || "Failed to start account setup");
      setConnectLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!connectStatus?.payoutsEnabled) {
      toast.error("Please connect your payout account first");
      return;
    }
    
    if (!balanceData || balanceData.availableBalance <= 0) {
      toast.error("No available balance to withdraw");
      return;
    }

    toast.info(
      "Automatic withdrawals coming soon! For now, Stripe will handle payouts automatically based on your payout schedule.",
      { duration: 5000 }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E63946]"></div>
      </div>
    );
  }

  if (!balanceData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Failed to load balance data</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      available: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <DollarSign className="h-8 w-8 text-[#E63946]" />
          Balance & Earnings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your earnings from SOPs and manage withdrawals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Earnings (70%)
            </h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${balanceData.totalEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Platform fee: ${balanceData.platformFees.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending
            </h3>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            ${balanceData.pendingBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Processing</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Available
            </h3>
            <DollarSign className="h-5 w-5 text-[#E63946]" />
          </div>
          <p className="text-3xl font-bold text-[#E63946]">
            ${balanceData.availableBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Paid Out
            </h3>
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            ${balanceData.paidOut.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total withdrawn</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Payout Account</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your bank account or debit card to receive earnings
            </p>
          </div>

          {connectStatus?.connected ? (
            <div className="space-y-4">
              {connectStatus.payoutsEnabled ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800 dark:text-green-300 mb-1">
                        Payout account connected
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Your earnings will be automatically transferred to your account based on your payout schedule.
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                        <strong>Available balance:</strong> ${balanceData.availableBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                        Account setup incomplete
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                        Please complete your account setup to enable payouts.
                      </p>
                      <button
                        onClick={handleConnectAccount}
                        disabled={connectLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium disabled:opacity-50"
                      >
                        {connectLoading ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Complete Setup
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Connect your bank account or debit card through Stripe to receive earnings from your SOP sales. 
                  This is a secure process powered by Stripe Connect.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4 ml-4 list-disc">
                  <li>Secure account verification through Stripe</li>
                  <li>Automatic transfers based on your schedule</li>
                  <li>Support for bank accounts and debit cards</li>
                  <li>Track all payouts in your dashboard</li>
                </ul>
                <button
                  onClick={handleConnectAccount}
                  disabled={connectLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-medium disabled:opacity-50"
                >
                  {connectLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Connect Payout Account
                    </>
                  )}
                </button>
              </div>
              {balanceData.availableBalance > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Available balance: ${balanceData.availableBalance.toFixed(2)}</strong>
                    <br />
                    Connect your payout account to withdraw your earnings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Earnings by SOP</h2>
          {balanceData.earningsBySop.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales yet</p>
          ) : (
            <div className="space-y-3">
              {balanceData.earningsBySop.map((item) => (
                <div
                  key={item.sopId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.sopTitle}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.salesCount} sale{item.salesCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-bold text-[#E63946] ml-4">
                    ${item.earnings.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          {balanceData.recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {balanceData.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {tx.sopTitle}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {tx.buyerName} • {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-bold text-sm">${tx.amount.toFixed(2)}</p>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
