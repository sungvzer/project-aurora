enum CurrencyCode {
    KRW = 'KRW',
    AFA = 'AFA',
    ALL = 'ALL',
    DZD = 'DZD',
    ADP = 'ADP',
    AOK = 'AOK',
    ARS = 'ARS',
    AMD = 'AMD',
    AWG = 'AWG',
    AUD = 'AUD',
    BSD = 'BSD',
    BHD = 'BHD',
    BDT = 'BDT',
    BBD = 'BBD',
    BZD = 'BZD',
    BMD = 'BMD',
    BTN = 'BTN',
    BOB = 'BOB',
    BWP = 'BWP',
    BRL = 'BRL',
    GBP = 'GBP',
    BND = 'BND',
    BGN = 'BGN',
    BUK = 'BUK',
    BIF = 'BIF',
    CAD = 'CAD',
    CVE = 'CVE',
    KYD = 'KYD',
    CLP = 'CLP',
    CLF = 'CLF',
    COP = 'COP',
    XOF = 'XOF',
    XAF = 'XAF',
    KMF = 'KMF',
    XPF = 'XPF',
    CRC = 'CRC',
    CUP = 'CUP',
    CYP = 'CYP',
    CZK = 'CZK',
    DKK = 'DKK',
    YDD = 'YDD',
    DOP = 'DOP',
    XCD = 'XCD',
    TPE = 'TPE',
    ECS = 'ECS',
    EGP = 'EGP',
    SVC = 'SVC',
    EEK = 'EEK',
    ETB = 'ETB',
    EUR = 'EUR',
    FKP = 'FKP',
    FJD = 'FJD',
    GMD = 'GMD',
    GHC = 'GHC',
    GIP = 'GIP',
    XAU = 'XAU',
    GTQ = 'GTQ',
    GNF = 'GNF',
    GWP = 'GWP',
    GYD = 'GYD',
    HTG = 'HTG',
    HNL = 'HNL',
    HKD = 'HKD',
    HUF = 'HUF',
    INR = 'INR',
    IDR = 'IDR',
    XDR = 'XDR',
    IRR = 'IRR',
    IQD = 'IQD',
    IEP = 'IEP',
    ILS = 'ILS',
    JMD = 'JMD',
    JPY = 'JPY',
    JOD = 'JOD',
    KHR = 'KHR',
    KES = 'KES',
    KWD = 'KWD',
    LAK = 'LAK',
    LBP = 'LBP',
    LSL = 'LSL',
    LRD = 'LRD',
    LYD = 'LYD',
    MOP = 'MOP',
    MGF = 'MGF',
    MWK = 'MWK',
    MYR = 'MYR',
    MVR = 'MVR',
    MTL = 'MTL',
    MRO = 'MRO',
    MUR = 'MUR',
    MXP = 'MXP',
    MNT = 'MNT',
    MAD = 'MAD',
    MZM = 'MZM',
    NAD = 'NAD',
    NPR = 'NPR',
    ANG = 'ANG',
    YUD = 'YUD',
    NZD = 'NZD',
    NIO = 'NIO',
    NGN = 'NGN',
    KPW = 'KPW',
    NOK = 'NOK',
    OMR = 'OMR',
    PKR = 'PKR',
    XPD = 'XPD',
    PAB = 'PAB',
    PGK = 'PGK',
    PYG = 'PYG',
    PEN = 'PEN',
    PHP = 'PHP',
    XPT = 'XPT',
    PLN = 'PLN',
    QAR = 'QAR',
    RON = 'RON',
    RUB = 'RUB',
    RWF = 'RWF',
    WST = 'WST',
    STD = 'STD',
    SAR = 'SAR',
    SCR = 'SCR',
    SLL = 'SLL',
    XAG = 'XAG',
    SGD = 'SGD',
    SKK = 'SKK',
    SBD = 'SBD',
    SOS = 'SOS',
    ZAR = 'ZAR',
    LKR = 'LKR',
    SHP = 'SHP',
    SDP = 'SDP',
    SRG = 'SRG',
    SZL = 'SZL',
    SEK = 'SEK',
    CHF = 'CHF',
    SYP = 'SYP',
    TWD = 'TWD',
    TZS = 'TZS',
    THB = 'THB',
    TOP = 'TOP',
    TTD = 'TTD',
    TND = 'TND',
    TRY = 'TRY',
    UGX = 'UGX',
    AED = 'AED',
    UYU = 'UYU',
    USD = 'USD',
    VUV = 'VUV',
    VEF = 'VEF',
    VND = 'VND',
    YER = 'YER',
    CNY = 'CNY',
    ZRZ = 'ZRZ',
    ZMK = 'ZMK',
    ZWD = 'ZWD',
}

export const isCurrencyCode = (str: string): boolean => {
    return Object.values(CurrencyCode).includes(CurrencyCode[str]);
};

export default CurrencyCode;
