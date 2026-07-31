// ============ PRODUCT DATA ============
const products = [
  {
    id: 1,
    title: "OLLIE ครีมกำจัดขน 70ml ของแท้100% ปลอดภัย ไม่เจ็บ ผิวเรียบเนียนทันที",
    price: 88,
    originalPrice: 211,
    image: "a/1.jpg",
    url: "https://s.shopee.co.th/9fJBOrvOOE",
    category: "beauty",
    tags: ["hot"],
    clicks: 0,
    highlight: "กำจัดขนได้ทุกจุดโดยไม่เจ็บ ผิวเรียบเนียนทันทีหลังใช้",
    reason: "ราคาคุ้มมาก ลดกว่า 50% จากของแท้ 100% ใช้ได้ทุกจุดบนร่างกาย"
  },
  {
    id: 2,
    title: "VENITA ครีมกันแดด + โทนเนอร์ Anti-Acne Pore Tightening 150ml",
    price: 330,
    originalPrice: null,
    image: "a/2.jpg",
    url: "https://s.shopee.co.th/4fuVTosFwp",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "กันแดด + บำรุงในชุดเดียว ปกป้องผิวจากรังสี UV พร้อมลดสิว",
    reason: "คุ้มค่าเพราะได้ทั้งกันแดดและโทนเนอร์บำรุงผิวในราคาเดียว"
  },
  {
    id: 3,
    title: "FEALI ครีมกันแดด UV Serum Sunscreen SPF50+ PA+++ (ซื้อ 2 แถม 2)",
    price: 250,
    originalPrice: null,
    image: "a/3.png",
    url: "https://s.shopee.co.th/6VM9feDQUW",
    category: "beauty",
    tags: ["promo", "hot"],
    clicks: 0,
    highlight: "โปรโมชั่นซื้อ 2 แถม 2 ได้ถึง 4 ชิ้น เนื้อ serum ดูดซึมไว",
    reason: "โปรแรงมาก ได้ 4 ชิ้นในราคา 250 บาท คุ้มสุดๆ"
  },
  {
    id: 4,
    title: "KOTA KERATIN TREATMENT ทรีทเม้นท์เคราติน บำรุงเข้มข้น ผมนุ่มลื่น",
    price: 139,
    originalPrice: null,
    image: "a/4.png",
    url: "https://s.shopee.co.th/1BKdKjOiCS",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "ทรีทเม้นท์เคราตินเข้มข้น กลิ่นหอม ลดการหลุดร่วงของเส้นผม",
    reason: "ราคาไม่ถึง 140 บาท ได้ทรีทเม้นท์ระดับซาลอน"
  },
  {
    id: 5,
    title: "Hydrating Mineral Sunscreen Face SPF50 75ml กันแดดมิเนอรัลผิวหน้า",
    price: 189,
    originalPrice: null,
    image: "a/5.png",
    url: "https://s.shopee.co.th/7AbqTtUC1u",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "กันแดดมิเนอรัลเนื้อบางเบา ไม่อุดตัน ใช้ได้กับผิวแพ้ง่าย",
    reason: "กันแดดมิเนอรัลปลอดภัยสำหรับผิวแพ้ง่าย ราคาเข้าถึงได้"
  },
  {
    id: 6,
    title: "CLEAR NOSE UV Sun Serum SPF50+ PA++++ Sun Booster 80ml",
    price: 350,
    originalPrice: null,
    image: "a/6.png",
    url: "https://s.shopee.co.th/111D9RyfWv",
    category: "beauty",
    tags: ["commission"],
    clicks: 0,
    highlight: "SPF50+ PA++++ ป้องกันสูงสุด เนื้อ serum บางเบาไม่เหนียวเหนอะหนะ",
    reason: "PA++++ ป้องกันแสง UV สูงสุด คุ้มกับราคาที่จ่าย"
  },
  {
    id: 7,
    title: "ครีมอาบน้ำผิวขาว ครีมอาบน้ำนมแพะ สบู่ตัวขาว 800ml",
    price: 299,
    originalPrice: 1049,
    image: "a/7.png",
    url: "https://s.shopee.co.th/1Le3YDxtji",
    category: "beauty",
    tags: ["hot", "promo"],
    clicks: 0,
    highlight: "ลดราคาจาก 1,049 บาท เหลือ 299 บาท ขวดใหญ่ 800ml คุ้มมาก",
    reason: "ลดราคาเกิน 70% ขวดใหญ่ใช้ได้นาน คุ้มสุดๆ"
  },
  {
    id: 8,
    title: "POPASKIN 577 + 377 Brightening Serum เซรั่มผิวขาว ลดรอยสิว จุดด่างดำ",
    price: 499,
    originalPrice: null,
    image: "a/8.png",
    url: "https://s.shopee.co.th/20tkLs2O4s",
    category: "beauty",
    tags: ["hot"],
    clicks: 0,
    highlight: "สูตร 577+377 ระดับพรีเมียม ลดฝ้า กระ จุดด่างดำ ได้อย่างเห็นผล",
    reason: "ส่วนผสมคุณภาพสูง ราคาคุ้มเมื่อเทียบกับแบรนด์ระดับเดียวกัน"
  },
  {
    id: 9,
    title: "Charmiss Paradise Island UV Body Serum SPF50+ PA++++ โทนอัพผิว",
    price: 249,
    originalPrice: null,
    image: "a/9.png",
    url: "https://s.shopee.co.th/8AUNhVbdV0",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "กันแดดสำหรับผิวกาย โทนอัพผิวให้ขาวกระจ่างใสทันที",
    reason: "กันได้ทั้งแดดพร้อมโทนอัพผิวไปในตัว เหมาะกับหน้าร้อนไทย"
  },
  {
    id: 10,
    title: "สบู่ลูกพลับญี่ปุ่น Balansy 30+ ลดกลิ่นตัวแรง กลิ่นคนแก่",
    price: 439,
    originalPrice: null,
    image: "a/10.png",
    url: "https://s.shopee.co.th/6AjJMh4twI",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "สูตรลูกพลับญี่ปุ่น pH5 กำจัดกลิ่นตัวแรง กลิ่นฮอร์โมน",
    reason: "สินค้านวัตกรรมจากญี่ปุ่น แก้ปัญหากลิ่นตัวได้อย่างตรงจุด"
  },
  {
    id: 11,
    title: "Extra care Shampoo and Conditioner แชมพูและครีมนวดผม",
    price: 460,
    originalPrice: null,
    image: "a/11.png",
    url: "https://s.shopee.co.th/4qDvxKIJF4",
    category: "beauty",
    tags: [],
    clicks: 0,
    highlight: "เซ็ตแชมพูและครีมนวดสูตร Extra care บำรุงเส้นผมให้แข็งแรง",
    reason: "ได้ทั้งแชมพูและครีมนวดในราคาเดียว คุ้มกว่าซื้อแยก"
  },
  {
    id: 12,
    title: "Merrezca Moisture Lip Oil ลิปออยล์ ฉ่ำโกลว์ บำรุงริมฝีปาก",
    price: 249,
    originalPrice: null,
    image: "a/12.png",
    url: "https://s.shopee.co.th/9pcbuj2LG3",
    category: "beauty",
    tags: ["hot"],
    clicks: 0,
    highlight: "ลิปออยล์เนื้อฉ่ำ ให้ริมฝีปากชุ่มชื้น เงางาม ดูสุขภาพดี",
    reason: "สินค้าขายดี ราคาคุ้ม เหมาะสำหรับใช้ทุกวัน"
  },
  {
    id: 13,
    title: "DEOdore ครีมอาบน้ำลดสิวแผ่นหลัง สูตรลดรอย สิว (2 ขวด แถม 2 ขวด)",
    price: 598,
    originalPrice: null,
    image: "a/13.png",
    url: "https://s.shopee.co.th/8fQeWnsfjM",
    category: "beauty",
    tags: ["promo"],
    clicks: 0,
    highlight: "โปรซื้อ 2 แถม 2 สูตรลดสิวแผ่นหลังโดยเฉพาะ",
    reason: "โปรคุ้มมาก ได้ 4 ขวดในราคา 598 บาท เฉลี่ยขวดละไม่ถึง 150"
  },
  {
    id: 14,
    title: "DEOdore Cream Brightening ครีมอาบน้ำลดสิวแผ่นหลัง สูตรลดรอย",
    price: 777,
    originalPrice: null,
    image: "a/14.png",
    url: "https://s.shopee.co.th/7fY7L7KgYl",
    category: "beauty",
    tags: [],
    clicks: 0,
    highlight: "สูตร Brightening ลดสิวแผ่นหลังพร้อมจางรอยสิว",
    reason: "แก้ปัญหาสิวแผ่นหลังและรอยสิวไปในตัว"
  },
  {
    id: 15,
    title: "APEX-SX WHITE UP CREAM ครีมทารักแร้ขาว โดยแพทย์ผิวหนัง",
    price: 990,
    originalPrice: null,
    image: "a/15.png",
    url: "https://s.shopee.co.th/8V7EL311MY",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "ผลิตโดยแพทย์ผิวหนัง ใช้ทารักแร้ ขาหนีบ แก้มก้น ให้ขาวขึ้น",
    reason: "พัฒนาโดยแพทย์ผิวหนัง มั่นใจได้ในความปลอดภัย"
  },
  {
    id: 16,
    title: "Balansy 30+ บอดี้สเปรย์ลดกลิ่นตัวแรง กำจัดทุกกลิ่นกาย",
    price: 469,
    originalPrice: null,
    image: "a/16.png",
    url: "https://s.shopee.co.th/1BKdbjpurN",
    category: "beauty",
    tags: [],
    clicks: 0,
    highlight: "สเปรย์ลดกลิ่นตัวจากลูกพลับญี่ปุ่น pH4 ใช้ได้ทุกเพศ ทุกวัย",
    reason: "นวัตกรรมจากญี่ปุ่น ใช้ง่ายสเปรย์ได้เลย ไม่ต้องอาบ"
  },
  {
    id: 17,
    title: "APEX-SX FEMM SERUM เซรั่มบำรุงผิวจุดซ่อนเร้น 50ml",
    price: 1490,
    originalPrice: null,
    image: "a/17.png",
    url: "https://s.shopee.co.th/4AyFBM6Fc5",
    category: "beauty",
    tags: ["commission"],
    clicks: 0,
    highlight: "เซรั่มบำรุงผิวจุดซ่อนเร้น ให้สุขภาพดีและสวยงาม",
    reason: "สินค้าเฉพาะทางคุณภาพสูง ดูแลผิวจุดซ่อนเร้นอย่างถูกวิธี"
  },
  {
    id: 18,
    title: "Eucerin SPOTLESS THIAMIDOL BOOSTER SERUM 30ml",
    price: 2250,
    originalPrice: null,
    image: "a/18.png",
    url: "https://s.shopee.co.th/9AMvAQOVFW",
    category: "beauty",
    tags: ["commission"],
    clicks: 0,
    highlight: "เซรั่ม Thiamidol จาก Eucerin ลดจุดด่างดำ ฝ้า กระ อย่างมีประสิทธิภาพ",
    reason: "แบรนด์ระดับพรีเมียมจากเยอรมนี Thiamidol สารลดฝ้าชั้นนำของโลก"
  },
  {
    id: 19,
    title: "Banala Lite อุปกรณ์ช่วยนอนหลับ คลื่นเสียงอัจฉริยะ",
    price: 1790,
    originalPrice: null,
    image: "a/19.png",
    url: "https://s.shopee.co.th/4Vb5bxPgxE",
    category: "home",
    tags: ["recommend"],
    clicks: 0,
    highlight: "นวัตกรรมคลื่นเสียงอัจฉริยะ ช่วยให้หลับง่าย หลับลึก ตื่นสดชื่น",
    reason: "ใครนอนยากต้องลอง คลื่นเสียงช่วยให้สมองผ่อนคลาย หลับลึกขึ้น"
  },
  {
    id: 20,
    title: "ANCHI Electric Bike จักรยานไฟฟ้า 580W แบตเตอรี่นาน ปลอดภัย",
    price: 9298,
    originalPrice: 10458,
    image: "a/20.png",
    url: "https://s.shopee.co.th/7VEhBd6enC",
    category: "auto",
    tags: ["hot"],
    clicks: 0,
    highlight: "จักรยานไฟฟ้า 580W วิ่งได้ไกล แบตเตอรี่นาน เหมาะสำหรับทุกคน",
    reason: "ลดราคาจาก 10,458 บาท ประหยัดกว่า 1,000 บาท คุ้มค่า"
  },
  {
    id: 21,
    title: "NIVEA Luminous630 Skin Glow Serum เซรั่มผิวใส 30ml (2 ชิ้น)",
    price: 892,
    originalPrice: null,
    image: "a/21.png",
    url: "https://s.shopee.co.th/6pz0ObEJcc",
    category: "beauty",
    tags: ["hot"],
    clicks: 0,
    highlight: "เซรั่ม NIVEA สูตร Luminous630 ลดจุดด่างดำ เห็นผลใน 2 สัปดาห์",
    reason: "สินค้าขายดีของ NIVEA ได้ 2 ชิ้นในราคาคุ้ม"
  },
  {
    id: 22,
    title: "หัวเชื้อแมวมิ้น แมวดำ / วีไอพี",
    price: 590,
    originalPrice: null,
    image: "a/22.png",
    url: "https://s.shopee.co.th/7fY8UlAdvf",
    category: "home",
    tags: [],
    clicks: 0,
    highlight: "หัวเชื้อแมวมิ้น สูตรพรีเมียม สำหรับผู้ที่ชื่นชอบความหอมเฉพาะตัว",
    reason: "สินค้าเอกลักษณ์เฉพาะตัว กลิ่นหอมติดทน"
  },
  {
    id: 23,
    title: "Eucerin pH5 Shower Oil 400ml ออยล์อาบน้ำสำหรับผิวแห้งมาก",
    price: 718,
    originalPrice: null,
    image: "a/23.png",
    url: "https://s.shopee.co.th/1BKelV0cp0",
    category: "beauty",
    tags: [],
    clicks: 0,
    highlight: "ออยล์อาบน้ำ pH5 สำหรับผิวแห้งมาก ไม่ทำให้ผิวตึงหลังอาบ",
    reason: "Eucerin แบรนด์ Dermatological ที่ไว้ใจได้ ขวดใหญ่ 400ml คุ้ม"
  },
  {
    id: 24,
    title: "MizuMi UV Water Serum SPF50+ PA+++ เซรั่มกันแดด No.1 Best Selling",
    price: 800,
    originalPrice: null,
    image: "a/24.png",
    url: "https://s.shopee.co.th/LlXmDAwBk",
    category: "beauty",
    tags: ["hot"],
    clicks: 0,
    highlight: "กันแดดขายดีอันดับ 1 จาก MizuMi เนื้อ Water Serum บางเบา",
    reason: "ขายดีอันดับ 1 ในญี่ปุ่น พิสูจน์แล้วว่าดีจริง"
  },
  {
    id: 25,
    title: "Adidas Adizero Evo SL รองเท้าวิ่ง 2026 KI7354",
    price: 4382,
    originalPrice: null,
    image: "a/25.png",
    url: "https://s.shopee.co.th/9AMwIismjG",
    category: "fashion",
    tags: ["recommend"],
    clicks: 0,
    highlight: "รองเท้าวิ่ง Adidas Adizero รุ่น 2026 น้ำหนักเบา วิ่งสบาย",
    reason: "รองเท้าวิ่งระดับแข่งจาก Adidas เทคโนโลยีล่าสุด"
  },
  {
    id: 26,
    title: "GARNIER Micellar Cleansing Water ฝาชมพู เซนซีทีฟ 400ml",
    price: 529,
    originalPrice: null,
    image: "a/26.png",
    url: "https://s.shopee.co.th/2qSslYre9S",
    category: "beauty",
    tags: [],
    clicks: 0,
    highlight: "ไมเซล่าวอเตอร์สูตรเซนซีทีฟ ลบเครื่องสำอางและทำความสะอาดผิว",
    reason: "Garnier แบรนด์ที่ทุกคนรู้จัก ราคาถูก คุณภาพดี"
  },
  {
    id: 27,
    title: "MizuMi Dry Rescue Intense Melt-In Cream 45ml มอยส์เจอร์ไรเซอร์ผิวแห้ง",
    price: 379,
    originalPrice: null,
    image: "a/27.png",
    url: "https://s.shopee.co.th/8AUP7xJlv8",
    category: "beauty",
    tags: [],
    clicks: 0,
    highlight: "ครีมบำรุงผิวแห้งมาก เนื้อ melt-in ดูดซึมไว ไม่เหนอะหนะ",
    reason: "เหมาะกับผิวแห้งมากโดยเฉพาะ ให้ความชุ่มชื้นสูง"
  },
  {
    id: 28,
    title: "Neutrogena Rainbath Shower Gel 473ml x2 เจลอาบน้ำเรนบาธ",
    price: 690,
    originalPrice: null,
    image: "a/28.png",
    url: "https://s.shopee.co.th/8AUP86Fiwk",
    category: "beauty",
    tags: [],
    clicks: 0,
    highlight: "เจลอาบน้ำกลิ่นหอมสดชื่น ขวดใหญ่ 473ml ได้ 2 ขวด",
    reason: "ได้ 2 ขวดใหญ่ในราคา 690 บาท เฉลี่ยขวดละ 345 บาท"
  },
  {
    id: 29,
    title: "Bioderma Sensibio H2O ไมเซล่าคลีนซิ่งวอเตอร์ 500ml 2 ขวด",
    price: 1589,
    originalPrice: null,
    image: "a/29.png",
    url: "https://s.shopee.co.th/6ffbLVtToV",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "ไมเซล่าวอเตอร์ของ Bioderma สำหรับผิวแพ้ง่าย ขวดใหญ่ 500ml",
    reason: "Bioderma เป็นแบรนด์ Dermatological ที่แพทย์แนะนำ"
  },
  {
    id: 30,
    title: "Neutrogena Body Oil Light Sesame 250ml x2 ออยล์บำรุงผิว",
    price: 1045,
    originalPrice: null,
    image: "a/30.png",
    url: "https://s.shopee.co.th/7AbrwYXVC5",
    category: "beauty",
    tags: [],
    clicks: 0,
    highlight: "ออยล์บำรุงผิวกายสูตร Light Sesame บำรุงผิวแห้ง ไม่เหนียว",
    reason: "ได้ 2 ขวด บำรุงผิวกายให้เนียนนุ่ม"
  },
  {
    id: 31,
    title: "ANCHI จักรยานไฟฟ้า รถไฟฟ้า",
    price: 6908,
    originalPrice: null,
    image: "a/31.png",
    url: "https://s.shopee.co.th/7VFA5YIbtl",
    category: "auto",
    tags: [],
    clicks: 0,
    highlight: "48V12A electric-bicycle",
    reason: "มีกระจกมองหลัง ไฟเลี้ยว แบตเตอรี่ 4ก้..."
  },
  {
    id: 32,
    title: "XUTI A60/PRO",
    price: 26490,
    originalPrice: null,
    image: "a/32.png",
    url: "https://s.shopee.co.th/5ArFJzafzC",
    category: "home",
    tags: [],
    clicks: 0,
    highlight: "เก้าอี้นวด มาพร้อมราง SL",
    reason: "เก้าอี้นวด อัตโนมัติ รีโมทคอนโทรลบลูทูธในตัว สีขาวสีแดงสีดำ"
  },
  {
    id: 33,
    title: "DUNLOP ยางรถยนต์รถเก๋งกระบะ",
    price: 18930,
    originalPrice: null,
    image: "a/33.png",
    url: "https://s.shopee.co.th/BSZNCVnIv",
    category: "auto",
    tags: [],
    clicks: 0,
    highlight: "SUV ขอบ 14-17 นิ้ว จำนวน 4 เส้น",
    reason: "ปี 2026 + ฟรี!! จับลมยางแท้ Premier"
  },
  {
    id: 34,
    title: "REAIM ปั๊มลม 30",
    price: 2419,
    originalPrice: null,
    image: "a/34.png",
    url: "https://s.shopee.co.th/2VqU9mJDOt",
    category: "home",
    tags: [],
    clicks: 0,
    highlight: "ลิตร ปั๊มลมออยฟรี 1500W",
    reason: "มอเตอร์คู่ปั๊ม ลมออยล์ฟรีAir Compressors ปั๊มลมพกพ"
  },
  {
    id: 35,
    title: "กิจธนบุรี โดย กิจรุ่งเรืองธนบุรี",
    price: 61500,
    originalPrice: null,
    image: "a/35.png",
    url: "https://s.shopee.co.th/6fg37k9Z4z",
    category: "auto",
    tags: [],
    clicks: 0,
    highlight: "Honda Scoopy Prestige กุญแจ",
    reason: "ธรรมดา 2026 110cc ออโต้"
  },
  {
    id: 36,
    title: "เก้าอี้ออฟฟิศเอนหลังได้",
    price: 1479,
    originalPrice: null,
    image: "a/36.png",
    url: "https://s.shopee.co.th/3LPbDulxrO",
    category: "home",
    tags: [],
    clicks: 0,
    highlight: "เก้าอี้ทำงาน สำหรับผู้บริหาร",
    reason: "มีระบบ นวด แข็งแรงทนทาน Office chair"
  },
  {
    id: 37,
    title: "จักรยาน26นิ้วสำหรับผู้",
    price: 2055,
    originalPrice: null,
    image: "a/37.png",
    url: "https://s.shopee.co.th/8AUqzA5Hrq",
    category: "auto",
    tags: [],
    clicks: 0,
    highlight: "หญิงสำหรับพนักงานออฟฟิศ พร็อพจักรยานเบาะนั่",
    reason: "งสบายพร้อมตะกร้าจักรยานแม่บ้านรุ่น"
  },
  {
    id: 38,
    title: "NEW 2025 TCL ทีวี 55 นิ้ว",
    price: 16658,
    originalPrice: null,
    image: "a/38.png",
    url: "https://s.shopee.co.th/199GSOInR",
    category: "tech",
    tags: [],
    clicks: 0,
    highlight: "4K QLED Google TV รุ่น",
    reason: "55T6C HVA Panel ภาพสีสดสมจริง"
  },
  {
    id: 39,
    title: "เครื่องตัดหญ้า 2 จังหวะ Robin 40.2ซีซี",
    price: 3200,
    originalPrice: null,
    image: "a/39.png",
    url: "https://s.shopee.co.th/3B6B2askwo",
    category: "home",
    tags: [],
    clicks: 0,
    highlight: "รุ่นNB411 2T สะพายข้าง ราคาถูก สตาร์ทติดง่าย ตัดหญ้า",
    reason: "☺️"
  },
  {
    id: 40,
    title: "• พร้อมส่งด่วน ราคาดีที่สุด",
    price: 6390,
    originalPrice: null,
    image: "a/40.png",
    url: "https://s.shopee.co.th/8fR7aycm96",
    category: "fashion",
    tags: [],
    clicks: 0,
    highlight: "ADIDAS ADIZERO EVO SL",
    reason: "รับประกันของแท้ 100% ออกใบกำกับภาษีได้ ลดเยอะ..."
  },
  {
    id: 41,
    title: "ล้อโตสุดเท่ห์!!!! จักรยานเสือภูเขา ล้อโต 26 x4.0 ",
    price: 7290,
    originalPrice: null,
    image: "a/41.png",
    url: "https://s.shopee.co.th/903xzneR4p",
    category: "auto",
    tags: [],
    clicks: 0,
    highlight: "เฟรมเหล็ก ไฮเอ็นท์ จักรยานล้อโต มีโช้คกลางรองรับน้ำหนักได้เยอะ",
    reason: "🥰"
  },
  {
    id: 42,
    title: "แอร์ผนัง HAIER HSU-18VQEC03T 18000 บีทียู อินเวอร์ เตอร์",
    price: 29900,
    originalPrice: null,
    image: "a/42.png",
    url: "https://s.shopee.co.th/AKZMKRROoj",
    category: "home",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "100%"
  },
  {
    id: 43,
    title: "KANTO เลื่อยยนต์ / เลื่อยโซ่ 11.5 นิ้ว 2 จังหวะ แรงม้า 0.8 HP ระบบปั๊มน้ำมัน รุ่น KT-CS2000E",
    price: 1770,
    originalPrice: null,
    image: "a/43.png",
    url: "https://s.shopee.co.th/9Kgp8pYYaE",
    category: "home",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "100%"
  },
  {
    id: 44,
    title: "Imou Cruiser Dual 10MP (5MP + 5MP) พูดคุยโต้ตอบ ได้ สามารถตั้งค่าภาพสี24ชม. เลนส์ 3.6mm รับประกัน 2 ปี",
    price: 2149,
    originalPrice: null,
    image: "a/44.png",
    url: "https://s.shopee.co.th/9Kgp8xzR5O",
    category: "tech",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "100%"
  },
  {
    id: 45,
    title: "ATV ไฟฟ้า ส่งจากไทย พร้อมเล่น ขับง่าย ใช้ง่าย สำหรับเด็ก โต รับน้ำหนักได้120kg ขนของได้เยอะ",
    price: 12590,
    originalPrice: null,
    image: "a/45.png",
    url: "https://s.shopee.co.th/50XpzGEHVH",
    category: "auto",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 46,
    title: "TCL ตู้เย็น 4 ประตู ขนาด 14.1Q 400 ลิตรรุ่น RT43GPCDB/RT43MPCDG พร้อมแผงควบคุมระบบดิจิตอ...",
    price: 17590,
    originalPrice: null,
    image: "a/46.png",
    url: "https://s.shopee.co.th/4qEPn7oXhN",
    category: "home",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 47,
    title: "LION-LNE6720 แถมชุดผ้าใบกันน้ำฝนฟรี รถไฟฟ้า3ล้อมี หลังคามีกล้องหลัง มอเตอร์1500 วัตต์",
    price: 49900,
    originalPrice: null,
    image: "a/47.png",
    url: "https://s.shopee.co.th/3B6BoGHoUB",
    category: "auto",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 48,
    title: "HONOR 600 Pro (12+512GB) โทรศัพท์มือถือ กล้อง 200MP | ชิปเซ็ต Snapdragon 8 Elite | ชาร์จไว ...",
    price: 28999,
    originalPrice: null,
    image: "a/48.png",
    url: "https://s.shopee.co.th/Lm0UuELQS",
    category: "tech",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 49,
    title: "XIAOMI 17 Ultra (16+512GB) White - A0179701",
    price: 46519,
    originalPrice: null,
    image: "a/49.png",
    url: "https://s.shopee.co.th/3Vj2GqHxE0",
    category: "tech",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 50,
    title: "Samsung Galaxy S25+ 5G Ram12/256GB สินค้าใหม่ เครื่องศูนย์ซัมซุง รับประกันศูนย์ทุกสาขา",
    price: 31500,
    originalPrice: null,
    image: "a/50.png",
    url: "https://s.shopee.co.th/70IuROODIP",
    category: "tech",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 51,
    title: "OPPO Find X9s (12+256G) | โทรศัพท์มือถือ ออป โป้ ดีไซน์สวย กล้อง Hasselblad 3ตัว 50MP ซูมไกล120x",
    price: 29999,
    originalPrice: null,
    image: "a/51.png",
    url: "https://s.shopee.co.th/3B6BsWfmu3",
    category: "tech",
    tags: [],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 52,
    title: "HP VICTUS i5-13420H RTX 3050 16GB 512GB FHD IPS 144 Hz | 1Yrs | 15-fa2187TX โน๊ตบุ๊ค",
    price: 444449,
    originalPrice: null,
    image: "a/52.png",
    url: "https://s.shopee.co.th/7fYbMYjfaD",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 53,
    title: "HyperX OMEN AMD Ryzen 5 240 RTX 5050",
    price: 39390,
    originalPrice: null,
    image: "a/53.png",
    url: "https://s.shopee.co.th/9fJfkW0KVq",
    category: "beauty",
    tags: ["promo", "hot"],
    clicks: 0,
    highlight: "16GB/1TB 13.3 2K 165Hz ",
    reason: "Win11+MS24 2Yrs 15-g..."
  },
  {
    id: 54,
    title: "HONOR Pad X7 LTE (4+128GB) แท็บเล็ตมินิจอใหญ่8.7 นิ้ว",
    price: 4899,
    originalPrice: null,
    image: "a/54.png",
    url: "https://s.shopee.co.th/903yxaZ7q7",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "รองรับการใส่ซิม โทรออกได้",
    reason: "บาง 7.99 มม."
  },
  {
    id: 55,
    title: "NEW แล็ปท็อปใหม่ 14.1 นิ้ว HD Intel Core 2.9GHz Notebook 16GB+1TB โน๊ตบุ๊คLaptops เกม ธุรกิจ",
    price: 7878,
    originalPrice: null,
    image: "a/55.png",
    url: "https://s.shopee.co.th/903yzXiPGk",
    category: "beauty",
    tags: ["recommend"],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 56,
    title: "NOTEBOOK (โน๊ตบุ๊ค) ACER NITRO V15ANV15-52-73BK Ci7-13620H/16GB DDR5/512GB SSD/...",
    price: 37800,
    originalPrice: null,
    image: "a/56.png",
    url: "https://s.shopee.co.th/6fg4DO64Ls",
    category: "beauty",
    tags: ["commission"],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 57,
    title: "ASUS TUF Gaming F15 Core i9-11900H RTX3070 เลือกสเปคได้ โน้ตบุ๊คเกมมิ่ง มือสอง",
    price: 35990,
    originalPrice: 1049,
    image: "a/57.png",
    url: "https://s.shopee.co.th/2BDerKQkSq",
    category: "beauty",
    tags: ["hot", "promo"],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  },
  {
    id: 58,
    title: "คอมพิวเตอร์ ครบชุด Core-i7 /GTX 1060 6Gb /Ram 16Gb ทำงาน-เล่นเกมส์ Pubg, Freefire,Varolant,GTA V",
    price: 12682,
    originalPrice: null,
    image: "a/58.png",
    url: "https://s.shopee.co.th/50XqEiEt5Q",
    category: "beauty",
    tags: ["hot"],
    clicks: 0,
    highlight: "😊",
    reason: "💯"
  }
];

