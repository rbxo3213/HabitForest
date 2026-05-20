"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MessageCircle, Store, Coins, X, PackageOpen, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Isometric Grid settings
const GRID_SIZE = 8;
const TILE_W = 60;

// Shop Items
const SHOP_ITEMS = [
  { id: "tree_1", name: "사과나무", type: "tree", color: "bg-green-500", price: 100 },
  { id: "tree_2", name: "단풍나무", type: "tree", color: "bg-orange-500", price: 150 },
  { id: "house_1", name: "작은 오두막", type: "house", color: "bg-rose-400", price: 500 },
];

export default function VillageView() {
  const params = useParams();
  const router = useRouter();
  const villageId = params.id as string;
  
  const [villageData, setVillageData] = useState<any>(null);
  const [isOwnVillage, setIsOwnVillage] = useState(false);
  const [loading, setLoading] = useState(true);

  // Avatar state
  const [avatarPos, setAvatarPos] = useState({ x: 4, y: 4 });
  const [isWalking, setIsWalking] = useState(false);

  // Decoration State
  const [isDecorating, setIsDecorating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Placed Items on grid
  const [placedItems, setPlacedItems] = useState([
    { id: "item_1", type: "tree", color: "bg-green-500", x: 1, y: 2 },
    { id: "item_2", type: "house", color: "bg-rose-400", x: 6, y: 5 },
  ]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      try {
        if (user) {
          setIsOwnVillage(user.uid === villageId);
        }
        
        // Fetch User Data for Village info
        const userDoc = await getDoc(doc(db, "users", villageId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setVillageData({
            name: `${data.nickname || data.email.split("@")[0]}의 마을`,
            level: 1,
            points: 1450, // Mock points for now
            theme: "기본 테마",
            color: data.themeColor || "bg-pink-400"
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

    return () => unsubscribe();
  }, [villageId, router]);

  // Click on grid to move OR place item
  const handleGridClick = (x: number, y: number) => {
    if (isDecorating && selectedItem) {
      // Place the item
      setPlacedItems([...placedItems, { 
        id: `item_${Date.now()}`, 
        type: selectedItem.type, 
        color: selectedItem.color, 
        x, y 
      }]);
      setSelectedItem(null); // Deselect after placing
      return;
    }

    if (!isDecorating) {
      // Move Avatar
      setIsWalking(true);
      setAvatarPos({ x, y });
      
      // Stop walking animation after delay
      setTimeout(() => {
        setIsWalking(false);
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#e0f2f1]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-sky-50 flex flex-col overflow-hidden relative">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm hover:bg-white transition-colors"
          >
            <ChevronLeft size={24} className="-ml-1" />
          </button>
          
          {villageData && (
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm mt-2">
              <h1 className="font-bold text-gray-900">{villageData.name}</h1>
              <p className="text-xs text-gray-500 font-medium">레벨 {villageData.level} • {villageData.theme}</p>
            </div>
          )}
        </div>

        {isOwnVillage && !isDecorating && villageData && (
          <div className="pointer-events-auto bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
            <Coins size={16} className="text-yellow-500" />
            <span className="font-bold text-gray-900">{villageData.points}</span>
          </div>
        )}

        {isDecorating && (
          <div className="pointer-events-auto bg-blue-500 text-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2 font-medium animate-pulse">
            {selectedItem ? "원하는 칸을 터치하세요" : "아이템을 선택하세요"}
          </div>
        )}
      </header>

      {/* Isometric World Container */}
      <main className="flex-1 w-full h-[calc(100dvh-120px)] relative overflow-hidden bg-[#e0f2f1] dark:bg-[#3e2723] transition-colors duration-300 touch-none">
        <TransformWrapper
          initialScale={0.8}
          minScale={0.3}
          maxScale={2}
          centerOnInit
          limitToBounds={false}
          disabled={selectedItem !== null}
        >
          <TransformComponent wrapperClass="w-full h-full cursor-grab active:cursor-grabbing">
            <div className="w-[1500px] h-[1500px] flex flex-col items-center justify-center">
              {/* Isometric Projection Wrapper */}
              <div 
                className="relative mx-auto my-auto"
                style={{
                  transform: `rotateX(60deg) rotateZ(45deg)`,
                  transformStyle: "preserve-3d",
                  width: GRID_SIZE * TILE_W,
                  height: GRID_SIZE * TILE_W,
                }}
              >
                {/* Base Grid */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 border-t border-l border-emerald-400/30 bg-emerald-300 shadow-[20px_20px_0_#0f766e]">
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);
                    const isHoveredTarget = isDecorating && selectedItem;

                    return (
                      <div 
                        key={i}
                        onClick={() => handleGridClick(x, y)}
                        className={`border-b border-r border-emerald-400/30 transition-colors cursor-pointer ${
                          isHoveredTarget ? "hover:bg-white/50 bg-black/10" : "hover:bg-emerald-200/50"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Placed Items */}
                {placedItems.map((item) => (
                  <div 
                    key={item.id}
                    className="absolute pointer-events-none"
                    style={{
                      width: TILE_W, height: TILE_W,
                      transform: `translate3d(${item.x * TILE_W}px, ${item.y * TILE_W}px, 0) rotateX(-90deg) rotateY(-45deg)`,
                      transformOrigin: "bottom center"
                    }}
                  >
                    {item.type === "tree" && (
                      <div className={`w-16 h-20 -ml-4 -mt-16 ${item.color} rounded-t-full rounded-b-md border-4 border-black/20 relative shadow-xl`}>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-amber-800 rounded-sm"></div>
                      </div>
                    )}
                    {item.type === "house" && (
                      <div className={`w-24 h-24 -ml-6 -mt-20 ${item.color} rounded-xl border-4 border-black/20 relative shadow-xl`}>
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-amber-900 rounded-t-md"></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* The Avatar */}
                {!isDecorating && villageData && (
                  <motion.div 
                    className="absolute pointer-events-none z-10"
                    animate={{
                      x: avatarPos.x * TILE_W,
                      y: avatarPos.y * TILE_W,
                    }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    style={{
                      width: TILE_W, height: TILE_W,
                      transformStyle: "preserve-3d"
                    }}
                  >
                    {/* Stand-up Wrapper */}
                    <div 
                      className="w-full h-full absolute flex flex-col items-center justify-end"
                      style={{
                        transform: "rotateX(-90deg) rotateY(-45deg)",
                        transformOrigin: "bottom center"
                      }}
                    >
                      <motion.div 
                        animate={{ y: isWalking ? [0, -10, 0] : 0 }}
                        transition={{ repeat: isWalking ? Infinity : 0, duration: 0.3 }}
                        className={`w-12 h-16 ${villageData.color} rounded-full border-4 border-white shadow-xl flex flex-col items-center justify-start pt-2 relative z-20`}
                      >
                        <div className="flex gap-2">
                          <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                          <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                        </div>
                      </motion.div>
                      <div className="w-8 h-3 bg-black/20 rounded-[100%] absolute -bottom-1 blur-sm z-0"></div>
                    </div>
                  </motion.div>
                )}

              </div>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </main>

      {/* Floating Action Bar (Normal Mode) */}
      <AnimatePresence>
        {!isDecorating && (
          <motion.footer 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-6 left-0 right-0 px-6 flex justify-between items-center z-20 pointer-events-none"
          >
            {isOwnVillage ? (
              <button 
                onClick={() => setIsDecorating(true)}
                className="pointer-events-auto bg-black text-white px-6 py-4 rounded-full font-semibold shadow-xl flex items-center gap-2 hover:bg-gray-800 transition-colors active:scale-95"
              >
                <Store size={20} />
                상점 & 꾸미기
              </button>
            ) : (
              <div />
            )}

            <button className="pointer-events-auto w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-600 transition-colors active:scale-95">
              <MessageCircle size={24} fill="currentColor" />
            </button>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Decoration Bottom Sheet */}
      <AnimatePresence>
        {isDecorating && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 flex flex-col"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <PackageOpen size={20} />
                보관함
              </h2>
              <button 
                onClick={() => { setIsDecorating(false); setSelectedItem(null); }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 flex gap-4 overflow-x-auto pb-8 snap-x">
              {SHOP_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                  className={`flex-none w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 snap-center transition-all ${
                    selectedItem?.id === item.id 
                      ? "border-blue-500 bg-blue-50 scale-105" 
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md ${item.color} shadow-sm border border-black/10`} />
                  <span className="text-xs font-medium text-gray-700">{item.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
