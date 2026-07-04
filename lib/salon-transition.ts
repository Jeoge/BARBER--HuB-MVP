export type SalonTransitionType = "inuki" | "succession" | "equipment" | "independent" | "expert";

export type PartnerLabel = "PR" | "Sponsored" | "Partner" | "協賛";

export type SalonTransitionListing = {
  id: string;
  type: SalonTransitionType;
  typeLabel: string;
  title: string;
  area: string;
  station: string;
  summary: string;
  desiredTiming: string;
  isAnonymous: boolean;
  tags: string[];
  imageUrl: string;
  status: string;
  storeInfo: {
    region: string;
    nearestStation: string;
    yearsOpen: string;
    seats: string;
    shampooUnits: string;
    size: string;
    rentGuide: string;
    tenantType: string;
    landlordConsentStatus: string;
    healthCenterStatus: string;
  };
  equipment: string[];
  conditions: string[];
};

export type SalonTransitionPartner = {
  id: string;
  title: string;
  label: PartnerLabel;
  role: string;
  description: string;
  href: string;
};

export const salonTransitionNotice = [
  "BARBER HUBは、理容室の開業・承継・居抜き・備品譲渡に関する情報掲載と問い合わせ導線を提供するプラットフォームです。",
  "不動産の売買・賃貸借の媒介、契約交渉、重要事項説明、契約締結の代理は行いません。",
  "テナント契約や物件に関する手続きは、貸主・管理会社・宅地建物取引業者等にご確認ください。",
  "事業譲渡、設備譲渡、顧客引き継ぎ、雇用、税務、法務については、必要に応じて専門家へご相談ください。",
  "この文言はMVP用の仮文章です。正式公開前に専門家確認のうえ内容を確認・更新します。",
];

export const transitionCategories = [
  {
    id: "inuki",
    title: "居抜き・テナント",
    target: "閉店前に設備や内装を活かして次の人へつなぎたいサロン、居抜きで独立したい理容師。",
    body: "テナント契約や貸主承諾が必要になる場合があります。BARBER HUBは情報掲載のみを行い、賃貸借契約の仲介は行いません。",
  },
  {
    id: "succession",
    title: "事業承継",
    target: "後継者がいない、常連客や屋号を引き継ぎたい、地域の理容室を残したいオーナー。",
    body: "顧客、屋号、設備、営業権、スタッフなどを含む承継は、税務・法務・契約面の確認が必要です。必要に応じて専門家へご相談ください。",
  },
  {
    id: "equipment",
    title: "備品・設備譲渡",
    target: "理容椅子、鏡、バリカン、シャンプー台、タオルウォーマーなどを譲りたい人、開業準備中の人。",
    body: "BARBER HUBは備品売買の決済・配送・保証は行いません。譲渡条件、状態確認、受け渡し方法は当事者間で確認してください。",
  },
  {
    id: "independent",
    title: "独立希望",
    target: "居抜き物件、備品譲渡、事業承継という選択肢も見ながら独立準備を進めたい理容師。",
    body: "ゼロから開業する前に、居抜き・設備譲渡・事業承継という選択肢もあります。",
  },
  {
    id: "expert",
    title: "専門家・相談先",
    target: "宅建業者、税理士、行政書士、弁護士、事業承継支援機関、ディーラー、内装業者、保険会社など。",
    body: "契約、税務、法務、不動産、設備、保険の確認は専門家へ相談してください。",
  },
];

