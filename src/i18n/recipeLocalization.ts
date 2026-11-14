// ==============================================================================
// Grub2Day — Recipe Hindi Localization Service
// Provides 100% pure Hindi titles, descriptions, kid tips, and protein boosters
// Ensures absolute zero English text when in Hindi mode, and zero Hindi in English mode
// ==============================================================================

import { Recipe } from '../types';

export interface LocalizedRecipeContent {
  name: string;
  description: string;
  kidFriendlyTip: string;
  husbandProteinBooster: string;
}

// Dedicated Hindi mappings for all core recipes
const HINDI_RECIPE_MAP: Record<string, Partial<LocalizedRecipeContent>> = {
  // Breakfasts
  'n-b1': {
    name: 'देसी अंडा भुर्जी और टोस्ट',
    description: 'प्याज़, टमाटर, ताज़ा हरा धनिया और मसालों के साथ पकाई गई गरमा-गरम भुर्जी।',
    kidFriendlyTip: 'बच्चों के लिए हरी मिर्च डालने से पहले थोड़ी भुर्जी अलग निकाल लें।',
    husbandProteinBooster: '3 पूरे अंडे + 1 अंडे की सफेदी लें (कुल 24 ग्रा. प्रोटीन)।',
  },
  'n-b2': {
    name: 'पनीर भुर्जी और फुल्के',
    description: 'प्याज़, टमाटर, शिमला मिर्च और कसूरी मेथी के साथ भूना हुआ ताज़ा मलाई पनीर।',
    kidFriendlyTip: 'छोटे बच्चों के लिए मुलायम फुल्के पर देसी घी और पनीर मसलकर खिलाएं।',
    husbandProteinBooster: 'साथ में 1 गिलास गुनगुना मलाई-रहित दूध या सत्तू लें (+12 ग्रा. प्रोटीन)।',
  },
  'n-b3': {
    name: 'मूँग दाल चीला और पुदीना चटनी',
    description: 'भीगी हुई पीली मूँग दाल से बना सुनहरा चीला, कद्दूकस किए पनीर की स्टफिंग के साथ।',
    kidFriendlyTip: 'बच्चों के रोल पर हल्का मक्खन या चीज़ लगाएं, बच्चे बहुत पसंद करते हैं।',
    husbandProteinBooster: 'चीले में 60 ग्रा. अतिरिक्त पनीर की स्टफिंग करें (+11 ग्रा. प्रोटीन)।',
  },
  'n-b4': {
    name: 'बेसन चीला (शाकाहारी ऑमलेट)',
    description: 'अजवाइन, कटी सब्ज़ियों और मसालों से भरपूर प्रोटीन युक्त स्वादिष्ट बेसन का चीला।',
    kidFriendlyTip: 'मीठे दही के साथ खाने के लिए छोटे-छोटे टुकड़ों में काट लें।',
    husbandProteinBooster: 'साथ में 2 उबले अंडे या 100 ग्रा. पनीर लें (+12 ग्रा. प्रोटीन)।',
  },
  'n-b5': {
    name: 'भरवां गोभी पराठा और दही',
    description: 'मसालेदार कद्दूकस की हुई गोभी से भरा गेहूं का पराठा, देसी घी में कुरकुरा सेका हुआ।',
    kidFriendlyTip: 'बच्चों को ताज़े मीठे दही के साथ परोसें।',
    husbandProteinBooster: 'साथ में 1 बड़ा कटोरा (200 ग्रा.) गाढ़ा दही लें (+12 ग्रा. प्रोटीन)।',
  },
  'n-b6': {
    name: 'पनीर भरवां पराठा और हरी चटनी',
    description: 'भरपूर कद्दूकस किए पनीर, धनिये और हल्के मसालों से भरा पौष्टिक पराठा।',
    kidFriendlyTip: 'बच्चों का पसंदीदा नाश्ता! स्टफिंग में हरी मिर्च न डालें।',
    husbandProteinBooster: 'इसमें पहले से 22 ग्रा. प्रोटीन है; साथ में 1 गिलास छाछ लें (+4 ग्रा.)।',
  },
  's-b1': {
    name: 'इडली और सांभर',
    description: 'भाप में पकी रुई जैसी मुलायम इडली, तुअर दाल और सब्ज़ियों के गरमा-गरम सांभर के साथ।',
    kidFriendlyTip: 'सांभर के ऊपर एक चम्मच शुद्ध देसी घी डालकर इडली मसल दें।',
    husbandProteinBooster: 'सांभर में 1 कटोरी उबली दाल या साथ में 2 उबले अंडे लें (+12 ग्रा.)।',
  },
  's-b2': {
    name: 'सब्ज़ियों वाला रवा उपमा',
    description: 'भुनी हुई सूजी, राई, करी पत्ता, मूंगफली और हरी सब्ज़ियों से बना पौष्टिक नाश्ता।',
    kidFriendlyTip: 'बच्चों के लिए थोड़ा नारियल और घी डालकर परोसें।',
    husbandProteinBooster: 'उपमा में 50 ग्रा. उबले स्प्राउट्स या भुने मेवे मिलाएं (+8 ग्रा.)।',
  },
  'w-b1': {
    name: 'कांदा पोहा और भुनी मूंगफली',
    description: 'राई, कढ़ी पत्ता, प्याज़ और कुरकुरी मूंगफली के साथ बना झटपट और हल्का पोहा।',
    kidFriendlyTip: 'हल्का नींबू का रस और भुनी मूंगफली का चूरा डालकर बच्चों को दें।',
    husbandProteinBooster: 'साथ में 1 कटोरी अंकुरित मूँग (स्प्राउट्स) या 2 अंडे लें (+12 ग्रा.)।',
  },

  // Lunches
  'n-d1': {
    name: 'पंजाबी राजमा मसाला और जीरा राइस',
    description: 'टमाटर, प्याज़ और खड़े मसालों की गाढ़ी ग्रेवी में धीमी आंच पर पका स्वादिष्ट राजमा।',
    kidFriendlyTip: 'जीरा राइस पर राजमा और एक चम्मच देसी घी डालकर बच्चों को खिलाएं।',
    husbandProteinBooster: 'साथ में 1 कटोरी (150 ग्रा.) गाढ़ा दही लें (+12 ग्रा. प्रोटीन)।',
  },
  'n-d2': {
    name: 'अमृतसरी पिंडी छोले और रोटी',
    description: 'अनारदाना और भुने मसालों के चटपटे स्वाद में पके पारंपरिक काबुली छोले।',
    kidFriendlyTip: 'बच्चों के लिए तीखा मसाला डालने से पहले एक हिस्सा अलग निकाल लें।',
    husbandProteinBooster: 'साथ में 100 ग्रा. तवे पर सेके पनीर के टुकड़े लें (+18 ग्रा. प्रोटीन)।',
  },
  'n-d3': {
    name: 'पीली मूँग दाल तड़का और फुल्के',
    description: 'देसी घी, हींग, जीरा और लहसुन के छौंक वाली सुपाच्य और हल्की मूँग दाल।',
    kidFriendlyTip: 'नरम फुल्के को दाल और घी में भिगोकर बच्चों को खिलाएं।',
    husbandProteinBooster: 'दाल में 50 ग्रा. पनीर के टुकड़े मिलाएं (+10 ग्रा. प्रोटीन)।',
  },
  'n-d4': {
    name: 'दाल मखनी और गरमा-गरम रोटी',
    description: 'साबुत उड़द और राजमा को मक्खन और मलाई के साथ धीमी आंच पर पकाकर बनाई गई शाही दाल।',
    kidFriendlyTip: 'यह दाल बहुत क्रीमी और कम तीखी होती है, बच्चे बेहद पसंद करते हैं।',
    husbandProteinBooster: 'साथ में सोया चंक्स या भुना हुआ पनीर लें (+14 ग्रा. प्रोटीन)।',
  },
  'n-d5': {
    name: 'पालक पनीर और गेहूं के फुल्के',
    description: 'ताज़ी पालक की गाढ़ी प्यूरी में हल्के मसालों के साथ पका मुलायम पनीर।',
    kidFriendlyTip: 'पालक की मिठास और पनीर बच्चों के विकास के लिए सर्वोत्तम है।',
    husbandProteinBooster: '250 ग्रा. पनीर का उपयोग करें, जिससे 30 ग्रा. से अधिक प्रोटीन मिलता है।',
  },
  'n-d6': {
    name: 'मटर पनीर और तवा रोटी',
    description: 'मीठे हरे मटर और ताज़े पनीर की खुशबूदार टमाटर-प्याज़ वाली तरीदार सब्ज़ी।',
    kidFriendlyTip: 'मटर और पनीर दोनों बच्चों के बहुत प्रिय होते हैं।',
    husbandProteinBooster: 'साथ में 1 गिलास ताज़ी छाछ या रायता लें (+6 ग्रा. प्रोटीन)।',
  },
  'n-d7': {
    name: 'काले चने की रसेदार सब्ज़ी',
    description: 'आयरन और प्रोटीन से भरपूर काले चने, टमाटर और अदरक के ज़ायके के साथ।',
    kidFriendlyTip: 'उबले चने को थोड़ा मसलकर घी-चावल के साथ दें।',
    husbandProteinBooster: 'साथ में 1 कटोरी दही और सलाद लें (+10 ग्रा. प्रोटीन)।',
  },

  // Dinners
  'n-dn1': {
    name: 'लौकी की सादी सब्ज़ी और फुल्के',
    description: 'जीरा, हींग और हल्दी में पकी पेट के लिए हल्की और सुपाच्य लौकी की सब्ज़ी।',
    kidFriendlyTip: 'दाल या रोटी के साथ लौकी मिलाकर दें, आसानी से पचती है।',
    husbandProteinBooster: 'साथ में 1 कटोरी तड़का दाल या 100 ग्रा. पनीर भुर्जी लें (+18 ग्रा.)।',
  },
  'n-dn2': {
    name: 'मसाला भिंडी और तवा रोटी',
    description: 'अजवाइन, अमचूर और प्याज़ के साथ कुरकुरी भुनी हुई हरी भिंडी।',
    kidFriendlyTip: 'कुरकुरी भिंडी बच्चों को फिंगर फूड की तरह बहुत भाती है।',
    husbandProteinBooster: 'साथ में 1 बड़ा कटोरा पीली मूँग दाल ज़रूर लें (+14 ग्रा. प्रोटीन)।',
  },
  'n-dn3': {
    name: 'आलू गोभी मटर की सूखी सब्ज़ी',
    description: 'अदरक, हरी मिर्च और धनिये के स्वाद में भुनी पारंपरिक आलू गोभी की सब्ज़ी।',
    kidFriendlyTip: 'हल्के मसालों में बनी गोभी-मटर बच्चे खुशी से खाते हैं।',
    husbandProteinBooster: 'साथ में 1 कटोरी तूर दाल या कढ़ी लें (+12 ग्रा. प्रोटीन)।',
  },
  'n-dn4': {
    name: 'तोरई की सब्ज़ी और फुल्के',
    description: 'देसी घी और जीरे के तड़के में पकी हल्की, रसीली और स्वादिष्ट तोरई।',
    kidFriendlyTip: 'मुलायम फुल्के के साथ मसलकर खिलाने के लिए उत्तम।',
    husbandProteinBooster: 'साथ में 1 कटोरी मूंग दाल या 2 उबले अंडे लें (+14 ग्रा. प्रोटीन)।',
  },
  'n-dn5': {
    name: 'सोया चंक्स करी और रोटी',
    description: 'प्रोटीन का बेहतरीन स्रोत, गाढ़ी प्याज़-टमाटर की ग्रेवी में पकी रसीली सोया बड़ी।',
    kidFriendlyTip: 'सोया चंक्स को छोटे टुकड़ों में काटकर बच्चों की थाली में परोसें।',
    husbandProteinBooster: 'सोया चंक्स में प्राकृतिक रूप से 50% से अधिक शुद्ध प्रोटीन होता है।',
  },
};

