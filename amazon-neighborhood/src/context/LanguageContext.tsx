import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type LanguageCode = 'EN' | 'HI' | 'TA' | 'TE' | 'KN' | 'ML' | 'BN' | 'MR'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
}

export const LANGUAGES: Language[] = [
  { code: 'EN', name: 'English',   nativeName: 'English' },
  { code: 'HI', name: 'Hindi',     nativeName: 'हिन्दी' },
  { code: 'TA', name: 'Tamil',     nativeName: 'தமிழ்' },
  { code: 'TE', name: 'Telugu',    nativeName: 'తెలుగు' },
  { code: 'KN', name: 'Kannada',   nativeName: 'ಕನ್ನಡ' },
  { code: 'ML', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'BN', name: 'Bengali',   nativeName: 'বাংলা' },
  { code: 'MR', name: 'Marathi',   nativeName: 'मराठी' },
]

// Google Translate language codes
const GOOGLE_LANG_MAP: Record<LanguageCode, string> = {
  EN: 'en',
  HI: 'hi',
  TA: 'ta',
  TE: 'te',
  KN: 'kn',
  ML: 'ml',
  BN: 'bn',
  MR: 'mr',
}

interface LanguageContextValue {
  language: LanguageCode
  setLanguage: (code: LanguageCode) => void
  t: (text: string) => string
  isTranslating: boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

// ── Translation cache to avoid re-translating the same strings ──
const translationCache: Record<string, Record<string, string>> = {}

// ── Common UI translations (pre-built for instant switching) ──
const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  EN: {},
  HI: {
    'Home': 'होम',
    'Neighborhood': 'नेबरहुड',
    'Vocal for Local': 'वोकल फॉर लोकल',
    'Fresh': 'फ्रेश',
    'Best Sellers': 'बेस्ट सेलर्स',
    'Deals': 'डील्स',
    'Prime': 'प्राइम',
    'Search': 'खोजें',
    'Search Amazon Neighborhood': 'अमेज़न नेबरहुड में खोजें',
    'Cart': 'कार्ट',
    'Sign In': 'साइन इन',
    'Sign Out': 'साइन आउट',
    'Your Account': 'आपका अकाउंट',
    'Your Orders': 'आपके ऑर्डर',
    'Green Credits': 'ग्रीन क्रेडिट्स',
    'Add to Cart': 'कार्ट में जोड़ें',
    'Buy Now': 'अभी खरीदें',
    'Sell': 'बेचें',
    'List Item': 'आइटम लिस्ट करें',
    'Wishlist': 'विशलिस्ट',
    'All': 'सभी',
    'Resell': 'पुनर्विक्रय',
    'Exchange': 'एक्सचेंज',
    'Donate': 'दान',
    'Refurbish': 'रिफर्बिश',
    'Local Artisan': 'स्थानीय कारीगर',
    'Condition': 'स्थिति',
    'Like New': 'नए जैसा',
    'Good': 'अच्छा',
    'Fair': 'ठीक',
    'Price': 'कीमत',
    'Seller': 'विक्रेता',
    'Description': 'विवरण',
    'Reviews': 'समीक्षाएं',
    'Order Confirmed': 'ऑर्डर कन्फर्म',
    'Processing': 'प्रोसेसिंग',
    'Shipped': 'शिप किया गया',
    'Delivered': 'डिलीवर किया गया',
    'CO₂ Prevention': 'CO₂ रोकथाम',
    'Landfill Prevention': 'लैंडफिल रोकथाम',
    'Trees Saved': 'पेड़ बचाए',
    'Your Rewards': 'आपके पुरस्कार',
    'Credits History': 'क्रेडिट इतिहास',
    'Browse Neighborhood': 'नेबरहुड ब्राउज़ करें',
    'Checkout': 'चेकआउट',
    'Change Language': 'भाषा बदलें',
    'You are shopping on Amazon.in': 'आप Amazon.in पर खरीदारी कर रहे हैं',
    'Change country/region': 'देश/क्षेत्र बदलें',
    'Seller Central': 'सेलर सेंट्रल',
    'Product Passport': 'प्रोडक्ट पासपोर्ट',
    'Your Green Credits': 'आपके ग्रीन क्रेडिट्स',
    'Available to redeem': 'रिडीम करने के लिए उपलब्ध',
    'Items resold': 'बेचे गए आइटम',
    'Items bought second-hand': 'सेकंड-हैंड खरीदे गए',
    'CO₂ saved': 'CO₂ बचाया',
    'Redeem Your Credits': 'अपने क्रेडिट रिडीम करें',
    'No products bought or sold yet. Start shopping on Neighborhood!': 'अभी तक कोई प्रोडक्ट खरीदा या बेचा नहीं गया। नेबरहुड पर खरीदारी शुरू करें!',
    'Keep Going, Planet Hero!': 'जारी रखें, प्लैनेट हीरो!',
    'Every second-hand purchase makes a difference': 'हर सेकंड-हैंड खरीदारी से फर्क पड़ता है',
    'off': 'छूट',
    'km away': 'किमी दूर',
    'Delivery': 'डिलीवरी',
    'FREE Delivery': 'मुफ्त डिलीवरी',
    'In Stock': 'स्टॉक में',
    'Quantity': 'मात्रा',
  },
  TA: {
    'Home': 'முகப்பு',
    'Neighborhood': 'அக்கம்பக்கம்',
    'Vocal for Local': 'உள்ளூருக்கான குரல்',
    'Search': 'தேடு',
    'Cart': 'கூடை',
    'Sign In': 'உள்நுழை',
    'Sign Out': 'வெளியேறு',
    'Your Account': 'உங்கள் கணக்கு',
    'Your Orders': 'உங்கள் ஆர்டர்கள்',
    'Green Credits': 'பசுமை கிரெடிட்ஸ்',
    'Add to Cart': 'கூடையில் சேர்',
    'Buy Now': 'இப்போது வாங்கு',
    'Sell': 'விற்கவும்',
    'All': 'அனைத்தும்',
    'Condition': 'நிலை',
    'Price': 'விலை',
    'Seller': 'விற்பனையாளர்',
    'Change Language': 'மொழியை மாற்று',
    'Browse Neighborhood': 'அக்கம்பக்கம் பார்க்க',
    'Checkout': 'செலுத்து',
    'Order Confirmed': 'ஆர்டர் உறுதிபடுத்தப்பட்டது',
    'Delivered': 'வழங்கப்பட்டது',
  },
  TE: {
    'Home': 'హోమ్',
    'Neighborhood': 'నెబర్‌హుడ్',
    'Vocal for Local': 'స్థానికానికి గళం',
    'Search': 'వెతకండి',
    'Cart': 'కార్ట్',
    'Sign In': 'సైన్ ఇన్',
    'Sign Out': 'సైన్ అవుట్',
    'Your Account': 'మీ ఖాతా',
    'Your Orders': 'మీ ఆర్డర్లు',
    'Green Credits': 'గ్రీన్ క్రెడిట్స్',
    'Add to Cart': 'కార్ట్‌కు జోడించు',
    'Buy Now': 'ఇప్పుడు కొనండి',
    'Sell': 'అమ్మండి',
    'All': 'అన్నీ',
    'Condition': 'పరిస్థితి',
    'Price': 'ధర',
    'Change Language': 'భాషను మార్చండి',
    'Browse Neighborhood': 'నెబర్‌హుడ్ చూడండి',
    'Checkout': 'చెక్అవుట్',
    'Order Confirmed': 'ఆర్డర్ నిర్ధారించబడింది',
  },
  KN: {
    'Home': 'ಮುಖಪುಟ',
    'Neighborhood': 'ನೆರೆಹೊರೆ',
    'Vocal for Local': 'ಸ್ಥಳೀಯರಿಗೆ ಧ್ವನಿ',
    'Search': 'ಹುಡುಕಿ',
    'Cart': 'ಕಾರ್ಟ್',
    'Sign In': 'ಸೈನ್ ಇನ್',
    'Sign Out': 'ಸೈನ್ ಔಟ್',
    'Green Credits': 'ಗ್ರೀನ್ ಕ್ರೆಡಿಟ್ಸ್',
    'Add to Cart': 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
    'Buy Now': 'ಈಗ ಖರೀದಿಸಿ',
    'Change Language': 'ಭಾಷೆ ಬದಲಿಸಿ',
    'Browse Neighborhood': 'ನೆರೆಹೊರೆ ಬ್ರೌಸ್ ಮಾಡಿ',
  },
  ML: {
    'Home': 'ഹോം',
    'Neighborhood': 'നെയ്ബർഹുഡ്',
    'Vocal for Local': 'പ്രാദേശികത്തിന് ശബ്ദം',
    'Search': 'തിരയുക',
    'Cart': 'കാർട്ട്',
    'Sign In': 'സൈൻ ഇൻ',
    'Sign Out': 'സൈൻ ഔട്ട്',
    'Green Credits': 'ഗ്രീൻ ക്രെഡിറ്റ്‌സ്',
    'Add to Cart': 'കാർട്ടിൽ ചേർക്കുക',
    'Buy Now': 'ഇപ്പോൾ വാങ്ങുക',
    'Change Language': 'ഭാഷ മാറ്റുക',
    'Browse Neighborhood': 'നെയ്ബർഹുഡ് ബ്രൗസ് ചെയ്യുക',
  },
  BN: {
    'Home': 'হোম',
    'Neighborhood': 'নেবারহুড',
    'Vocal for Local': 'লোকালের জন্য ভোকাল',
    'Search': 'অনুসন্ধান',
    'Cart': 'কার্ট',
    'Sign In': 'সাইন ইন',
    'Sign Out': 'সাইন আউট',
    'Green Credits': 'গ্রীন ক্রেডিটস',
    'Add to Cart': 'কার্টে যোগ করুন',
    'Buy Now': 'এখনই কিনুন',
    'Change Language': 'ভাষা পরিবর্তন করুন',
    'Browse Neighborhood': 'নেবারহুড ব্রাউজ করুন',
  },
  MR: {
    'Home': 'मुखपृष्ठ',
    'Neighborhood': 'नेबरहुड',
    'Vocal for Local': 'स्थानिकांसाठी आवाज',
    'Search': 'शोधा',
    'Cart': 'कार्ट',
    'Sign In': 'साइन इन',
    'Sign Out': 'साइन आउट',
    'Green Credits': 'ग्रीन क्रेडिट्स',
    'Add to Cart': 'कार्टमध्ये जोडा',
    'Buy Now': 'आता खरेदी करा',
    'Change Language': 'भाषा बदला',
    'Browse Neighborhood': 'नेबरहुड ब्राउझ करा',
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('EN')
  const [isTranslating, setIsTranslating] = useState(false)

  // Apply Google Translate on language change
  useEffect(() => {
    if (language === 'EN') {
      // Remove translation - restore original
      removeGoogleTranslate()
      return
    }

    applyGoogleTranslate(GOOGLE_LANG_MAP[language])
  }, [language])

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code)
  }, [])

  // Translation function: uses pre-built dictionary first, falls back to Google Translate API
  const t = useCallback((text: string): string => {
    if (language === 'EN') return text
    const dict = TRANSLATIONS[language]
    if (dict && dict[text]) return dict[text]
    return text // Google Translate handles DOM-level translation
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}

// ── Google Translate integration (translates entire page DOM) ─────────────────

function applyGoogleTranslate(targetLang: string) {
  // Set cookie that Google Translate widget reads
  document.cookie = `googtrans=/en/${targetLang};path=/;`
  document.cookie = `googtrans=/en/${targetLang};path=/;domain=${window.location.hostname}`

  // If Google Translate script is already loaded, trigger translation
  const frame = document.querySelector('.goog-te-banner-frame') as HTMLIFrameElement
  if (frame) {
    // Already loaded — use the existing widget
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement
    if (select) {
      select.value = targetLang
      select.dispatchEvent(new Event('change'))
      return
    }
  }

  // Load Google Translate script if not already present
  if (!document.getElementById('google-translate-script')) {
    // Add the hidden element Google Translate needs
    let el = document.getElementById('google_translate_element')
    if (!el) {
      el = document.createElement('div')
      el.id = 'google_translate_element'
      el.style.display = 'none'
      document.body.appendChild(el)
    }

    // Define the init callback
    ;(window as any).googleTranslateElementInit = function () {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'hi,ta,te,kn,ml,bn,mr',
          autoDisplay: false,
        },
        'google_translate_element'
      )

      // Wait for the widget to render, then set language
      setTimeout(() => {
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement
        if (select) {
          select.value = targetLang
          select.dispatchEvent(new Event('change'))
        }
      }, 1000)
    }

    // Load the script
    const script = document.createElement('script')
    script.id = 'google-translate-script'
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.body.appendChild(script)
  } else {
    // Script already loaded — just trigger language change
    setTimeout(() => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement
      if (select) {
        select.value = targetLang
        select.dispatchEvent(new Event('change'))
      }
    }, 300)
  }
}

function removeGoogleTranslate() {
  // Reset cookie
  document.cookie = 'googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = `googtrans=;path=/;domain=${window.location.hostname};expires=Thu, 01 Jan 1970 00:00:00 GMT`

  // Try to restore original page
  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement
  if (select) {
    select.value = 'en'
    select.dispatchEvent(new Event('change'))
  }

  // Fallback: reload if translation frame exists
  const frame = document.querySelector('.goog-te-banner-frame')
  if (frame) {
    // Restore original text by triggering "Show original" in translate bar
    const iframe = frame as HTMLIFrameElement
    try {
      const btn = iframe.contentDocument?.querySelector('.goog-close-link') as HTMLElement
      if (btn) btn.click()
    } catch {
      // Cross-origin — just reload
      window.location.reload()
    }
  }
}
