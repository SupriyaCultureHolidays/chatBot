import stringSimilarity from 'string-similarity';

// Common misspellings dictionary
const corrections = {
  'agnt': 'agent',
  'agnet': 'agent',
  'agentt': 'agent',
  'emial': 'email',
  'emal': 'email',
  'emil': 'email',
  'compny': 'company',
  'compani': 'company',
  'companey': 'company',
  'naem': 'name',
  'nam': 'name',
  'nme': 'name',
  'logn': 'login',
  'loging': 'login',
  'lgin': 'login',
  'natinality': 'nationality',
  'nacionality': 'nationality',
  'nationalty': 'nationality',
  'detials': 'details',
  'detailes': 'details',
  'dtails': 'details',
  'infomation': 'information',
  'informaton': 'information',
  'info': 'information',
  'shw': 'show',
  'sho': 'show',
  'fnd': 'find',
  'fin': 'find',
  'gt': 'get',
  'gte': 'get',
  'lst': 'last',
  'las': 'last',
  'whn': 'when',
  'wen': 'when',
  'wht': 'what',
  'wat': 'what',
  'frm': 'from',
  'form': 'from',
  'wrk': 'work',
  'wrking': 'working',
  'tel': 'tell',
  'tll': 'tell'
};

// Keywords for fuzzy matching
const keywords = [
  'agent', 'email', 'company', 'name', 'login', 'nationality',
  'details', 'information', 'show', 'find', 'get', 'last',
  'when', 'what', 'from', 'working', 'tell'
];

const correctWord = (word) => {
  const lowerWord = word.toLowerCase();
  
  // Direct match in corrections
  if (corrections[lowerWord]) {
    return corrections[lowerWord];
  }
  
  // Fuzzy match with keywords
  if (lowerWord.length > 3) {
    const matches = stringSimilarity.findBestMatch(lowerWord, keywords);
    if (matches.bestMatch.rating > 0.7) {
      return matches.bestMatch.target;
    }
  }
  
  return word;
};

export const spellCorrection = (req, res, next) => {
  const { message } = req.body;
  
  if (!message) {
    return next();
  }
  
  const originalMessage = message;
  
  // Normalize and correct
  const words = message.trim().split(/\s+/);
  const correctedWords = words.map(word => {
    // Preserve special characters and case for entities
    const cleanWord = word.replace(/[^\w@.]/g, '');
    if (cleanWord.includes('@') || /^[A-Z]{2}\d+/.test(cleanWord)) {
      return word; // Preserve emails and IDs
    }
    return correctWord(word);
  });
  
  const correctedMessage = correctedWords.join(' ').trim();
  
  // Log correction
  if (originalMessage !== correctedMessage) {
    console.log(`[Spell Correction] Original: "${originalMessage}"`);
    console.log(`[Spell Correction] Corrected: "${correctedMessage}"`);
  }
  
  req.body.originalMessage = originalMessage;
  req.body.message = correctedMessage;
  
  next();
};
