class IntentClassifier {
  constructor() {
    this.patterns = [
      {
        name: 'AGENT_BY_ID',
        pattern: /\b(find|show|get|lookup)\s+.*\b(CHAGT\d+|AG\d+)\b/i,
        priority: 10,
        isList: false
      },
      {
        name: 'AGENT_BY_EMAIL',
        pattern: /\b[\w.-]+@[\w.-]+\.\w+\b/,
        priority: 10,
        isList: false
      },
      {
        name: 'LAST_LOGIN',
        pattern: /\b(last|latest|most recent)\s+(login|logged in|signed in)\b/i,
        priority: 9,
        isList: false
      },
      {
        name: 'FIRST_LOGIN',
        pattern: /\b(first|initial|earliest)\s+(login|logged in)\b/i,
        priority: 9,
        isList: false
      },
      {
        name: 'LOGIN_HISTORY',
        pattern: /\b(login history|all logins|show logins)\b/i,
        priority: 8,
        isList: true
      },
      {
        name: 'RECENT_LOGINS',
        pattern: /\b(recent|last \d+|past \d+)\s+(logins|login records)\b/i,
        priority: 8,
        isList: true
      },
      {
        name: 'LOGIN_COUNT',
        pattern: /\b(how many times|login count|number of logins|total logins)\b/i,
        priority: 7,
        isList: false
      },
      {
        name: 'AGENTS_BY_COMPANY',
        pattern: /\b(agents?|employees?|people)\s+(from|at|in|working)\s+\w+/i,
        priority: 7,
        isList: true
      },
      {
        name: 'AGENTS_BY_NATIONALITY',
        pattern: /\b(indian|american|british|canadian)\s+(agents?|people)\b/i,
        priority: 7,
        isList: true
      },
      {
        name: 'MOST_ACTIVE',
        pattern: /\b(most active|most frequently|most logins|top agent)\b/i,
        priority: 6,
        isList: false
      },
      {
        name: 'LEAST_ACTIVE',
        pattern: /\b(least active|fewest logins|least frequently)\b/i,
        priority: 6,
        isList: false
      },
      {
        name: 'COUNT_QUERY',
        pattern: /\b(how many|count|total|number of)\s+(agents?|logins?)\b/i,
        priority: 5,
        isList: false
      }
    ];
  }

  classify(query) {
    const matches = this.patterns
      .filter(p => p.pattern.test(query))
      .sort((a, b) => b.priority - a.priority);
    
    if (matches.length === 0) {
      return { intent: 'UNKNOWN', isList: false, resultLimit: 1 };
    }
    
    const best = matches[0];
    return {
      intent: best.name,
      isList: best.isList,
      resultLimit: best.isList ? 20 : 1
    };
  }
}

export default new IntentClassifier();