// ============ TAG DEFINITIONS ============
const tagConfig = {
  hot:       { label: "🔥 ขายดี",    color: "#e74c3c", bg: "#fde8e8" },
  promo:     { label: "💥 โปรแรง",    color: "#e67e22", bg: "#fef0e0" },
  recommend: { label: "⭐ แนะนำ",    color: "#27ae60", bg: "#e8f8f0" },
  commission:{ label: "💰 ค่าคอมดี",  color: "#8e44ad", bg: "#f3e5f5" }
};

const catNames = {
  all: "ทั้งหมด",
  beauty: "💄 ความงาม",
  fashion: "👕 แฟชั่น",
  tech: "📱 ไอที",
  home: "🏠 ของใช้",
  auto: "🚗 ยานยนต์"
};

// ============ STATE ============
let currentCategory = "all";
let currentSort = "latest";
let searchQuery = "";
let clickCounts = {};

// Load click counts from localStorage
try {
  const saved = localStorage.getItem("productlink_clicks");
  if (saved) clickCounts = JSON.parse(saved);
} catch(e) {}

// ============ HELPER FUNCTIONS ============
function extractPriceNum(price) {
  const match = price.match(/[\d,]+/);
  return match ? parseFloat(match[0].replace(/,/g, "")) : 0;
}

