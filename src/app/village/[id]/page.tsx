"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MessageCircle, Store, Coins, X, PackageOpen, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const GRID_SIZE = 8;
const TILE_W = 64;

const SHOP_ITEMS = [
  { id: "tree_apple", name: "사과나무", type: "tree", emoji: "🌳", color: "bg-green-400", price: 100 },
  { id: "tree_autumn", name: "단풍나무", type: "tree", emoji: "🍁", color: "bg-orange-400", price: 150 },
  { id: "house_small", name: "오두막", type: "house", emoji: "🏠", color: "bg-rose-400", price: 500 },
  { id: "flower", name: "꽃밭", type: "deco", emoji: "🌸", color: "bg-pink-300", price: 80 },
  { id: "pond", name: "연못", type: "deco", emoji: "🪷", color: "bg-blue-300", price: 200 },
  { id: "lamp", name: "가로등", type: "deco", emoji: "🏮", color: "bg-yellow-400", price: 120 },
];

type PlacedItem = { id: string; shopId: string; emoji: string; x: number; y: number };

export default function VillageView() {
  const params = useParams();
  const router = useRouter();
  const villageId = params.id as string;

  const [villageData, setVillageData] = useState<any>(null);
  const [isOwnVillage, setIsOwnVillage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  const [avatarPos, setAvatarPos] = useState({ x: 3, y: 3 });
  const [isWalking, setIsWalking] = useState(false);

  const [isDecorating, setIsDecorating] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<any>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  // Firestore에서 마을 데코레이션 불러오기
  useEffect(() => {
    const villageRef = doc(db, "villages", villageId);
    const unsub = onSnapshot(villageRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPlacedItems(data.placedItems || []);
      }
    });
    return () => unsub();
  }, [villageId]);

  // 유저 & 마을 기본 정보
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user: any) => {
      try {
        const isOwn = user?.uid === villageId;
        setIsOwnVillage(isOwn);
        setCurrentUid(user?.uid ?? null);

        const userDoc = await getDoc(doc(db, "users", villageId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setVillageData({
            name: `${data.nickname || data.email?.split("@")[0] || "알 수 없음"}의 마을`,
            level: 1,
            points: data.points || 0,
            color: data.themeColor || "bg-pink-400",
            nickname: data.nickname || "주민",
          });
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, [villageId, router]);

  // 데코레이션 저장
  const saveItems = useCallback(async (items: PlacedItem[]) => {
    try {
      await setDoc(doc(db, "villages", villageId), { placedItems: items }, { merge: true });
    } catch (e) {
      console.error("저장 실패", e);
    }
  }, [villageId]);

  const handleGridClick = (x: number, y: number) => {
    if (isDecorating && selectedShopItem) {
      // 같은 칸에 이미 있으면 무시
      if (placedItems.some((i) => i.x === x && i.y === y)) return;
      const newItem: PlacedItem = {
        id: `item_${Date.now()}`,
        shopId: selectedShopItem.id,
        emoji: selectedShopItem.emoji,
        x,
        y,
      };
      const updated = [...placedItems, newItem];
      setPlacedItems(updated);
      saveItems(updated);
      setSelectedShopItem(null);
      return;
    }

    if (!isDecorating) {
      setIsWalking(true);
      setAvatarPos({ x, y });
      setTimeout(() => setIsWalking(false), 1200);
    }
  };

  const removeItem = (id: string) => {
    const updated = placedItems.filter((i) => i.id !== id);
    setPlacedItems(updated);
    saveItems(updated);
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-emerald-50">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-sky-100 flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <ChevronLeft size={22} className="-ml-0.5" />
          </button>
          {villageData && (
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm mt-1">
              <h1 className="font-bold text-gray-900 text-sm">{villageData.name}</h1>
              <p className="text-[11px] text-gray-500">레벨 {villageData.level}</p>
            </div>
          )}
        </div>

        {isOwnVillage && villageData && !isDecorating && (
          <div className="pointer-events-auto bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
            <Coins size={15} className="text-yellow-500" />
            <span className="font-bold text-gray-900 text-sm">{villageData.points}</span>
          </div>
        )}

        {isDecorating && (
          <div className="pointer-events-auto bg-emerald-500 text-white px-4 py-2 rounded-full shadow-sm font-medium text-xs animate-pulse">
            {selectedShopItem ? `"${selectedShopItem.name}" 놓을 위치를 탭하세요` : "아이템을 선택하세요"}
          </div>
        )}
      </header>

      {/* Isometric World */}
      <main className="flex-1 w-full relative overflow-hidden bg-emerald-100 touch-none" style={{ height: "calc(100dvh - 0px)" }}>
        <TransformWrapper
          initialScale={0.75}
          minScale={0.3}
          maxScale={2.5}
          centerOnInit
          limitToBounds={false}
          disabled={!!selectedShopItem}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
            <div style={{ width: 1400, height: 1400, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Isometric container */}
              <div
                style={{
                  position: "relative",
                  width: GRID_SIZE * TILE_W,
                  height: GRID_SIZE * TILE_W,
                  transform: "rotateX(55deg) rotateZ(45deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Ground grid */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_W}px)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_W}px)`,
                    background: "#86efac",
                    boxShadow: "20px 20px 0 #15803d",
                  }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);
                    const hasItem = placedItems.some((p) => p.x === x && p.y === y);
                    return (
                      <div
                        key={i}
                        onClick={() => !hasItem && handleGridClick(x, y)}
                        style={{
                          borderRight: "1px solid rgba(134,239,172,0.4)",
                          borderBottom: "1px solid rgba(134,239,172,0.4)",
                          cursor: hasItem ? "default" : "pointer",
                          backgroundColor: isDecorating && selectedShopItem && !hasItem
                            ? "rgba(255,255,255,0.2)"
                            : "transparent",
                          transition: "background-color 0.15s",
                        }}
                      />
                    );
                  })}
                </div>

                {/* Placed items */}
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
                      fontSize: 32,
                      zIndex: 5,
                      cursor: isDecorating ? "pointer" : "default",
                      userSelect: "none",
                    }}
                    onClick={() => {
                      if (isDecorating && isOwnVillage) removeItem(item.id);
                    }}
                    title={isDecorating ? "탭하여 삭제" : undefined}
                  >
                    {item.emoji}
                    {isDecorating && isOwnVillage && (
                      <div style={{
                        position: "absolute",
                        top: -4, right: -4,
                        width: 18, height: 18,
                        background: "red",
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "white",
                      }}>✕</div>
                    )}
                  </div>
                ))}

                {/* Avatar */}
                {villageData && !isDecorating && (
                  <motion.div
                    animate={{ x: avatarPos.x * TILE_W, y: avatarPos.y * TILE_W }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    style={{
                      position: "absolute",
                      width: TILE_W,
                      height: TILE_W,
                      zIndex: 10,
                      pointerEvents: "none",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        transform: "rotateX(-55deg) rotateZ(-45deg)",
                      }}
                    >
                      <motion.div
                        animate={{ y: isWalking ? [0, -8, 0, -8, 0] : 0 }}
                        transition={{ duration: 0.5, repeat: isWalking ? 2 : 0 }}
                        style={{ fontSize: 36 }}
                      >
                        🧑
                      </motion.div>
                      <div style={{ fontSize: 9, color: "#374151", marginTop: 2, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {villageData.nickname}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </main>

      {/* 하단 버튼 */}
      <AnimatePresence>
        {!isDecorating && (
          <motion.footer
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="absolute bottom-20 left-0 right-0 px-5 flex justify-between items-center z-20 pointer-events-none"
          >
            {isOwnVillage ? (
              <button
                onClick={() => setIsDecorating(true)}
                className="pointer-events-auto bg-black text-white px-5 py-3.5 rounded-full font-semibold shadow-xl flex items-center gap-2 hover:bg-gray-800 active:scale-95 transition-all"
              >
                <Store size={18} />
                꾸미기
              </button>
            ) : (
              <div />
            )}
            <button className="pointer-events-auto w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-600 active:scale-95 transition-all">
              <MessageCircle size={22} fill="currentColor" />
            </button>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* 꾸미기 모드 Bottom Sheet */}
      <AnimatePresence>
        {isDecorating && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] z-30"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <PackageOpen size={18} />
                아이템 보관함
              </h2>
              <button
                onClick={() => { setIsDecorating(false); setSelectedShopItem(null); }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 px-4 pt-2">아이템 선택 후 맵을 탭해 배치 · 배치된 아이템 탭하면 삭제</p>
            <div className="p-4 flex gap-3 overflow-x-auto pb-8 snap-x">
              {SHOP_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedShopItem(selectedShopItem?.id === item.id ? null : item)}
                  className={`flex-none w-20 h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 snap-center transition-all ${
                    selectedShopItem?.id === item.id
                      ? "border-emerald-500 bg-emerald-50 scale-105 shadow-sm"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span style={{ fontSize: 28 }}>{item.emoji}</span>
                  <span className="text-[10px] font-medium text-gray-600 leading-tight text-center">{item.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
