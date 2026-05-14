"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useQRCode } from "next-qrcode";
import { useAuth } from "../authcontext";
import { Tab } from "@headlessui/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AvailableCoupon = {
  id: number;
  name: string;
  description: string;
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
  maxPerMember: number;
  claimedCount: number;
  canClaim: boolean;
  disabledReason: string | null;
};

type MyClaim = {
  id: string;
  couponId: number;
  code: string;
  status: "CLAIMED" | "ACTIVATED" | "USED" | "EXPIRED" | "CANCELED";
  claimedAt: string | null;
  activatedAt: string | null;
  activationExpiresAt: string | null;
  usedAt: string | null;
  coupon: {
    id: number;
    name: string;
    description: string;
    rewardType: "DISCOUNT_AMOUNT" | "REDEEM_VARIANT" | "STAFF_REWARD";
    discountAmount: number;
    pointsRequired: number;
    useStartAt: string | null;
    useEndAt: string | null;
    codeMode: "FIXED" | "RANDOM_PER_USER";
  };
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

function secondsLeft(expiresAt: string | null) {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

function EmptyCouponIllustration() {
  return (
    <svg width="118" height="100" viewBox="0 0 118 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="0.5" width="100" height="100" rx="50" fill="#EDF0F2"></rect>
      <g filter="url(#filter0_d_22565_144151)">
        <rect x="6" y="13.5" width="74" height="21" rx="4" fill="white"></rect>
      </g>
      <rect x="9" y="16.5" width="15" height="15" rx="2" fill="#EDF0F2"></rect>
      <rect x="29" y="18.5" width="42" height="4" rx="2" fill="#EDF0F2"></rect>
      <rect x="29" y="25.5" width="22" height="4" rx="2" fill="#EDF0F2"></rect>
      <g filter="url(#filter1_d_22565_144151)">
        <rect x="50" y="39.5" width="74" height="21" rx="4" fill="white"></rect>
      </g>
      <rect x="53" y="42.5" width="15" height="15" rx="2" fill="#EDF0F2"></rect>
      <rect x="73" y="44.5" width="42" height="4" rx="2" fill="#EDF0F2"></rect>
      <rect x="73" y="51.5" width="22" height="4" rx="2" fill="#EDF0F2"></rect>
      <g filter="url(#filter2_d_22565_144151)">
        <rect x="14" y="69.5" width="74" height="21" rx="4" fill="white"></rect>
      </g>
      <rect x="17" y="72.5" width="15" height="15" rx="2" fill="#EDF0F2"></rect>
      <rect x="37" y="74.5" width="42" height="4" rx="2" fill="#EDF0F2"></rect>
      <rect x="37" y="81.5" width="22" height="4" rx="2" fill="#EDF0F2"></rect>
      <path
        d="M98.6368 13.9684C97.955 13.7858 97.5239 13.088 97.798 12.4375C97.9461 12.0863 98.1201 11.7614 98.3201 11.4629C98.7317 10.8486 99.2261 10.3554 99.8034 9.98309C100.396 9.61494 101.044 9.37698 101.748 9.26922C102.468 9.16557 103.219 9.21872 104.003 9.42868C104.694 9.61394 105.305 9.88465 105.836 10.2408C106.366 10.597 106.789 11.015 107.105 11.4949C107.436 11.9789 107.643 12.5284 107.726 13.1432C107.823 13.7622 107.777 14.4251 107.588 15.1318C107.464 15.5928 107.286 15.9814 107.053 16.2977C106.84 16.6028 106.596 16.8669 106.322 17.0899C106.068 17.3017 105.787 17.4899 105.479 17.6545C105.187 17.8232 104.905 17.9863 104.632 18.1437C104.379 18.2899 104.127 18.4285 103.878 18.5593C103.633 18.6748 103.405 18.8195 103.194 18.9935C102.987 19.152 102.802 19.3496 102.64 19.586C102.482 19.8072 102.36 20.0791 102.273 20.4017C102.106 21.0254 101.465 21.3955 100.841 21.2284L100.738 21.2006C100.057 21.0181 99.6525 20.3182 99.8349 19.6372L99.8565 19.5566C99.9831 19.1459 100.153 18.788 100.367 18.4829C100.6 18.1666 100.843 17.9025 101.098 17.6907C101.371 17.4677 101.649 17.2621 101.93 17.0739C102.226 16.8898 102.511 16.719 102.783 16.5616C102.998 16.4378 103.222 16.3085 103.455 16.1735C103.705 16.0427 103.937 15.8826 104.152 15.6933C104.383 15.5081 104.579 15.2973 104.742 15.0608C104.919 14.8284 105.039 14.5642 105.102 14.2682C105.198 13.6023 105.102 13.0412 104.812 12.5849C104.542 12.1174 104.069 11.793 103.393 11.6119C102.932 11.4884 102.516 11.4756 102.144 11.5735C101.776 11.6561 101.443 11.8222 101.146 12.0718C100.848 12.3215 100.598 12.6414 100.395 13.0315C100.386 13.0486 100.377 13.0657 100.368 13.083C100.035 13.7269 99.3368 14.156 98.6368 13.9684ZM100.537 22.0856C101.339 22.3005 101.815 23.1247 101.6 23.9266C101.385 24.7284 100.561 25.2043 99.7594 24.9895L99.6672 24.9647C98.8653 24.7499 98.3894 23.9257 98.6043 23.1238C98.8192 22.3219 99.6434 21.8461 100.445 22.0609L100.537 22.0856Z"
        fill="#C9CED0"
      ></path>
      <path
        d="M20.4115 48.6607C19.6559 48.896 18.8293 48.493 18.6995 47.7123C18.6293 47.2907 18.5996 46.8786 18.6104 46.4759C18.6325 45.6472 18.8056 44.8835 19.1297 44.1848C19.4708 43.4809 19.9427 42.867 20.5454 42.3431C21.165 41.8139 21.9091 41.414 22.7775 41.1436C23.5437 40.905 24.2848 40.7956 25.0008 40.8154C25.7167 40.8353 26.3682 40.9779 26.9552 41.2434C27.5592 41.5036 28.0844 41.9004 28.5307 42.4338C28.994 42.962 29.3477 43.6177 29.5916 44.4009C29.7507 44.9117 29.8146 45.3868 29.7833 45.8262C29.7637 46.2432 29.691 46.6394 29.5651 47.0148C29.4509 47.3679 29.2974 47.7146 29.1045 48.0549C28.9286 48.3898 28.7586 48.7136 28.5945 49.0262C28.4421 49.3165 28.287 49.5983 28.1293 49.8715C27.9662 50.1278 27.8367 50.4016 27.7407 50.693C27.6393 50.9674 27.5827 51.2652 27.5707 51.5865C27.5533 51.8907 27.6004 52.2216 27.7117 52.5792C27.927 53.2704 27.5411 54.0052 26.85 54.2205L26.735 54.2562C25.9804 54.4913 25.1781 54.07 24.9431 53.3154L24.9152 53.226C24.7891 52.7609 24.7358 52.3199 24.7553 51.9029C24.7866 51.4635 24.8593 51.0673 24.9735 50.7142C25.0994 50.3388 25.2391 49.9777 25.3927 49.6311C25.5632 49.2791 25.7306 48.9468 25.8947 48.6342C26.0237 48.3886 26.1585 48.1318 26.2992 47.8638C26.457 47.5905 26.5812 47.2997 26.6719 46.9913C26.7797 46.6775 26.8396 46.36 26.8516 46.0387C26.8806 45.7122 26.8363 45.3898 26.7185 45.0715C26.4106 44.3829 25.9829 43.9091 25.4352 43.65C24.8993 43.3686 24.2568 43.3446 23.5076 43.5779C22.9968 43.737 22.5944 43.9744 22.3004 44.2901C22.0012 44.5887 21.7854 44.9454 21.6531 45.3602C21.5208 45.775 21.4751 46.2282 21.5161 46.7197C21.5177 46.7413 21.5195 46.763 21.5214 46.7847C21.5919 47.5942 21.1873 48.4191 20.4115 48.6607ZM27.0756 55.2149C27.9643 54.9381 28.909 55.4342 29.1858 56.3228C29.4625 57.2115 28.9665 58.1562 28.0778 58.433L27.9756 58.4648C27.087 58.7416 26.1422 58.2455 25.8655 57.3569C25.5887 56.4682 26.0848 55.5234 26.9734 55.2467L27.0756 55.2149Z"
        fill="#C9CED0"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M108.098 82.196C105.575 84.1792 102.421 85.3571 99 85.3571C90.7157 85.3571 84 78.4495 84 69.9286C84 61.4076 90.7157 54.5 99 54.5C107.284 54.5 114 61.4076 114 69.9286C114 73.4474 112.855 76.6911 110.927 79.2868L118.414 86.9882C119.195 87.7916 119.195 89.0941 118.414 89.8975C117.633 90.7008 116.367 90.7008 115.586 89.8975L108.098 82.196ZM110 69.9286C110 76.1773 105.075 81.2429 99 81.2429C92.9249 81.2429 88 76.1773 88 69.9286C88 63.6799 92.9249 58.6143 99 58.6143C105.075 58.6143 110 63.6799 110 69.9286Z"
        fill="#C9CED0"
      ></path>
      <defs>
        <filter id="filter0_d_22565_144151" x="0" y="9.5" width="86" height="33" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
          <feOffset dy="2"></feOffset>
          <feGaussianBlur stdDeviation="3"></feGaussianBlur>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_22565_144151"></feBlend>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_22565_144151" result="shape"></feBlend>
        </filter>
        <filter id="filter1_d_22565_144151" x="44" y="35.5" width="86" height="33" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
          <feOffset dy="2"></feOffset>
          <feGaussianBlur stdDeviation="3"></feGaussianBlur>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_22565_144151"></feBlend>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_22565_144151" result="shape"></feBlend>
        </filter>
        <filter id="filter2_d_22565_144151" x="8" y="65.5" width="86" height="33" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
          <feOffset dy="2"></feOffset>
          <feGaussianBlur stdDeviation="3"></feGaussianBlur>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_22565_144151"></feBlend>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_22565_144151" result="shape"></feBlend>
        </filter>
      </defs>
    </svg>
  );
}

export default function Coupon() {
  const { token } = useAuth();
  const { Canvas: QRCodeImage } = useQRCode();
  const locale = useLocale();
  const router = useRouter();

  const [tab, setTab] = useState<"available" | "my">("available");
  const [available, setAvailable] = useState<AvailableCoupon[]>([]);
  const [myCoupons, setMyCoupons] = useState<MyClaim[]>([]);
  const [memberPoint, setMemberPoint] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState<null | {
    claimId: string;
    couponName: string;
    code: string;
    activationExpiresAt: string;
    rewardType: "DISCOUNT_AMOUNT" | "REDEEM_VARIANT" | "STAFF_REWARD";
  }>(null);
  const [countdown, setCountdown] = useState(0);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [availableRes, myRes] = await Promise.all([
        fetch("/api/coupons/available", { headers: authHeaders }),
        fetch("/api/coupons/my", { headers: authHeaders }),
      ]);
      const availableJson = await availableRes.json();
      const myJson = await myRes.json();

      if (!availableRes.ok) throw new Error(availableJson.error || "โหลดคูปองไม่สำเร็จ");
      if (!myRes.ok) throw new Error(myJson.error || "โหลดคูปองของฉันไม่สำเร็จ");

      setAvailable(availableJson.data || []);
      setMyCoupons(myJson.data || []);
      setMemberPoint(Number(myJson.memberPoint ?? 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeModal) return;
    setCountdown(secondsLeft(activeModal.activationExpiresAt));
    const interval = setInterval(() => {
      setCountdown(secondsLeft(activeModal.activationExpiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeModal]);

  const claimCoupon = async (couponId: number) => {
    try {
      const res = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ coupon_id: couponId }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "รับคูปองไม่สำเร็จ");
      }

      await refresh();

      const result = await Swal.fire({
        title: "รับคูปองสำเร็จ",
        text: "ต้องการใช้คูปองเลยหรือไม่?",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "ใช้เลย",
        cancelButtonText: "ไว้ก่อน",
      });

      if (result.isConfirmed && json.data?.claimId) {
        await activateCoupon(json.data.claimId);
      } else {
        setTab("my");
      }
    } catch (err) {
      Swal.fire("ผิดพลาด", err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  };

  const activateCoupon = async (claimId: string) => {
    const res = await fetch("/api/coupons/activate", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ claim_id: claimId }),
    });
    const json = await res.json();
    if (!res.ok) {
      Swal.fire("ผิดพลาด", json.error || "เปิดใช้คูปองไม่สำเร็จ", "error");
      return;
    }

    const myRes = await fetch("/api/coupons/my", { headers: authHeaders });
    const myJson = await myRes.json();
    if (myRes.ok) {
      setMyCoupons(myJson.data || []);
      setMemberPoint(Number(myJson.memberPoint ?? 0));
    }
    const claim = (myJson.data || []).find((c: MyClaim) => c.id === claimId) || null;
    const couponName = claim?.coupon?.name ?? "Coupon";

    setActiveModal({
      claimId,
      couponName,
      code: json.data.code,
      activationExpiresAt: json.data.activationExpiresAt,
      rewardType: claim?.coupon?.rewardType ?? "DISCOUNT_AMOUNT",
    });
  };

  const markUsed = async (claimId: string) => {
    const res = await fetch("/api/coupons/use", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ claim_id: claimId }),
    });
    const json = await res.json();
    if (!res.ok) {
      Swal.fire("ผิดพลาด", json.error || "บันทึกการใช้งานไม่สำเร็จ", "error");
      return;
    }

    setActiveModal(null);
    await refresh();
    Swal.fire("สำเร็จ", "บันทึกการใช้งานแล้ว", "success");
  };

  const activeClaims = myCoupons.filter((c) => c.status === "ACTIVATED");

  return (
    <>
      <div className="flex flex-col bg-[#ffffff] min-h-dvh w-full">
        <div className="px-6 pt-6">
          <h1 className="text-xl font-black font-prompt text-gray-900">คูปองสำหรับสมาชิกคนพิเศษ</h1>
          <div className="mt-1 text-sm font-prompt text-gray-600">คะแนนของฉัน: {memberPoint}</div>

          <Tab.Group
            selectedIndex={tab === "available" ? 0 : 1}
            onChange={(index) => setTab(index === 0 ? "available" : "my")}
          >
            <Tab.List className="mt-4 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              {["คูปองทั้งหมด", "คูปองของฉัน"].map((label) => (
                <Tab
                  key={label}
                  className={({ selected }) =>
                    `flex-1 rounded-lg px-4 py-2 text-sm font-bold font-prompt outline-none transition-colors ${
                      selected ? "bg-[#F35F1A] text-white" : "text-gray-700 hover:bg-white"
                    }`
                  }
                >
                  {label}
                </Tab>
              ))}
            </Tab.List>
          </Tab.Group>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center text-sm font-prompt text-gray-500">กำลังโหลด...</div>
          ) : null}

          {!loading && tab === "available" ? (
            <>
              {available.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <EmptyCouponIllustration />
                  <div className="mt-4 text-center text-sm font-prompt text-gray-700">ไม่พบคูปองที่ใช้ได้</div>
                </div>
              ) : (
                available.map((coupon) => (
                  <div
                    key={coupon.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/privilege/coupon/${coupon.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") router.push(`/privilege/coupon/${coupon.id}`);
                    }}
                    className="relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm overflow-visible"
                    aria-label={`เปิดดูคูปอง: ${coupon.name}`}
                  >
                  
                    <div className="flex items-stretch">
                      <div className="flex-1 min-w-0 p-3">
                        <Link
                          href={`/privilege/coupon/${coupon.id}`}
                          className="text-base font-black font-prompt text-gray-900 whitespace-normal break-words hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {coupon.name}
                        </Link>
                        <div className="text-xs font-prompt text-gray-500 mt-1">
                          {coupon.description}
                        </div>
                        <div className="text-xs font-prompt text-gray-500 mt-2">
                          {formatWindow(coupon.claimStartAt, coupon.claimEndAt, locale)}
                        </div>
                        {!coupon.canClaim && coupon.disabledReason ? (
                          <div className="mt-2 text-xs font-prompt text-red-600">{coupon.disabledReason}</div>
                        ) : null}
                        
                        {/* <div className="text-xs font-prompt text-gray-500 mt-1">
                          ประเภท:{" "}
                          {coupon.rewardType === "DISCOUNT_AMOUNT"
                            ? `ส่วนลด ฿${coupon.discountAmount}`
                            : coupon.rewardType === "REDEEM_VARIANT"
                              ? "แลกสินค้า"
                              : "รับของรางวัลกับเจ้าหน้าที่"}
                        </div> */}
                        {/* <div className="text-xs font-prompt text-gray-500 mt-1">
                          คะแนนที่ใช้: <span className="font-bold">{coupon.pointsRequired}</span> • รับแล้ว {coupon.claimedCount}/{coupon.maxPerMember}
                        </div> */}
                        {/* <div className="text-xs font-prompt text-gray-500 mt-1">
                          รหัสคูปอง: {coupon.codeMode === "FIXED" ? coupon.fixedCode || "-" : "สร้างตอนกดรับ (ไม่ซ้ำกัน)"}
                        </div> */}
                      </div>

                      <div className="p-2 flex items-stretch">
                        {coupon.maxPerMember > 0 && coupon.claimedCount >= coupon.maxPerMember ? (
                      <button
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="text-white w-20 px-2 rounded-lg font-bold font-prompt disabled:opacity-50 h-full flex items-center justify-center text-center whitespace-normal leading-tight  bg-[#000000] cursor-not-allowed"
                        >
                          รับครบแล้ว
                        </button>
                    ) : <button
                          disabled={!coupon.canClaim}
                          onClick={(e) => {
                            e.stopPropagation();
                            claimCoupon(coupon.id);
                          }}
                          className="ci-btn-primary text-white w-20 px-2 rounded-lg font-bold font-prompt disabled:opacity-50 h-full flex items-center justify-center text-center whitespace-normal leading-tight"
                        >
                          {coupon.pointsRequired > 0 ? `ใช้ ${coupon.pointsRequired} คะแนน` : "รับคูปองฟรี"}
                        </button>}
                        
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : null}

          {!loading && tab === "my" ? (
            <>
              {myCoupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <EmptyCouponIllustration />
                  <div className="mt-4 text-center text-sm font-prompt text-gray-700">ยังไม่มีคูปอง</div>
                </div>
              ) : (
                myCoupons.map((claim) => (
                  <div key={claim.id} className="border border-gray-200 rounded-xl shadow-sm overflow-hidden bg-white">
                    <div className="flex items-stretch">
                      <div className="flex-1 min-w-0 p-4">
                        <div className="text-base font-black font-prompt text-gray-900 whitespace-normal break-words">
                          {claim.coupon.name}
                        </div>
                        <div className="text-xs font-prompt text-gray-500 mt-2">
                          ใช้ได้: {formatWindow(claim.coupon.useStartAt, claim.coupon.useEndAt, locale)}
                        </div>
                        
                      </div>

                      <div className="p-4 flex items-stretch">
                        {claim.status === "CLAIMED" ? (
                          <button
                            onClick={() => activateCoupon(claim.id)}
                            className="ci-btn-primary text-white w-20 px-2 rounded-lg font-bold font-prompt disabled:opacity-50 h-full flex items-center justify-center text-center whitespace-normal leading-tight"
                          >
                            ใช้คูปอง
                          </button>
                        ) : null}
                        {claim.status === "ACTIVATED" ? (
                          <button
                            onClick={() =>
                              setActiveModal({
                                claimId: claim.id,
                                couponName: claim.coupon.name,
                                code: claim.code,
                                activationExpiresAt:
                                  claim.activationExpiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                                rewardType: claim.coupon.rewardType,
                              })
                            }
                            className="w-20 px-2 rounded-lg font-bold font-prompt border border-gray-200 bg-white h-full flex items-center justify-center text-center whitespace-normal leading-tight"
                          >
                            เปิดดู
                          </button>
                        ) : null}
                        {claim.status === "USED" ? (
                          <button
                            disabled
                            className="w-20 px-2 rounded-lg font-bold font-prompt bg-gray-100 text-gray-500 border border-gray-200 h-full flex items-center justify-center text-center whitespace-normal leading-tight"
                          >
                            ใช้แล้ว
                          </button>
                        ) : null}
                        {claim.status === "EXPIRED" ? (
                          <button
                            disabled
                            className="w-20 px-2 rounded-lg font-bold font-prompt bg-gray-100 text-gray-500 border border-gray-200 h-full flex items-center justify-center text-center whitespace-normal leading-tight"
                          >
                            หมดอายุ
                          </button>
                        ) : null}
                        {claim.status !== "CLAIMED" && claim.status !== "ACTIVATED" && claim.status !== "USED" && claim.status !== "EXPIRED" ? (
                          <div className="w-20" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : null}

          {activeClaims.length > 0 && tab === "available" ? (
            <div className="text-xs font-prompt text-gray-500">
              มีคูปองที่เปิดใช้งานแล้ว {activeClaims.length} ใบ (ไปที่ “คูปองของฉัน” เพื่อดู)
            </div>
          ) : null}
        </div>
      </div>

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <div className="text-lg font-black font-prompt text-gray-900">{activeModal.couponName}</div>
            <div className="mt-1 text-sm font-prompt text-gray-600">
              {activeModal.rewardType === "STAFF_REWARD"
                ? "แสดงหน้าจอนี้กับพนักงานเพื่อรับของรางวัล"
                : "แสดงรหัสให้พนักงานเพื่อใช้คูปอง"}
            </div>

            <div className="mt-4 flex flex-col items-center">
              <QRCodeImage
                text={activeModal.code}
                options={{
                  type: "image/jpeg",
                  quality: 1,
                  errorCorrectionLevel: "M",
                  margin: 2,
                  scale: 6,
                  width: 240,
                  color: { dark: "#111827", light: "#ffffff" },
                }}
              />
              <div className="mt-3 font-mono text-sm">{activeModal.code}</div>
              <div className="mt-2 text-sm font-prompt text-orange-700 font-bold">
                เหลือเวลา {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")} นาที
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-3 rounded-lg font-bold font-prompt border border-gray-200 bg-white"
              >
                ปิด
              </button>
              <button
                onClick={() => markUsed(activeModal.claimId)}
                className="flex-1 ci-btn-primary px-4 py-3 rounded-lg font-bold font-prompt"
              >
                บันทึกว่าใช้งานแล้ว
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