function getClicks(id) {
  return clickCounts[id] || 0;
}

function addClick(id) {
  clickCounts[id] = (clickCounts[id] || 0) + 1;
  try { localStorage.setItem("productlink_clicks", JSON.stringify(clickCounts)); } catch(e) {}
}

function filterAndSort() {
  let filtered = products;

  // Filter by category
  if (currentCategory !== "all") {
    filtered = filtered.filter(p => p.category === currentCategory);
  }

  // Filter by search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.highlight.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Sort
  switch (currentSort) {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "clicks":
      filtered.sort((a, b) => getClicks(b.id) - getClicks(a.id));
      break;
    case "popular":
      filtered.sort((a, b) => (getClicks(b.id) + (b.tags.includes("hot") ? 10 : 0)) - (getClicks(a.id) + (a.tags.includes("hot") ? 10 : 0)));
      break;
    case "latest":
    default:
      filtered.sort((a, b) => b.id - a.id);
      break;
  }

  return filtered;
}

// ============ RENDER ============
function renderProducts(list, highlightId) {
  const container = document.getElementById("ads");
  const info = document.getElementById("resultsInfo");

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>ไม่พบสินค้าที่ตรงตามเงื่อนไข</h3>
        <p>ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่</p>
      </div>`;
    info.textContent = "";
    return;
  }

  info.textContent = `พบ ${list.length} รายการ`;

  container.innerHTML = list.map(p => {
    const clicks = getClicks(p.id);
    const isHighlight = highlightId && p.id === highlightId;
    return `
    <div class="card ${isHighlight ? 'card-highlight' : ''}" data-id="${p.id}">
      <div class="card-image-wrap">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        ${p.tags.length ? `<div class="card-tags">${p.tags.map(t => `<span class="tag" style="color:${tagConfig[t].color};background:${tagConfig[t].bg}">${tagConfig[t].label}</span>`).join("")}</div>` : ""}
        ${clicks > 0 ? `<div class="card-clicks"><span>👁 ${clicks}</span></div>` : ""}
      </div>
      <div class="card-body">
        <div class="card-title">${p.title}</div>
        <div class="card-price">
          <span class="price-current">฿${p.price.toLocaleString()}</span>
          ${p.originalPrice ? `<span class="price-original">฿${p.originalPrice.toLocaleString()}</span>` : ""}
          ${p.originalPrice ? `<span class="price-discount">-${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : ""}
        </div>
        <button class="card-btn" onclick="openDetail(${p.id})">ดูรายละเอียด</button>
      </div>
    </div>`;
  }).join("");
}

