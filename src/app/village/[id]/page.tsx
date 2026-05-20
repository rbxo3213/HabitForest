"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Store,
  Coins,
  X,
  PackageOpen,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

const GRID_SIZE = 8;
const TILE_W = 64;

const SHOP_ITEMS = [
  { id: "tree_apple", name: "사과나무", type: "tree", emoji: "🌳", price: 100 },
  {
    id: "tree_autumn",
    name: "단풍나무",
    type: "tree",
    emoji: "🍁",
    price: 150,
  },
  { id: "house_small", name: "오두막", type: "house", emoji: "🏠", price: 500 },
  { id: "flower", name: "꽃밭", type: "deco", emoji: "🌸", price: 80 },
  { id: "pond", name: "연못", type: "deco", emoji: "🪷", price: 200 },
  { id: "lamp", name: "가로등", type: "deco", emoji: "🏮", price: 120 },
];

type VillageData = {
  name: string;
  level: number;
  avatarEmoji: string;
  wakeUpTime: string;
  currentActivity: string;
  nickname?: string;
};

type PlacedItem = {
  id: string;
  shopId: string;
  emoji: string;
  x: number;
  y: number;
};

export default function VillageView() {
  const params = useParams();
  const router = useRouter();
  const villageId = params.id as string;

  const [villageData, setVillageData] = useState<VillageData | null>(null);
  const [isOwnVillage, setIsOwnVillage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  const [avatarPos, setAvatarPos] = useState({ x: 3, y: 3 });
  const [isWalking, setIsWalking] = useState(false);
  const [currentActivity, setCurrentActivity] = useState("idle");

  const [isDecorating, setIsDecorating] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<
    (typeof SHOP_ITEMS)[number] | null
  >(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  // 실시간 실제 시간 체크 (1분마다 갱신)
  const [currentTime, setCurrentTime] = useState(new Date());
  const wakeUpTimeStr = villageData?.wakeUpTime || "07:00";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 기상 시간 기준으로 현재 시간대의 하늘 테마 계산
  const currentTimeStr = `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;

  const timeTheme = useMemo(() => {
    const [wH, wM] = wakeUpTimeStr.split(":").map(Number);
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTotalMins = currentHours * 60 + currentMinutes;
    const wakeTotalMins = wH * 60 + wM;

    // 기상 시간 기준 하루 사이클 정의 (기상 후 12시간 낮, 이후 4시간 노을, 그 외 밤)
    const sunsetStart = wakeTotalMins + 12 * 60;
    const nightStart = wakeTotalMins + 16 * 60;

    if (currentTotalMins >= wakeTotalMins && currentTotalMins < sunsetStart) {
      return {
        type: "day",
        bg: "bg-gradient-to-b from-sky-300 to-emerald-100",
        textColor: "text-gray-900",
      };
    } else if (
      currentTotalMins >= sunsetStart &&
      currentTotalMins < nightStart
    ) {
      return {
        type: "sunset",
        bg: "bg-gradient-to-b from-orange-300 via-rose-200 to-emerald-100",
        textColor: "text-amber-950",
      };
    } else {
      return {
        type: "night",
        bg: "bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900",
        textColor: "text-white",
      };
    }
  }, [currentTime, wakeUpTimeStr]);

  // Firestore에서 마을 데코레이션 실시간 연동
  useEffect(() => {
    const villageRef = doc(db, "villages", villageId);
    const unsub = onSnapshot(villageRef, (snap) => {
      if (snap.exists()) {
        setPlacedItems(snap.data().placedItems || []);
      }
    });
    return () => unsub();
  }, [villageId]);

  // 유저 & 마을 정보 로드 및 인증 버그 완전 해결
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      // Firebase가 아직 로그인 여부를 확정 짓지 못했을 때는 로딩을 끝내지 않고 대기합니다.
      if (user === undefined) return;

      try {
        const isOwn = user?.uid === villageId;
        setIsOwnVillage(isOwn);

        // 실시간 유저 정보 구독 (포인트 변동 즉각 반영)
        const userRef = doc(db, "users", villageId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setPoints(data.points || 0);
          setVillageData({
            name: `${data.nickname || "알 수 없음"}의 마을`,
            level: data.level || 1,
            avatarEmoji: data.avatarEmoji || "🦊", // 귀여운 여우 캐릭터 적용
            wakeUpTime: data.wakeUpTime || "07:00",
            currentActivity: data.currentActivity || "idle",
          });
          setCurrentActivity(data.currentActivity || "idle");
        } else {
          if (isOwn) {
            await setDoc(
              userRef,
              {
                uid: user.uid,
                email: user.email,
                points: 500,
                nickname: "신규 주민",
                wakeUpTime: "07:00",
              },
              { merge: true },
            );
          } else {
            router.push("/dashboard");
          }
        }
      } catch (err) {
        console.error("마을 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, [villageId, router]);

  const handleGridClick = async (x: number, y: number) => {
    if (isDecorating && selectedShopItem) {
      if (placedItems.some((i) => i.x === x && i.y === y)) return;

      // 포인트 부족 검증
      if (points < selectedShopItem.price) {
        alert("포인트가 부족하여 구매할 수 없습니다!");
        return;
      }

      const newItem: PlacedItem = {
        id: `item_${Date.now()}`,
        shopId: selectedShopItem.id,
        emoji: selectedShopItem.emoji,
        x,
        y,
      };

      const updated = [...placedItems, newItem];
      try {
        // 1. 배치 아이템 저장
        await setDoc(
          doc(db, "villages", villageId),
          { placedItems: updated },
          { merge: true },
        );
        // 2. 유저 포인트 실시간 차감
        const nextPoints = points - selectedShopItem.price;
        await updateDoc(doc(db, "users", villageId), { points: nextPoints });
        setPoints(nextPoints);
        setSelectedShopItem(null);
      } catch (e) {
        console.error("배치 실패:", e);
      }
      return;
    }

    if (!isDecorating) {
      setIsWalking(true);
      setAvatarPos({ x, y });
      setTimeout(() => setIsWalking(false), 1000);
    }
  };

  const removeItem = async (id: string) => {
    const updated = placedItems.filter((i) => i.id !== id);
    setPlacedItems(updated);
    try {
      await setDoc(
        doc(db, "villages", villageId),
        { placedItems: updated },
        { merge: true },
      );
    } catch (e) {
      console.error("삭제 실패:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-emerald-50">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-full ${timeTheme.bg} flex flex-col overflow-hidden relative transition-colors duration-1000`}
    >
      {/* 실제 시간 기반 하늘 오브젝트 */}
      <div className="absolute top-24 right-12 opacity-30 pointer-events-none z-10">
        {timeTheme.type === "day" && (
          <Sun size={64} className="text-yellow-400" />
        )}
        {timeTheme.type === "sunset" && (
          <Sun size={64} className="text-orange-500" />
        )}
        {timeTheme.type === "night" && (
          <Moon size={56} className="text-yellow-100" />
        )}
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          {villageData && (
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md mt-1">
              <h1 className="font-bold text-gray-900 text-sm">
                {villageData.name}
              </h1>
              <p className="text-[11px] text-gray-500">
                레벨 {villageData.level} · 현재 {currentTimeStr}
              </p>
              <p className="text-[10px] text-slate-500">
                기상 예정 {wakeUpTimeStr}
              </p>
            </div>
          )}
        </div>

        {villageData && !isDecorating && (
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md flex items-center gap-2">
            <Coins size={15} className="text-yellow-500" />
            <span className="font-bold text-gray-900 text-sm">{points} P</span>
          </div>
        )}

        {isDecorating && (
          <div className="pointer-events-auto bg-emerald-600 text-white px-4 py-2 rounded-full shadow-md font-medium text-xs animate-pulse">
            {selectedShopItem
              ? `"${selectedShopItem.name}" 놓을 위치를 선택하세요 (-${selectedShopItem.price}P)`
              : "아이템을 선택하세요"}
          </div>
        )}
      </header>

      {/* Isometric World Grid */}
      <main
        className="flex-1 w-full relative overflow-hidden touch-none"
        style={{ height: "100dvh" }}
      >
        <TransformWrapper
          initialScale={0.8}
          minScale={0.4}
          maxScale={2}
          centerOnInit
          disabled={!!selectedShopItem}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
            <div
              style={{
                width: 1200,
                height: 1200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: GRID_SIZE * TILE_W,
                  height: GRID_SIZE * TILE_W,
                  transform: "rotateX(55deg) rotateZ(45deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Ground */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_W}px)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_W}px)`,
                    background:
                      timeTheme.type === "night" ? "#064e3b" : "#10b981",
                    boxShadow: "16px 16px 0 #047857",
                    borderRadius: "8px",
                  }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);
                    const hasItem = placedItems.some(
                      (p) => p.x === x && p.y === y,
                    );
                    return (
                      <div
                        key={i}
                        onClick={() => handleGridClick(x, y)}
                        style={{
                          borderRight: "1px solid rgba(255,255,255,0.15)",
                          borderBottom: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          backgroundColor:
                            isDecorating && selectedShopItem && !hasItem
                              ? "rgba(255,255,255,0.4)"
                              : "transparent",
                        }}
                      />
                    );
                  })}
                </div>

                {/* Items Render */}
                {placedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      position: "absolute",
                      width: TILE_W,
                      height: TILE_W,
                      left: item.x * TILE_W,
                      top: item.y * TILE_W,
                      transform: "rotateX(-55deg) rotateZ(-45deg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 34,
                      zIndex: 5 + item.y,
                    }}
                    onClick={(e) => {
                      if (isDecorating && isOwnVillage) {
                        e.stopPropagation();
                        removeItem(item.id);
                      }
                    }}
                  >
                    <span className="drop-shadow-md">{item.emoji}</span>
                    {isDecorating && isOwnVillage && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-sm">
                        ✕
                      </div>
                    )}
                  </div>
                ))}

                {/* Character Avatar */}
                {villageData && !isDecorating && (
                  <motion.div
                    animate={{
                      x: avatarPos.x * TILE_W,
                      y: avatarPos.y * TILE_W,
                    }}
                    transition={{ type: "spring", stiffness: 70, damping: 14 }}
                    style={{
                      position: "absolute",
                      width: TILE_W,
                      height: TILE_W,
                      zIndex: 50,
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-end"
                      style={{ transform: "rotateX(-55deg) rotateZ(-45deg)" }}
                    >
                      <motion.div
                        animate={{ y: isWalking ? [0, -10, 0, -10, 0] : 0 }}
                        transition={{
                          duration: 0.6,
                          repeat: isWalking ? Infinity : 0,
                        }}
                        className="text-4xl filter drop-shadow-lg relative"
                      >
                        {/* 현재 운동중일 때 캐릭터 위에 실시간 덤벨 이모지 팝업 */}
                        {currentActivity === "workout" && (
                          <span className="absolute -top-3 -right-2 text-xs bg-white rounded-full p-0.5 shadow-sm">
                            🏋️
                          </span>
                        )}
                        {currentActivity === "study" && (
                          <span className="absolute -top-3 -right-2 text-xs bg-white rounded-full p-0.5 shadow-sm">
                            📚
                          </span>
                        )}
                        {currentActivity === "shower" && (
                          <span className="absolute -top-3 -right-2 text-xs bg-white rounded-full p-0.5 shadow-sm">
                            🚿
                          </span>
                        )}
                        {currentActivity === "housework" && (
                          <span className="absolute -top-3 -right-2 text-xs bg-white rounded-full p-0.5 shadow-sm">
                            🧹
                          </span>
                        )}

                        {villageData.avatarEmoji}
                      </motion.div>
                      <div className="text-[10px] bg-white/80 backdrop-blur-sm text-gray-800 px-1.5 py-0.5 rounded-md mt-1 font-bold shadow-sm whitespace-nowrap">
                        {currentActivity !== "idle"
                          ? "🔥 미션 진행중"
                          : villageData.nickname}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </main>

      {/* Footer */}
      <AnimatePresence>
        {!isDecorating && isOwnVillage && (
          <motion.footer
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            className="absolute bottom-6 left-0 right-0 px-6 flex justify-between items-center z-20 pointer-events-none"
          >
            <button
              onClick={() => setIsDecorating(true)}
              className="pointer-events-auto bg-gray-900 text-white px-6 py-3 rounded-full font-semibold shadow-xl flex items-center gap-2 hover:bg-black transition-transform active:scale-95"
            >
              <Store size={16} />
              마을 꾸미기
            </button>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Shop Sheet */}
      <AnimatePresence>
        {isDecorating && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-30 pb-6"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <PackageOpen size={18} className="text-emerald-500" />
                보관함 상점 (보유 포인트: {points}P)
              </h2>
              <button
                onClick={() => {
                  setIsDecorating(false);
                  setSelectedShopItem(null);
                }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex gap-4 overflow-x-auto">
              {SHOP_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setSelectedShopItem(
                      selectedShopItem?.id === item.id ? null : item,
                    )
                  }
                  className={`flex-none w-24 h-28 rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all ${
                    selectedShopItem?.id === item.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <span className="text-3xl mb-1">{item.emoji}</span>
                  <span className="text-xs font-bold text-gray-800">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold mt-0.5">
                    {item.price} P
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