export const salonTransitionListings: SalonTransitionListing[] = [
  {
    id: "fukuoka-nishi-inuki-001",
    type: "inuki",
    typeLabel: "居抜き・テナント",
    title: "福岡市西区の理容室、居抜き相談",
    area: "福岡県 福岡市西区",
    station: "駅徒歩3分",
    summary: "一人営業サロン。セット面2席、シャンプー台1台。閉店時期に合わせて、設備ごと引き継ぎ相談。",
    desiredTiming: "6か月以内",
    isAnonymous: true,
    tags: ["居抜き", "一人営業", "駅近", "設備あり", "匿名相談"],
    imageUrl: "/images/shop-interior.jpg",
    status: "掲載中",
    storeInfo: {
      region: "福岡県 福岡市西区",
      nearestStation: "駅徒歩3分",
      yearsOpen: "12年",
      seats: "2席",
      shampooUnits: "1台",
      size: "約16坪",
      rentGuide: "要確認",
      tenantType: "テナント",
      landlordConsentStatus: "未確認",
      healthCenterStatus: "未確認",
    },
    equipment: ["セット椅子", "鏡", "シャンプー台", "タオルウォーマー", "ワゴン", "消毒設備"],
    conditions: ["閉店時期に合わせて相談", "設備ごとの引き継ぎ希望", "貸主承諾は今後確認"],
  },
  {
    id: "regional-salon-succession-001",
    type: "succession",
    typeLabel: "事業承継",
    title: "地域密着サロンの承継相談",
    area: "佐賀県 鳥栖市",
    station: "住宅地エリア",
    summary: "常連客が多いメンズサロン。後継者不在のため、将来的な承継先を探しています。",
    desiredTiming: "1年以内に相談開始",
    isAnonymous: true,
    tags: ["事業承継", "顧客引き継ぎ相談", "屋号相談", "地域密着"],
    imageUrl: "/images/shop-interior.jpg",
    status: "相談受付中",
    storeInfo: {
      region: "佐賀県 鳥栖市",
      nearestStation: "最寄駅から車で8分",
      yearsOpen: "28年",
      seats: "3席",
      shampooUnits: "2台",
      size: "約22坪",
      rentGuide: "要確認",
      tenantType: "自己所有",
      landlordConsentStatus: "該当なし",
      healthCenterStatus: "専門家確認予定",
    },
    equipment: ["セット椅子", "シャンプー台", "鏡", "タオルウォーマー", "消毒設備"],
    conditions: ["屋号引き継ぎ相談可", "顧客引き継ぎは段階的に相談", "税務・法務確認が必要"],
  },
  {
    id: "equipment-transfer-001",
    type: "equipment",
    typeLabel: "備品・設備譲渡",
    title: "理容椅子・鏡・タオルウォーマー譲渡予定",
    area: "熊本県 熊本市",
    station: "市電沿線",
    summary: "閉店に伴い、使用中の備品をまとめて譲渡希望。状態確認・受け渡し方法は個別相談。",
    desiredTiming: "3か月以内",
    isAnonymous: false,
    tags: ["備品譲渡", "設備譲渡", "開業準備", "引退予定"],
    imageUrl: "/images/tools-stilllife.jpg",
    status: "準備中",
    storeInfo: {
      region: "熊本県 熊本市",
      nearestStation: "市電沿線",
      yearsOpen: "18年",
      seats: "2席",
      shampooUnits: "1台",
      size: "約14坪",
      rentGuide: "対象外",
      tenantType: "テナント",
      landlordConsentStatus: "設備撤去は確認予定",
      healthCenterStatus: "対象外",
    },
    equipment: ["理容椅子", "鏡", "タオルウォーマー", "ワゴン", "バリカン", "シザー"],
    conditions: ["まとめて譲渡優先", "状態確認必須", "配送・保証は当事者間で確認"],
  },
  {
    id: "fukuoka-independent-001",
    type: "independent",
    typeLabel: "独立希望",
    title: "福岡市内で居抜き開業を検討中",
    area: "福岡県 福岡市",
    station: "地下鉄沿線希望",
    summary: "理容師歴10年。メンズ特化サロンで独立希望。居抜き、設備譲渡、承継案件を探しています。",
    desiredTiming: "1年以内",
    isAnonymous: true,
    tags: ["独立希望", "居抜き希望", "福岡", "メンズ特化"],
    imageUrl: "/images/fade-cut.jpg",
    status: "相談受付中",
    storeInfo: {
      region: "福岡県 福岡市",
      nearestStation: "地下鉄沿線希望",
      yearsOpen: "理容師歴10年",
      seats: "1から2席希望",
      shampooUnits: "1台希望",
      size: "10から18坪希望",
      rentGuide: "要相談",
      tenantType: "テナント希望",
      landlordConsentStatus: "物件ごとに確認",
      healthCenterStatus: "開業時に確認予定",
    },
    equipment: ["セット椅子", "シャンプー台", "鏡", "タオルウォーマー", "バリカン"],
    conditions: ["居抜き希望", "備品譲渡希望", "事業承継にも興味あり"],
  },
];

export const salonTransitionPartners: SalonTransitionPartner[] = [
  {
    id: "partner-real-estate",
    title: "宅建業者",
    label: "Partner",
    role: "テナント契約、貸主承諾、重要事項説明の確認先",
    description: "物件や賃貸借契約に関する確認は、宅地建物取引業者や管理会社へ。",
    href: "/partners",
  },
  {
    id: "partner-tax",
    title: "税理士",
    label: "Sponsored",
    role: "事業承継、設備譲渡、開業資金、税務確認",
    description: "営業権や設備譲渡、開業時の資金計画を専門家と整理します。",
    href: "/partners",
  },
  {
    id: "partner-legal",
    title: "行政書士・弁護士",
    label: "PR",
    role: "契約書、許認可、事業譲渡、雇用の確認",
    description: "契約や法務、許認可に関わる内容は専門家確認を前提にします。",
    href: "/partners",
  },
  {
    id: "partner-dealer",
    title: "地域ディーラー",
    label: "協賛",
    role: "設備確認、開業準備、メーカー紹介、講習会、備品相談",
    description: "道具・材料・設備の現場確認や、開業準備の相談先として接続します。",
    href: "/partners/dealers",
  },
  {
    id: "partner-interior",
    title: "内装業者",
    label: "Partner",
    role: "店舗改装、設備撤去、居抜き活用、原状回復相談",
    description: "居抜き活用や原状回復、改装の範囲を専門家と確認します。",
    href: "/partners",
  },
  {
    id: "partner-insurance",
    title: "保険会社・会計ソフト",
    label: "Sponsored",
    role: "開業後の保険、会計、バックオフィス準備",
    description: "独立後の運営に必要な保険や会計の準備へつなぎます。",
    href: "/partners",
  },
];

export const transitionMonetizationItems = [
  "無料掲載",
  "詳細掲載プラン",
  "上位表示",
  "匿名掲載強化",
  "写真追加",
  "記事風紹介",
  "独立希望者へのおすすめ表示",
  "専門家・宅建業者広告",
  "ディーラー・内装業者・保険会社広告",
  "開業準備特集の協賛枠",
];

export function findSalonTransitionListing(id: string) {
  return salonTransitionListings.find((listing) => listing.id === id);
}
