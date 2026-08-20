"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchUser, setLogout } from "@/redux/slices/userSlices";
import { normaliseRole, ROLES } from "@/utils/roles";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import { TbHomeMove } from "react-icons/tb";

// Navigation per role — only the links relevant to the signed-in account show.
const NAV: Record<string, { label: string; href: string }[]> = {
  [ROLES.NDIS_COORDINATOR]: [
    { label: "New quote", href: "/portal/ndis" },
    { label: "Quote history", href: "/portal/ndis/history" },
  ],
  [ROLES.TRADE]: [
    { label: "Wholesale catalogue", href: "/portal/trade" },
    { label: "Order history", href: "/portal/trade/orders" },
    { label: "Standing orders", href: "/portal/trade/standing-orders" },
    { label: "Delivery sites", href: "/portal/trade/sites" },
  ],
  [ROLES.CONSUMER]: [
    { label: "My orders", href: "/portal/consumer" },
    { label: "Subscriptions", href: "/portal/consumer/subscriptions" },
  ],
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useSelector((state: RootState) => state.userSlice);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && status === "idle") dispatch(fetchUser());
  }, [status, dispatch]);

  const role = normaliseRole(user?.role);
  const links = NAV[role] ?? [];

  const handleSignOut = async () => {
    try {
      await Axios({ ...SummeryApi.signout });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    dispatch(setLogout());
    router.push("/signin");
  };

  const portalTitle =
    role === ROLES.NDIS_COORDINATOR
      ? "NDIS Coordinator Portal"
      : role === ROLES.TRADE
        ? "Trade Portal"
        : "My Account";

  return (
    <div className="min-h-screen bg-[#f5f0eb] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#1a1a18] text-white flex flex-col">
        <div className="flex items-center justify-between  border-b border-white/10 ">
          <Link href="/" className="px-6 py-5 block">
            <span className="font-serif text-xl">Bestiee</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#c9b89a] mt-1">
              {portalTitle}
            </span>
          </Link>
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer  p-4  flex text-[#c9b89a]  transition-colors"
          >
            <TbHomeMove className="text-2xl" />
          </button>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-[#c9b89a] text-[#1a1a18] font-semibold" : "text-gray-300 hover:bg-white/10"
                  }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-2 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}