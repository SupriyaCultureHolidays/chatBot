const vectorService = require('../services/vectorService');
const llmService = require('../services/llmService');
const answerExtractor = require('../utils/answerExtractor');
const { classifyIntent } = require('../services/intentService');
const { buildDynamicPrompt } = require('../services/promptService');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');
const { NotFoundError, ServiceUnavailableError } = require('../utils/errors');

exports.ask = async (req, res, next) => {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation failed', { ip: clientIp, errors: errors.array() });
            return res.status(400).json({ 
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input',
                    details: errors.array()
                }
            });
        }

        const { question } = req.body;
        logger.info('Query received', { ip: clientIp, question });

        // Step 1: Classify intent
        const intentResult = classifyIntent(question);
        logger.info('Intent detected', { 
            ip: clientIp, 
            primaryIntent: intentResult.primaryIntent,
            isListQuery: intentResult.isListQuery,
            needsLoginData: intentResult.needsLoginData
        });

        // Step 2: Handle out-of-scope early
        if (intentResult.isOutOfScope) {
            logger.info('Out of scope query', { ip: clientIp, question });
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.write("I can only answer questions about travel agent profiles and login history. Please ask something like:\n");
            res.write("- 'Find agent John Smith'\n");
            res.write("- 'Show all agents from ABC Company'\n");
            res.write("- 'When did CHAGT001 last login?'\n");
            res.write("- 'How many times did agent@email.com login?'");
            res.end();
            return;
        }

        // Step 2.5: Handle analytics queries
        if (intentResult.primaryIntent === 'MOST_ACTIVE' || intentResult.primaryIntent === 'LEAST_ACTIVE') {
            const analyticsType = intentResult.primaryIntent;
            const analyticsResults = await vectorService.getAnalytics(analyticsType, 10);
            
            if (analyticsResults.length > 0) {
                const contexts = analyticsResults.map(r => r.content);
                const prompt = buildDynamicPrompt(question, contexts, intentResult);
                
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Transfer-Encoding', 'chunked');
                
                try {
                    const result = await llmService.generate(prompt, res);
                    const totalTime = Date.now() - startTime;
                    logger.info('Analytics query completed', { totalTime, service: result.service, ip: clientIp });
                    return;
                } catch (err) {
                    logger.error('LLM failed for analytics', { error: err.message });
                }
            }
        }

        // Step 2.6: Handle nationality/country queries - get ALL profiles
        if (intentResult.primaryIntent === 'NATIONALITY_SEARCH') {
            const allProfiles = await vectorService.searchByNationality(question);
            
            if (allProfiles.length > 0) {
                const contexts = allProfiles.map(agent => vectorService._buildAgentContent(agent, intentResult.needsLoginData));
                const prompt = buildDynamicPrompt(question, contexts, intentResult);
                
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Transfer-Encoding', 'chunked');
                
                try {
                    const result = await llmService.generate(prompt, res);
                    const totalTime = Date.now() - startTime;
                    logger.info('Nationality query completed', { totalTime, count: allProfiles.length, ip: clientIp });
                    return;
                } catch (err) {
                    logger.error('LLM failed for nationality', { error: err.message });
                }
            }
        }

        // Step 3: Search relevant data with intent-based options
        const relevantDocs = await vectorService.search(question, {
            limit: intentResult.resultLimit,
            includeLogins: intentResult.needsLoginData
        });
        
        // Step 4: Handle no results
        if (relevantDocs.length === 0) {
            logger.info('No data found', { ip: clientIp, question });
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.write("No matching records found in the database for your query.");
            res.end();
            return;
        }

        // Step 5: Build context
        const contexts = relevantDocs.map(d => d.content);
        const retrievalTime = Date.now() - startTime;
        logger.info('Retrieval complete', { 
            retrievalTime, 
            docsFound: relevantDocs.length,
            intent: intentResult.primaryIntent 
        });

        // Step 6: Build dynamic prompt based on intent
        const prompt = buildDynamicPrompt(question, contexts, intentResult);

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Step 7: Generate with LLM (with fallback support)
        try {
            const result = await llmService.generate(prompt, res);
            const totalTime = Date.now() - startTime;
            logger.info('Query completed', { totalTime, service: result.service, ip: clientIp });
        } catch (err) {
            if (err.isOperational) throw err;
            logger.error('All LLM services failed, using answer extractor', { error: err.message, ip: clientIp });
            
            // Step 8: Use simple answer extractor as last resort
            try {
                const context = contexts.join('\n---\n');
                const answer = answerExtractor.extractAnswer(question, context);
                res.write(answer);
                res.end();
                logger.info('Answer extracted successfully', { ip: clientIp });
            } catch (extractError) {
                logger.error('Answer extractor failed', { error: extractError.message, ip: clientIp });
                res.write("Unable to process your query. Please try again.");
                res.end();
            }
        }

    } catch (error) {
        logger.error('Controller error', { error: error.message, stack: error.stack, ip: clientIp });
        next(error);
    }
};