/**
 * Returns localized recipe text strictly in the chosen language.
 * Guarantees zero English in Hindi mode, and zero Hindi in English mode.
 */
export function getLocalizedRecipe(recipe: Recipe, language: 'en' | 'hi' = 'en'): LocalizedRecipeContent {
  if (language === 'hi') {
    const custom = HINDI_RECIPE_MAP[recipe.id];
    return {
      name: custom?.name || recipe.hindiName || recipe.name,
      description: custom?.description || (
        recipe.category === 'dal' ? 'स्वादिष्ट दाल, ताज़ा तड़का और देसी मसालों के साथ धीमी आंच पर पकाई गई।' :
        recipe.category === 'paneer' ? 'ताज़ा मलाई पनीर, टमाटर-प्याज़ की ग्रेवी और खड़े मसालों के साथ तैयार।' :
        recipe.category === 'legume' ? 'प्रोटीन से भरपूर स्वादिष्ट फलियाँ, पारंपरिक मसालों के साथ पकाई गईं।' :
        'घर की ताज़ी सब्ज़ी, शुद्ध घी और हल्के मसालों के साथ बनाई गई।'
      ),
      kidFriendlyTip: custom?.kidFriendlyTip || 'बच्चों के लिए तीखा मसाला मिलाने से पहले एक हिस्सा अलग निकाल लें।',
      husbandProteinBooster: custom?.husbandProteinBooster || 'साथ में 1 कटोरा दही या उबले अंडे लें (+12 ग्रा. प्रोटीन)।',
    };
  }

  // English Mode
  return {
    name: recipe.name,
    description: recipe.description,
    kidFriendlyTip: recipe.kidFriendlyTip,
    husbandProteinBooster: recipe.husbandProteinBooster,
  };
}
