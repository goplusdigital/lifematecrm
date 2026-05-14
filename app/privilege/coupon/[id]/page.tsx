"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Tab } from "@headlessui/react";
import { useAuth } from "../../authcontext";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";

type CouponDetail = {
  id: number;
  name: string;
  description: string;
  usageConditions: string;
  rewardType: "DISCOUNT_AMOUNT" | "REDEEM_VARIANT" | "STAFF_REWARD";
  discountAmount: number;
  redeemVariantId: number | null;
  pointsRequired: number;
  claimStartAt: string | null;
  claimEndAt: string | null;
  useStartAt: string | null;
  useEndAt: string | null;
  codeMode: "FIXED" | "RANDOM_PER_USER";
  fixedCode: string;
  requireNewMemberSameDay: boolean;
  maxPerMember: number;
  claimedCount: number;
  canClaim: boolean;
  disabledReason: string | null;
};

function formatWindow(start: string | null, end: string | null, locale: string) {
  if (!start && !end) return "-";
  const resolvedLocale = locale === "th" ? "th-TH" : locale;
  const formatter = new Intl.DateTimeFormat(resolvedLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const s = start ? formatter.format(new Date(start)) : "-";
  const e = end ? formatter.format(new Date(end)) : "-";
  return `${s} → ${e}`;
}

export default function CouponDetailPage() {
  const { token } = useAuth();
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const couponId = typeof params?.id === "string" ? params.id : "";

  const [coupon, setCoupon] = useState<CouponDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [hasClaimed, setHasClaimed] = useState(false);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const refresh = async () => {
    if (!couponId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/coupons/${couponId}`, { headers: authHeaders });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "โหลดคูปองไม่สำเร็จ");
      const nextCoupon = (json.data || null) as CouponDetail | null;
      setCoupon(nextCoupon);
      setHasClaimed(Boolean(nextCoupon && nextCoupon.claimedCount > 0));
    } catch (err) {
      console.error(err);
      setCoupon(null);
      setHasClaimed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHasClaimed(false);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponId]);

  const claimCoupon = async () => {
    if (!coupon) return;
    try {
      const res = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ coupon_id: coupon.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "รับคูปองไม่สำเร็จ");
      setHasClaimed(true);
      await refresh();
      await Swal.fire("สำเร็จ", "รับคูปองแล้ว", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "รับคูปองไม่สำเร็จ";
      Swal.fire("ผิดพลาด", message, "error");
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#ffffff]">
      <div className="px-6 pt-6">
        <Link
          href="/privilege/coupon"
          className="inline-flex items-center text-sm font-prompt text-gray-600 hover:text-gray-900"
        >
          ← กลับ
        </Link>

        <div className="mt-3 text-xl font-black font-prompt text-gray-900">
          {loading ? "กำลังโหลด..." : coupon?.name || "ไม่พบคูปอง"}
        </div>


        <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
          <Tab.List className="mt-4 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            {["รายละเอียดคูปอง", "เงื่อนไขการใช้คูปอง"].map((label) => (
              <Tab
                key={label}
                className={({ selected }) =>
                  `flex-1 rounded-lg px-4 py-2 text-sm font-bold font-prompt outline-none transition-colors ${selected ? "bg-[#F35F1A] text-white" : "text-gray-700 hover:bg-white"
                  }`
                }
              >
                {label}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-4 pb-28">
            <Tab.Panel>
              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {coupon?.description ? (
                  <div className="mt-1 text-sm font-prompt text-gray-600">{coupon.description}</div>
                ) : null}
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {coupon?.usageConditions ? (
                  <div
                    className="text-sm font-prompt text-gray-600"
                    dangerouslySetInnerHTML={{ __html: coupon.usageConditions }}
                  />
                ) : (
                  <div className="text-sm font-prompt text-gray-500">-</div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      <div className="fixed inset-x-0 bottom-2,0 border-t border-gray-200 bg-white p-4">
        <button
          disabled={!coupon || hasClaimed || !coupon.canClaim}
          onClick={claimCoupon}
          className="ci-btn-primary w-full rounded-xl py-3 text-center text-sm font-black font-prompt text-white disabled:opacity-50"
        >
          {coupon
            ? hasClaimed
              ? "รับคูปองแล้ว"
              : coupon.canClaim
                ? coupon.pointsRequired > 0
                  ? `กดรับคูปอง (ใช้ ${coupon.pointsRequired} คะแนน)`
                  : "กดรับคูปอง"
                : "ยังไม่สามารถรับคูปองได้"
            : "กดรับคูปอง"}
        </button>
      </div>
    </div>
  );
}
