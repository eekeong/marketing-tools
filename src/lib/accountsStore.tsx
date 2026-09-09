"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Platform, SocialAccount } from "./types";

interface AccountsContextValue {
  accounts: SocialAccount[];
  loading: boolean;
  addAccount: (displayName: string, platform?: Platform | null) => void;
  updateAccount: (id: string, patch: { displayName?: string; platform?: Platform | null }) => void;
  removeAccount: (id: string) => void;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

interface AccountRow {
  id: string;
  platform: Platform | null;
  display_name: string;
  status: SocialAccount["status"];
  connected_at: string | null;
  external_account_id: string | null;
}

function mapRow(row: AccountRow): SocialAccount {
  return {
    id: row.id,
    platform: row.platform,
    displayName: row.display_name,
    status: row.status,
    connectedAt: row.connected_at ?? undefined,
    externalAccountId: row.external_account_id ?? undefined,
  };
}

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/calendar/accounts");
        if (!res.ok) return;
        const { accounts: rows } = await res.json();
        setAccounts((rows as AccountRow[]).map(mapRow));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addAccount: AccountsContextValue["addAccount"] = (displayName, platform) => {
    (async () => {
      const res = await fetch("/api/calendar/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, platform: platform ?? null }),
      });
      if (!res.ok) return;
      const { account } = await res.json();
      setAccounts((prev) => [...prev, mapRow(account)]);
    })();
  };

  const updateAccount: AccountsContextValue["updateAccount"] = (id, patch) => {
    const prev = accounts;
    setAccounts((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    fetch(`/api/calendar/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((res) => {
      if (!res.ok) setAccounts(prev);
    });
  };

  const removeAccount: AccountsContextValue["removeAccount"] = (id) => {
    const prev = accounts;
    setAccounts((a) => a.filter((x) => x.id !== id));
    fetch(`/api/calendar/accounts/${id}`, { method: "DELETE" }).then((res) => {
      if (!res.ok) setAccounts(prev);
    });
  };

  return (
    <AccountsContext.Provider value={{ accounts, loading, addAccount, updateAccount, removeAccount }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useSocialAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useSocialAccounts must be used within AccountsProvider");
  return ctx;
}
