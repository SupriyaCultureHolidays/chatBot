export const localhostOnly = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const cleanIp = ip.replace('::ffff:', '');
  
  if (cleanIp !== '127.0.0.1' && cleanIp !== '::1' && !cleanIp.includes('127.0.0.1')) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied: Internal endpoints only accessible from localhost' 
    });
  }
  next();
};

export const sanitizeInput = (req, res, next) => {
  ['agentId', 'agent_id', 'email', 'company', 'nationality', 'agent_name'].forEach(field => {
    if (req.body[field]) {
      req.body[field] = req.body[field]
        .replace(/^mailto:/i, '')
        .replace(/^javascript:/i, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim();
    }
  });
  
  if (req.body.message) {
    const msg = req.body.message;
    if (/;\s*(DROP|DELETE|UPDATE|INSERT|ALTER)\s+/i.test(msg)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input detected' 
      });
    }
  }
  
  next();
};