// ============ DETAIL MODAL ============
function openDetail(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  addClick(id);

  document.getElementById("modalImage").src = p.image;
  document.getElementById("modalTitle").textContent = p.title;
  document.getElementById("modalPrice").innerHTML = `
    <span class="modal-price-current">฿${p.price.toLocaleString()}</span>
    ${p.originalPrice ? `<span class="modal-price-original">฿${p.originalPrice.toLocaleString()}</span>` : ""}
    ${p.originalPrice ? `<span class="modal-price-discount">ลด ${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : ""}
  `;

  // Tags
  const tagsEl = document.getElementById("modalTags");
  tagsEl.innerHTML = p.tags.length ? p.tags.map(t => `<span class="tag" style="color:${tagConfig[t].color};background:${tagConfig[t].bg}">${tagConfig[t].label}</span>`).join("") : "";

  // Highlights
  const hlEl = document.getElementById("modalHighlights");
  hlEl.innerHTML = p.highlight ? `
    <div class="highlight-section">
      <h4>✨ จุดเด่น</h4>
      <p>${p.highlight}</p>
    </div>` : "";

  // Reason
  const reasonEl = document.getElementById("modalReason");
  reasonEl.innerHTML = p.reason ? `
    <div class="reason-section">
      <h4>💡 ทำไมเราแนะนำ</h4>
      <p>${p.reason}</p>
    </div>` : "";

  // Meta
  document.getElementById("modalClicks").textContent = `👁 ${getClicks(id)} ครั้ง`;
  document.getElementById("modalCat").textContent = catNames[p.category] || p.category;

  // Go button
  const goBtn = document.getElementById("modalGoBtn");
  goBtn.href = p.url;
  goBtn.onclick = function() {
    // Track click before opening
    addClick(id);
  };

  // Show modal
  document.getElementById("modalOverlay").classList.add("active");
  document.body.style.overflow = "hidden";

  // Refresh grid to show updated click count
  refreshGrid();
}

function closeDetail() {
  document.getElementById("modalOverlay").classList.remove("active");
  document.body.style.overflow = "";
}

document.getElementById("modalClose").addEventListener("click", closeDetail);
document.getElementById("modalOverlay").addEventListener("click", function(e) {
  if (e.target === this) closeDetail();
});

// ============ RANDOM ============
document.getElementById("randomBtn").addEventListener("click", function() {
  const pool = filterAndSort();
  if (pool.length === 0) {
    alert("ไม่มีสินค้าให้เลือกสุ่ม");
    return;
  }
  const random = pool[Math.floor(Math.random() * pool.length)];
  openDetail(random.id);
});

// ============ SEARCH ============
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearSearch");

searchInput.addEventListener("input", function() {
  searchQuery = this.value;
  clearBtn.style.display = this.value ? "block" : "none";
  refreshGrid();
});

clearBtn.addEventListener("click", function() {
  searchQuery = "";
  searchInput.value = "";
  clearBtn.style.display = "none";
  searchInput.focus();
  refreshGrid();
});

// ============ SORT ============
document.getElementById("sortSelect").addEventListener("change", function() {
  currentSort = this.value;
  refreshGrid();
});

// ============ CATEGORIES ============
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    currentCategory = this.dataset.cat;
    refreshGrid();
  });
});

// ============ REFRESH ============
function refreshGrid() {
  const filtered = filterAndSort();
  renderProducts(filtered);
}

// ============ INIT ============
refreshGrid();
