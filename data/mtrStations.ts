export interface MtrLine {
    code: string;
    name: string;
}

export interface MtrStation {
    code: string;
    name_en: string;
    name_tc: string;
}

export const mtrLines: MtrLine[] = [
    { code: 'AEL', name: 'Airport Express' },
    { code: 'TCL', name: 'Tung Chung Line' },
    { code: 'TML', name: 'Tuen Ma Line' },
    { code: 'TKL', name: 'Tseung Kwan O Line' },
    { code: 'TWL', name: 'Tsuen Wan Line' },
    { code: 'SIL', name: 'South Island Line' },
    { code: 'EAL', name: 'East Rail Line' },
    { code: 'ISL', name: 'Island Line' },
    { code: 'KTL', name: 'Kwun Tong Line' },
    { code: 'DRL', name: 'Disneyland Resort Line' },
];

export const mtrStations: { [lineCode: string]: MtrStation[] } = {
    AEL: [
        { code: "HOK", name_en: "Hong Kong", name_tc: "香港" },
        { code: "KOW", name_en: "Kowloon", name_tc: "九龍" },
        { code: "TSY", name_en: "Tsing Yi", name_tc: "青衣" },
        { code: "AIR", name_en: "Airport", name_tc: "機場" },
        { code: "AWE", name_en: "AsiaWorld-Expo", name_tc: "博覽館" },
    ],
    TCL: [
        { code: "HOK", name_en: "Hong Kong", name_tc: "香港" },
        { code: "KOW", name_en: "Kowloon", name_tc: "九龍" },
        { code: "OLY", name_en: "Olympic", name_tc: "奧運" },
        { code: "NAC", name_en: "Nam Cheong", name_tc: "南昌" },
        { code: "LAK", name_en: "Lai King", name_tc: "荔景" },
        { code: "TSY", name_en: "Tsing Yi", name_tc: "青衣" },
        { code: "SUN", name_en: "Sunny Bay", name_tc: "欣澳" },
        { code: "TUC", name_en: "Tung Chung", name_tc: "東涌" },
    ],
    TML: [
        { code: "WKS", name_en: "Wu Kai Sha", name_tc: "烏溪沙" },
        { code: "MOS", name_en: "Ma On Shan", name_tc: "馬鞍山" },
        { code: "HEO", name_en: "Heng On", name_tc: "恆安" },
        { code: "TSH", name_en: "Tai Shui Hang", name_tc: "大水坑" },
        { code: "SHM", name_en: "Shek Mun", name_tc: "石門" },
        { code: "CIO", name_en: "City One", name_tc: "第一城" },
        { code: "STW", name_en: "Sha Tin Wai", name_tc: "沙田圍" },
        { code: "CKT", name_en: "Che Kung Temple", name_tc: "車公廟" },
        { code: "TAW", name_en: "Tai Wai", name_tc: "大圍" },
        { code: "HIK", name_en: "Hin Keng", name_tc: "顯徑" },
        { code: "DIH", name_en: "Diamond Hill", name_tc: "鑽石山" },
        { code: "KAT", name_en: "Kai Tak", name_tc: "啟德" },
        { code: "SUW", name_en: "Sung Wong Toi", name_tc: "宋皇臺" },
        { code: "TKW", name_en: "To Kwa Wan", name_tc: "土瓜灣" },
        { code: "HOM", name_en: "Ho Man Tin", name_tc: "何文田" },
        { code: "HUH", name_en: "Hung Hom", name_tc: "紅磡" },
        { code: "ETS", name_en: "East Tsim Sha Tsui", name_tc: "尖東" },
        { code: "AUS", name_en: "Austin", name_tc: "柯士甸" },
        { code: "NAC", name_en: "Nam Cheong", name_tc: "南昌" },
        { code: "MEF", name_en: "Mei Foo", name_tc: "美孚" },
        { code: "TWW", name_en: "Tsuen Wan West", name_tc: "荃灣西" },
        { code: "KSR", name_en: "Kam Sheung Road", name_tc: "錦上路" },
        { code: "YUL", name_en: "Yuen Long", name_tc: "元朗" },
        { code: "LOP", name_en: "Long Ping", name_tc: "朗屏" },
        { code: "TIS", name_en: "Tin Shui Wai", name_tc: "天水圍" },
        { code: "SIH", name_en: "Siu Hong", name_tc: "兆康" },
        { code: "TUM", name_en: "Tuen Mun", name_tc: "屯門" },
    ],
    TKL: [
        { code: "NOP", name_en: "North Point", name_tc: "北角" },
        { code: "QUB", name_en: "Quarry Bay", name_tc: "鰂魚涌" },
        { code: "YAT", name_en: "Yau Tong", name_tc: "油塘" },
        { code: "TIK", name_en: "Tiu Keng Leng", name_tc: "調景嶺" },
        { code: "TKO", name_en: "Tseung Kwan O", name_tc: "將軍澳" },
        { code: "LHP", name_en: "LOHAS Park", name_tc: "康城" },
        { code: "HAH", name_en: "Hang Hau", name_tc: "坑口" },
        { code: "POA", name_en: "Po Lam", name_tc: "寶琳" },
    ],
    TWL: [
        { code: "CEN", name_en: "Central", name_tc: "中環" },
        { code: "ADM", name_en: "Admiralty", name_tc: "金鐘" },
        { code: "TST", name_en: "Tsim Sha Tsui", name_tc: "尖沙咀" },
        { code: "JOR", name_en: "Jordan", name_tc: "佐敦" },
        { code: "YMT", name_en: "Yau Ma Tei", name_tc: "油麻地" },
        { code: "MOK", name_en: "Mong Kok", name_tc: "旺角" },
        { code: "PRE", name_en: "Prince Edward", name_tc: "太子" },
        { code: "SSP", name_en: "Sham Shui Po", name_tc: "深水埗" },
        { code: "CSW", name_en: "Cheung Sha Wan", name_tc: "長沙灣" },
        { code: "LCK", name_en: "Lai Chi Kok", name_tc: "荔枝角" },
        { code: "MEF", name_en: "Mei Foo", name_tc: "美孚" },
        { code: "LAK", name_en: "Lai King", name_tc: "荔景" },
        { code: "KWF", name_en: "Kwai Fong", name_tc: "葵芳" },
        { code: "KWH", name_en: "Kwai Hing", name_tc: "葵興" },
        { code: "TWH", name_en: "Tai Wo Hau", name_tc: "大窩口" },
        { code: "TSW", name_en: "Tsuen Wan", name_tc: "荃灣" },
    ],
    SIL: [
        { code: "ADM", name_en: "Admiralty", name_tc: "金鐘" },
        { code: "OCP", name_en: "Ocean Park", name_tc: "海洋公園" },
        { code: "WCH", name_en: "Wong Chuk Hang", name_tc: "黃竹坑" },
        { code: "LET", name_en: "Lei Tung", name_tc: "利東" },
        { code: "SOH", name_en: "South Horizons", name_tc: "海怡半島" },
    ],
    EAL: [
        { code: "ADM", name_en: "Admiralty", name_tc: "金鐘" },
        { code: "EXC", name_en: "Exhibition Centre", name_tc: "會展" },
        { code: "HUH", name_en: "Hung Hom", name_tc: "紅磡" },
        { code: "MKK", name_en: "Mong Kok East", name_tc: "旺角東" },
        { code: "KOT", name_en: "Kowloon Tong", name_tc: "九龍塘" },
        { code: "TAW", name_en: "Tai Wai", name_tc: "大圍" },
        { code: "SHT", name_en: "Sha Tin", name_tc: "沙田" },
        { code: "FOT", name_en: "Fo Tan", name_tc: "火炭" },
        { code: "RAC", name_en: "Racecourse", name_tc: "馬場" },
        { code: "UNI", name_en: "University", name_tc: "大學" },
        { code: "TAP", name_en: "Tai Po Market", name_tc: "大埔墟" },
        { code: "TWO", name_en: "Tai Wo", name_tc: "太和" },
        { code: "FAN", name_en: "Fanling", name_tc: "粉嶺" },
        { code: "SHS", name_en: "Sheung Shui", name_tc: "上水" },
        { code: "LOW", name_en: "Lo Wu", name_tc: "羅湖" },
        { code: "LMC", name_en: "Lok Ma Chau", name_tc: "落馬洲" },
    ],
    ISL: [
        { code: "KET", name_en: "Kennedy Town", name_tc: "堅尼地城" },
        { code: "HKU", name_en: "HKU", name_tc: "香港大學" },
        { code: "SYP", name_en: "Sai Ying Pun", name_tc: "西營盤" },
        { code: "SHW", name_en: "Sheung Wan", name_tc: "上環" },
        { code: "CEN", name_en: "Central", name_tc: "中環" },
        { code: "ADM", name_en: "Admiralty", name_tc: "金鐘" },
        { code: "WAC", name_en: "Wan Chai", name_tc: "灣仔" },
        { code: "CAB", name_en: "Causeway Bay", name_tc: "銅鑼灣" },
        { code: "TIH", name_en: "Tin Hau", name_tc: "天后" },
        { code: "FOH", name_en: "Fortress Hill", name_tc: "炮台山" },
        { code: "NOP", name_en: "North Point", name_tc: "北角" },
        { code: "QUB", name_en: "Quarry Bay", name_tc: "鰂魚涌" },
        { code: "TAK", name_en: "Tai Koo", name_tc: "太古" },
        { code: "SWH", name_en: "Sai Wan Ho", name_tc: "西灣河" },
        { code: "SKW", name_en: "Shau Kei Wan", name_tc: "筲箕灣" },
        { code: "HFC", name_en: "Heng Fa Chuen", name_tc: "杏花邨" },
        { code: "CHW", name_en: "Chai Wan", name_tc: "柴灣" },
    ],
    KTL: [
        { code: "WHU", name_en: "Whampoa", name_tc: "黃埔" },
        { code: "HOM", name_en: "Ho Man Tin", name_tc: "何文田" },
        { code: "YMT", name_en: "Yau Ma Tei", name_tc: "油麻地" },
        { code: "MOK", name_en: "Mong Kok", name_tc: "旺角" },
        { code: "PRE", name_en: "Prince Edward", name_tc: "太子" },
        { code: "SKM", name_en: "Shek Kip Mei", name_tc: "石硤尾" },
        { code: "KOT", name_en: "Kowloon Tong", name_tc: "九龍塘" },
        { code: "LOF", name_en: "Lok Fu", name_tc: "樂富" },
        { code: "WTS", name_en: "Wong Tai Sin", name_tc: "黃大仙" },
        { code: "DIH", name_en: "Diamond Hill", name_tc: "鑽石山" },
        { code: "CHH", name_en: "Choi Hung", name_tc: "彩虹" },
        { code: "KOB", name_en: "Kowloon Bay", name_tc: "九龍灣" },
        { code: "NTK", name_en: "Ngau Tau Kok", name_tc: "牛頭角" },
        { code: "KWT", name_en: "Kwun Tong", name_tc: "觀塘" },
        { code: "LAT", name_en: "Lam Tin", name_tc: "藍田" },
        { code: "YAT", name_en: "Yau Tong", name_tc: "油塘" },
        { code: "TIK", name_en: "Tiu Keng Leng", name_tc: "調景嶺" },
    ],
    DRL: [
        { code: "SUN", name_en: "Sunny Bay", name_tc: "欣澳" },
        { code: "DIS", name_en: "Disneyland Resort", name_tc: "迪士尼" },
    ],
};

const allStationsMap = new Map<string, MtrStation>();
Object.values(mtrStations).forEach(lineStations => {
    lineStations.forEach(station => {
        if (!allStationsMap.has(station.code)) {
            allStationsMap.set(station.code, station);
        }
    });
});

export const getStationName = (line: string, code: string, lang: 'tc' | 'en' = 'tc'): string => {
    const station = allStationsMap.get(code);
    if (!station) return code;
    return lang === 'en' ? station.name_en : station.name_tc;
};

export const getLineName = (code: string): string => {
    const line = mtrLines.find(l => l.code === code);
    return line ? line.name : code;
};