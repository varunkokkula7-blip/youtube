"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function TransactionsPage() {
  const { user } = useUser();

  const [transactions, setTransactions] =
    useState<any[]>([]);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    try {
      const userId = user?._id || user?.id;

      if (!userId) return;

      const response = await fetch(
        `${BACKEND_URL}/subscription/transactions/${userId}`
      );

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          Billing History
        </h1>

        {transactions.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-400">
            No transactions found.
          </div>
        ) : (
          <div className="space-y-4">

            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5"
              >

                <div className="flex flex-col md:flex-row md:justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-semibold">
                      {transaction.plan}
                    </h2>

                    <p className="text-gray-400">
                      {transaction.duration}
                    </p>

                    <p className="mt-2">
                      Invoice:{" "}
                      {transaction.invoiceNumber || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold">
                      ₹{transaction.amount}
                    </p>

                    <p className="text-green-400">
                      {transaction.status}
                    </p>
                  </div>

                </div>

                <div className="border-t border-gray-800 mt-5 pt-5 grid md:grid-cols-3 gap-4 text-sm">

                  <div>
                    <p className="text-gray-500">
                      Payment ID
                    </p>
                    <p className="break-all">
                      {transaction.paymentId || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Start Date
                    </p>
                    <p>
                      {transaction.startDate
                        ? new Date(
                            transaction.startDate
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Expiry Date
                    </p>
                    <p>
                      {transaction.expiryDate
                        ? new Date(
                            transaction.expiryDate
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}